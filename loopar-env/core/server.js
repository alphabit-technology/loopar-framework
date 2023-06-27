'use strict';

import cookieParser from "cookie-parser";
import session from 'express-session';
import express from "express";
import {loopar} from "./loopar.js";
import Router from "./router.js";
import path from "path";

class Server extends Router{
   express = express;
   server = new express();
   url = null;

   constructor() {super()}

   async initialize() {
      await loopar.initialize();

      this.#expose_public_directories();
      this.#initialize_session();
      this.route();
      this.#start();
   }

   #initialize_session() {
      const session_config = env.server_config.session;
      session_config.maxAge = session_config.maxAge * 1000 * 60 * 60 * 24;

      this.server.use(cookieParser());
      this.server.use(this.express.json());
      this.server.use(this.express.urlencoded({extended: true}));
      this.server.use(session(session_config));
   }

   #expose_public_directories() {
      const public_dirs = [
         'src', 'public', "public/js", 'node_modules/loopar-env/core/global', 'node_modules/loopar-env/public', 'node_modules/dayjs',
         'node_modules/mime-types'
      ];
      public_dirs.forEach(dir => {
         this.server.use(this.express.static(path.join(loopar.path_root, dir)));
      });

      //this.server.use(express.static(path.join(loopar.path_root, 'apps/loopar/modules/core/document/client')));
   }

   #start() {
      loopar.server = this;
      const port = env.server_config.port;

      const install_message = loopar.framework_installed ? '' : '\n\nContinue in your browser to complete the installation';

      this.server.listen(port, () => {
         console.log("Server is started in " + port + install_message);
      });
   }
}

export const server = new Server();