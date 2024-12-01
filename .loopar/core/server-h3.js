'use strict';

import cookieParser from "cookie-parser";
import session from 'express-session';
import useragent from "express-useragent";
import express from "express";
import { loopar } from "./loopar.js";
import Router from "./router-h3.js";
import path from "pathe";

import { createApp, createRouter, toNodeListener, serveStatic, parseCookies, readBody, send, defineEventHandler } from 'h3';
import { createServer } from 'http';
import { resolve } from 'path';
import qs from 'qs';

import { promisify } from 'util';

//const app = createApp();

/*const compression = require('compression');
const serveStatic = require('serve-static');*/

import compression from 'compression';
//import serveStatic from 'serve-static';

import { createServer as createViteServer } from 'vite'

class Server extends Router {
  //express = express;
  server = createApp();
  url = null;
  isProduction = process.env.NODE_ENV == 'production';

  constructor() { super() }

  async initialize() {
    await loopar.initialize();
    const router = createRouter();
    this.server.use(router);

    this.route();

    if(!this.isProduction){
      this.vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'custom'
      });

      this.server.use(defineEventHandler(this.vite.middlewares));
    }else{
      this.server.use(defineEventHandler(compression()));

      this.server.use(defineEventHandler(
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
      ));
    }

    //this.server.use(useragent.express());
    //await this.#exposePublicDirectories();
    //this.#initializeSession();
    

    this.#start();
  }

  #initializeSession() {
    const sessionConfig = env.serverConfig.session;
    sessionConfig.maxAge = sessionConfig.maxAge * 1000 * 60 * 60 * 24;

    // Configuración de sesión
    /*const sessionConfig = session({
      secret: 'tu-secreto',
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }, // Cambia a `true` en producción con HTTPS
    });*/

    //const app = createApp();

    // Middleware para manejar sesiones
    this.server.use(
      defineEventHandler(async (event) => {
        await promisify(sessionConfig)(event.req, event.res);
        return;
      })
    );

    // Middleware para parsear cookies
    this.server.use(
      defineEventHandler((event) => {
        const cookies = parseCookies(event);
        event.context.cookies = cookies; // Almacenar cookies en el contexto si es necesario
      })
    );

    // Middleware para parsear JSON
    this.server.use(
      defineEventHandler(async (event) => {
        if (event.req.headers['content-type'] === 'application/json') {
          const body = await readBody(event);
          event.context.body = body; // Almacenar el cuerpo en el contexto
        }
      })
    );

    // Handler final que utiliza sesiones y responde al cliente
    this.server.use(
      defineEventHandler((event) => {
        if (!event.req.session.counter) {
          event.req.session.counter = 1;
        } else {
          event.req.session.counter += 1;
        }
        return `Has visitado esta página ${event.req.session.counter} veces`;
      })
    );


    //this.server.use(session(sessionConfig));
  }

  async #exposePublicDirectories() {
    const publicDirs = ['public'];

    if (process.env.NODE_ENV == 'production') {
      publicDirs.push('dist/client');
    }else{
      publicDirs.push('public');
      publicDirs.push('node_modules/particles.js');
    }

    publicDirs.push('node_modules/aos/dist');

    publicDirs.forEach(dir => {
      this.server.use(
        "/public",
        defineEventHandler(async (event) => {
          const filePath = resolve(dir, event.req.url || '');
          await send(event, filePath);
        })
      );
      //this.server.use(this.express.static(path.join(loopar.pathRoot, dir)));
    });
    
    await this.exposeClientAppFiles();
  }

  async exposeClientAppFiles(appName) {
    if (loopar.__installed__) {
      const installedsApps = await loopar.db.getAll("App", ["name"], appName ? { "=": { name: appName } } : null);

      for (const app of installedsApps) {
        const appPath = loopar.makePath(loopar.pathRoot, "apps", app.name, "public");

        console.log("Exposing public directory for: " + app.name)
        this.server.use(
          "/apps/" + app.name,
          defineEventHandler(async (event) => {
            const filePath = resolve(appPath, event.req.url || '');
            await send(event, filePath);
          })
        );
        //this.server.use(this.express.static(appPath));
      }
    }
  }

  #start() {
    loopar.server = this;
    const port = env.serverConfig.port;

    const installMessage = loopar.__installed__ ? '' : '\n\nContinue in your browser to complete the installation';

    const server = createServer(toNodeListener(this.server));

    server.listen(port, () => {
      console.log("Server is started in " + port + installMessage);
    });

    /*this.server.listen(port, () => {
      console.log("Server is started in " + port + installMessage);
    });*/
  }
}

export const server = new Server();