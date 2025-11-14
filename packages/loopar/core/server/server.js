'use strict';

import cookieParser from "cookie-parser";
import useragent from "express-useragent";
import express from "express";
import { loopar } from "../loopar.js";
import Router from "./router/router.js";
import path from "pathe";
import compression from 'compression';
import serveStatic from 'serve-static';
import { createServer as createViteServer } from 'vite';
import tenantSessionMiddleware from "./tenant-session.js"

export class Server extends Router {
  express = express;
  server = new express();
  url = null;
  isProduction = process.env.NODE_ENV == 'production';
  uploadPath = "uploads";

  constructor() { super() }

  async initialize() {
    if (!this.isProduction) {
      this.vite = await createViteServer({
        server: {
          middlewareMode: true,
          hmr: {
            protocol: 'ws',
            host: 'localhost',
            port: parseInt(process.env.PORT) + 10000,
          }
        },
        appType: 'custom'
      });

      this.server.use(this.vite.middlewares);
    } else {
      this.server.use(compression());

      this.server.use(
        serveStatic(path.join(loopar.pathRoot, 'dist'), {
          setHeaders: (res, path) => {
            if (path.endsWith('.gz')) {
              res.setHeader('Content-Encoding', 'gzip');
              res.setHeader('Content-Type', 'application/javascript');
            }
            if (path.endsWith('.br')) {
              res.setHeader('Content-Encoding', 'br');
              res.setHeader('Content-Type', 'application/javascript');
            }
          },
        })
      );
    }

    await this.#exposePublicDirectories();
    this.server.use(useragent.express());
    
    this.#initializeSession();
    this.route();
    this.#start();
  }

  #initializeSession() {
    this.server.use(cookieParser());
    this.server.use(this.express.json());
    this.server.use(this.express.urlencoded({ extended: true }));
    this.server.use(tenantSessionMiddleware);
  }

  async #exposePublicDirectories() {
    if (process.env.NODE_ENV == 'production') {
      this.server.use(serveStatic(path.join(loopar.pathRoot, 'dist/client')));
    }

    this.server.use("/assets/public", serveStatic(path.join(loopar.pathRoot, "public")));
    this.server.use("/assets/public", serveStatic(path.join(loopar.pathRoot, this.uploadPath, "public")));
    /* because need to define directory like images */
    this.server.use("/assets/public/images", serveStatic(path.join(loopar.pathRoot, this.uploadPath, "public")));

    await this.exposeClientAppFiles();
  }

  async exposeClientAppFiles(appName) {
    if (loopar.__installed__) {
      const installedsApps = await loopar.db.getAll("App", ["name"], appName ? { "=": { name: appName } } : null);

      for (const app of installedsApps) {
        const appPath = loopar.makePath(loopar.pathRoot, "apps", app.name, this.uploadPath, "public");

        console.log("Exposing public directory for: " + app.name)
        this.server.use("/assets/public", serveStatic(appPath));
        this.server.use("/assets/public/images", serveStatic(appPath));
      }
    }
  }

  #start() {
    loopar.server = this;
    const port = process.env.PORT;

    const installMessage = loopar.__installed__ ? '' : '\n\nContinue in your browser to complete the installation';

    this.server.listen(port, () => {
      console.log("Server is started in " + port + installMessage);
    });

    const serverClose =  () => {
      try {
        this.server && this.server.close(() => {
          console.log("Express server closed");
          process.exit(0);
        });
      }catch (err) {
        console.error(err);
      }
    }
    /*process.on("SIGINT", () => {
      serverClose();
    });

    process.on("SIGTERM", () => {
      serverClose();
    });*/
  }
}