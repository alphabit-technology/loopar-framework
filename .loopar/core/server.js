'use strict';

import cookieParser from "cookie-parser";
import session from 'express-session';
import useragent from "express-useragent";
import express from "express";
import { loopar } from "./loopar.js";
import Router from "./router.js";
import path from "path";


import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createServer as createViteServer } from 'vite'

class Server extends Router {
  express = express;
  server = new express();
  url = null;

  constructor() { super() }

  async initialize() {
    await loopar.initialize();
    this.vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });

    this.server.use(this.vite.middlewares);
    this.server.use(useragent.express());


    await this.#exposePublicDirectories();
    this.#initializeSession();
    this.route();
    this.#start();
  }

  #initializeSession() {
    const sessionConfig = env.serverConfig.session;
    sessionConfig.maxAge = sessionConfig.maxAge * 1000 * 60 * 60 * 24;

    this.server.set('view engine', 'pug');
    this.server.use(cookieParser());
    this.server.use(this.express.json());
    this.server.use(this.express.urlencoded({ extended: true }));
    this.server.use(session(sessionConfig));
  }

  async #exposePublicDirectories() {
    const publicDirs = [
      'public',
      'node_modules/particles.js'
      /*'src',
      'public', "public/js",
      'node_modules/loopar/core/global',
      'node_modules/loopar/public',
      'node_modules/dayjs',
      'node_modules/mime-types',
      'node_modules/twig',*/
    ];
    publicDirs.forEach(dir => {
      this.server.use(this.express.static(path.join(loopar.pathRoot, dir)));
    });

    this.server.use(express.static(path.join(__dirname, '..', 'dist')));
    await this.exposeClientAppFiles();
  }

  async exposeClientAppFiles(appName) {
    if (loopar.frameworkInstalled) {
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

    const install_message = loopar.frameworkInstalled ? '' : '\n\nContinue in your browser to complete the installation';

    this.server.listen(port, () => {
      console.log("Server is started in " + port + install_message);
    });
  }
}

export const server = new Server();