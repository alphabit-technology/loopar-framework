'use strict';

import cookieParser from "cookie-parser";
import session from 'express-session';
import useragent from "express-useragent";
import express from "express";
import { loopar } from "./loopar.js";
import Router from "./router.js";
import path from "pathe";

/*const compression = require('compression');
const serveStatic = require('serve-static');*/

import compression from 'compression';
import serveStatic from 'serve-static';

import { createServer as createViteServer } from 'vite'

class Server extends Router {
  express = express;
  server = new express();
  url = null;
  isProduction = process.env.NODE_ENV == 'production';

  constructor() { super() }

  async initialize() {
    await loopar.initialize();

    if (!this.isProduction) {
      this.vite = await createViteServer({
        server: { middlewareMode: true },
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

    this.server.use(useragent.express());
    await this.#exposePublicDirectories();
    this.#initializeSession();
    this.route();
    this.#start();
  }

  #initializeSession() {
    const sessionConfig = env.serverConfig.session;
    sessionConfig.maxAge = sessionConfig.maxAge * 1000 * 60 * 60 * 24;

    this.server.use(cookieParser());
    this.server.use(this.express.json());
    this.server.use(this.express.urlencoded({ extended: true }));
    this.server.use(session(sessionConfig));
  }

  async #exposePublicDirectories() {
    const publicDirs = ['public'];

    if (process.env.NODE_ENV == 'production') {
      publicDirs.push('dist/client');
    } else {
      publicDirs.push('public');
    }

    publicDirs.push('node_modules/particles.js');

    publicDirs.forEach(dir => {
      this.server.use(this.express.static(path.join(loopar.pathRoot, dir)));
    });

    await this.exposeClientAppFiles();
  }

  async exposeClientAppFiles(appName) {
    if (loopar.__installed__) {
      const installedsApps = await loopar.db.getAll("App", ["name"], appName ? { "=": { name: appName } } : null);

      for (const app of installedsApps) {
        const appPath = loopar.makePath(loopar.pathRoot, "apps", app.name, "public");

        console.log("Exposing public directory for: " + app.name)
        this.server.use(this.express.static(appPath));
      }
    }
  }

  #start() {
    loopar.server = this;
    const port = env.serverConfig.port;

    const installMessage = loopar.__installed__ ? '' : '\n\nContinue in your browser to complete the installation';

    this.server.listen(port, () => {
      console.log("Server is started in " + port + installMessage);
    });

    process.on("SIGINT", () => {
      this.server.close(() => {
        console.log("Express server closed by SIGINT");
        process.exit(0);
      });
    });

    process.on("SIGTERM", () => {
      this.server.close(() => {
        console.log("Express server closed by SIGTERM");
        process.exit(0);
      });
    });
  }
}

export const server = new Server();