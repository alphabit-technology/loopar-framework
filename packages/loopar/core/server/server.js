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
const server = new express();


export class Server extends Router {
  server = server;
  url = null;
  isProduction = process.env.NODE_ENV == 'production';
  uploadPath = "uploads";

  constructor() { super() }

  async initialize() {
    if (this.isProduction) {
      server.use(compression());

      server.use(zstdMiddleware({
        root: 'dist/client',
        priority: ['zst', 'br', 'gz'], // Esto ya busca .br y .gz
      }));
      /* server.use(zstdMiddleware({
        root: 'dist/client',
        priority: ['br', 'gz'],
      })); */
    } else {
      this.vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            protocol: 'ws',
            port: parseInt(process.env.PORT) + 10000,
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
    server.use(cookieParser());
    server.use(express.json());
    server.use(express.urlencoded({ extended: true }));
    server.use(tenantContextMiddleware);
  }

  async #exposePublicDirectories() {
    if (process.env.NODE_ENV == 'production') {
      server.use(serveStatic(path.join(loopar.pathRoot, 'dist/client')));
    }

    server.use("/assets/public", serveStatic(path.join(loopar.pathRoot, "public")));
    server.use("/assets/public", serveStatic(path.join(loopar.pathRoot, this.uploadPath, "public")));
    /* because need to define directory like images */
    server.use("/assets/public/images", serveStatic(path.join(loopar.pathRoot, this.uploadPath, "public")));

    server.use("/assets/public", serveStatic(path.join(loopar.tenantPath, "public")));
    server.use("/assets/public", serveStatic(path.join(loopar.tenantPath, this.uploadPath, "public")));
    server.use("/assets/public/theme.css", serveStatic(path.join(loopar.tenantPath, "theme.css")));
    /* because need to define directory like images */
    server.use("/assets/public/images", serveStatic(path.join(loopar.tenantPath, this.uploadPath, "public")));

    await this.exposeClientAppFiles();
  }

  async exposeClientAppFiles(appName) {
    if (loopar.__installed__) {
      for (const app of loopar.installedApps) {
        const appPath = loopar.makePath(loopar.pathRoot, "apps", app, this.uploadPath, "public");

        console.log("Exposing public directory for: " + app)
        server.use("/assets/public", serveStatic(appPath));
        server.use("/assets/public/images", serveStatic(appPath));
      }
    }
  }

  #start() {
    const port = process.env.PORT;
    const installMessage = loopar.__installed__ ? '' : '\n\nContinue in your browser to complete the installation';

    server.listen(port, () => {
      console.log("Server is started in " + port + installMessage);
    });
  }
}