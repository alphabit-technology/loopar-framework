'use strict';

import cookieParser from "cookie-parser";
import { express as useragent } from "express-useragent";
import express from "express";
import { loopar } from "../loopar.js";
import Router from "./router/router.js";
import path from "pathe";
import compression from 'compression';
import serveStatic from 'serve-static';
import { createServer as createViteServer } from 'vite';
import tenantContextMiddleware from "./tenant-context.js"
import { zstdMiddleware } from './zstd-compression.js';
import { requestContext } from './router/request-context.js';
import http from "http";
import net from "node:net";
import { RealtimeManager } from "../realtime/RealtimeManager.js";

const server = new express();

/** HMR port = HTTP port + this offset (kept in sync with vite hmr config below). */
const HMR_PORT_OFFSET = 10000;

/** Probe a TCP port — resolves true if nothing is listening, false otherwise. */
function isPortFree(port) {
  return new Promise((resolve) => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => tester.close(() => resolve(true)));
    tester.listen(port, "0.0.0.0");
  });
}

/**
 * Find an HTTP port `p` such that BOTH `p` and `p + HMR_PORT_OFFSET` are free.
 * Returns the chosen port or `null` if no pair is free in [start, start+maxTries).
 */
async function findFreePortPair(startPort, maxTries = 100) {
  for (let p = startPort; p < startPort + maxTries; p++) {
    if ((await isPortFree(p)) && (await isPortFree(p + HMR_PORT_OFFSET))) {
      return p;
    }
  }
  return null;
}

export class Server extends Router {
  server = server;
  url = null;
  isProduction = process.env.NODE_ENV == 'production';
  uploadPath = "uploads";

  constructor() { super() }

  async initialize() {
    // Resolve port BEFORE Vite (which baked in PORT+10000 for HMR) and BEFORE
    // any listen call. In dev, if either the HTTP port or its HMR sibling is
    // taken, auto-shift to the next free pair and update process.env.PORT.
    // Production never shifts: with Caddy fronting tenants by domain, ports
    // are stable contracts; an EADDRINUSE in production should fail loud.
    const requestedPort = parseInt(process.env.PORT, 10);
    if (Number.isNaN(requestedPort)) {
      throw new Error(`Invalid PORT env: "${process.env.PORT}"`);
    }

    if (!this.isProduction) {
      const httpFree = await isPortFree(requestedPort);
      const hmrFree = await isPortFree(requestedPort + HMR_PORT_OFFSET);

      if (!httpFree || !hmrFree) {
        const newPort = await findFreePortPair(requestedPort);
        if (newPort === null) {
          throw new Error(
            `No free port pair found starting at ${requestedPort} (HTTP) / ` +
            `${requestedPort + HMR_PORT_OFFSET} (HMR). Free up some ports and retry.`
          );
        }
        const reason = !httpFree ? `HTTP ${requestedPort}` : `HMR ${requestedPort + HMR_PORT_OFFSET}`;
        console.warn(
          `\n⚠️  Port ${reason} is busy. Auto-shifting to ${newPort} (HMR ${newPort + HMR_PORT_OFFSET}) for this run.`
        );
        console.warn(
          `   To make it persistent, edit sites/<tenant>/.env and set PORT=${newPort}\n`
        );
        process.env.PORT = String(newPort);
      }
    }

    if (this.isProduction) {
      server.use(compression());
      server.use(zstdMiddleware({
        root: 'dist/client',
        priority: ['zst', 'br', 'gz'],
      }));
    } else {
      this.vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            protocol: 'ws',
            port: parseInt(process.env.PORT) + HMR_PORT_OFFSET,
          }
        },
        appType: 'custom'
      });
      server.use(this.vite.middlewares);
    }

    await this.#exposePublicDirectories();
    server.use(useragent());
    this.#initializeSession();
    this.route();
    this.#start();
  }

  #initializeSession() {
    server.use((req, res, next) => {
      requestContext.run({ req, res }, next);
    });
    server.use(cookieParser());
    server.use(express.json({ limit: '50mb' }));
    server.use(express.urlencoded({ extended: true, limit: '50mb' }));
    server.use(tenantContextMiddleware);
  }

  async #exposePublicDirectories() {
    if (process.env.NODE_ENV == 'production') {
      server.use(serveStatic(path.join(loopar.pathRoot, 'dist/client')));
    }

    server.use("/assets/public", serveStatic(path.join(loopar.pathRoot, "public")));
    server.use("/assets/public", serveStatic(path.join(loopar.pathRoot, this.uploadPath, "public")));
    server.use("/assets/public", serveStatic(path.join(loopar.tenantPath, "public")));
    server.use("/assets/public", serveStatic(path.join(loopar.tenantPath, this.uploadPath, "public")));
    server.get("/assets/public/theme.css", (_req, res, next) => {
      res.sendFile(path.join(loopar.tenantPath, "theme.css"), (err) => {
        if (err) next();
      });
    });

    await this.exposeClientAppFiles();
  }

  async exposeClientAppFiles() {
    if (loopar.__installed__) {
      for (const app of Object.keys(loopar.installedApps)) {
        const appPath = loopar.makePath(loopar.pathRoot, "apps", app, this.uploadPath, "public");
        console.log("Exposing public directory for: " + app);
        server.use("/assets/public", serveStatic(appPath));
      }
    }
  }

  #start() {
    const port = process.env.PORT;
    const installMessage = loopar.__installed__ ? '' : '\n\nContinue in your browser to complete the installation';

    const httpServer = http.createServer(server);

    // Catch EADDRINUSE with an actionable message instead of a raw stack trace.
    // In dev this is a fallback (initialize() already resolved a free pair);
    // in production this is the primary signal that a port collided.
    httpServer.on("error", (err) => {
      if (err && err.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${port} is already in use.`);
        console.error(`   Inspect:   lsof -nP -iTCP:${port} -sTCP:LISTEN`);
        console.error(`   Change:    edit sites/${loopar.tenantId ?? "<tenant>"}/.env (PORT=...) and restart.`);
        console.error(`   In dev, restart Loopar and it will auto-shift to a free port.\n`);
        process.exit(1);
      }
      throw err;
    });

    RealtimeManager.attach(httpServer, {
      tenantId: loopar.tenantId,
      getJwtSecret: () => loopar.jwtSecret,
    });
    //RealtimeManager.namespace(loopar.tenantId);

    httpServer.listen(port, () => {
      console.log("Server is started in " + port + installMessage);
    });
  }
}