// vite.config.js
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react';
import proxy from 'http-proxy-middleware';
import fs from 'fs';
import path from 'path';
import { clear } from 'console';

// Define la URL del backend
const backendUrl = 'http://localhost:3030'; // Reemplaza con la URL correcta de tu servidor backend

const apps = fs.readdirSync('./apps');
const alias = {};

apps.forEach(app => {
    const modules = fs.readdirSync(`./apps/${app}/modules`);
    modules.forEach(module => {
        const documents = fs.readdirSync(`./apps/${app}/modules/${module}`);
        documents.forEach(document => {
            const clientFiles = fs.readdirSync(`./apps/${app}/modules/${module}/${document}/client`);

            clientFiles.forEach(clientFile => {
                console.log("clientFile", clientFile)   
                alias[`@${clientFile}`] = path.resolve(__dirname + `./apps/${app}/modules/${module}/${document}/client/${clientFile}`);
                alias[`@${clientFile.split(".")[0]}`] = path.resolve(__dirname + `./apps/${app}/modules/${module}/${document}/client/${clientFile}`);
                alias[`./${clientFile.split(".")[0]}`] = path.resolve(__dirname + `./apps/${app}/modules/${module}/${document}/client/${clientFile}`);
            });
            alias[`@${app}`] = path.resolve(__dirname + `/apps/${app}/modules/${module}/${document}/client`);
        });
    });
});

export default defineConfig({
    plugins: [reactRefresh()],
    resolve: {
        alias: {
            // you can use this alias in your server code as well
            '@': './src',
            ...alias,
            //...global.alias,
            '@loopar': path.resolve(__dirname + '/loopar-env/public'),
            '@global': path.resolve(__dirname + '/loopar-env/core/global'),
            '@components': path.resolve(__dirname + '/public/js/components'),
        },
        extensions: ['.js', '.jsx', '.json'],
    },
    server: {
        port: 3001, // Puedes ajustar el puerto según tus necesidades
        proxy: {
            /*'/': {
                target: backendUrl,
                changeOrigin: true,
                //rewrite: (path) => path.replace(/^\/web/, ''),
                ws: true,
                onProxyReq(proxyReq, req) {
                    // Agrega una cabecera personalizada para indicar a Vite que maneje la solicitud
                    console.log("Proxying: " + req.url)
                    proxyReq.setHeader('X-Vite-Proxy', 'yes');
                },
            },
            '@': {
                target: backendUrl,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^@/, ''),
                ws: true,
            },*/
            /*'/src/*': {
                target: 'http://localhost:3030',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/src/, ''),
                ws: true,
                onProxyReq(proxyReq, req) {
                    // Agrega una cabecera personalizada para indicar a Vite que maneje la solicitud
                    console.log("Proxying: " + req.url)
                    proxyReq.setHeader('X-Vite-Proxy', 'yes');
                },
            },*/
            '/web': {
                target: 'http://localhost:3030',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/web/, ''),
                ws: true
            }
        },
    },
});