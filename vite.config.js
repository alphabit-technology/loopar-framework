import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import importDynamicModule from 'vite-plugin-dynamic-import-vars';

const appAlias = {};
fs.readdirSync('./apps').forEach(app => {
    if (fs.lstatSync(path.resolve(__dirname, "apps", app)).isDirectory()) {
        const modules = fs.readdirSync(`./apps/${app}/modules`);
        modules.forEach(module => {
            const documents = fs.readdirSync(`./apps/${app}/modules/${module}`);
            documents.forEach(document => {
                const clientFiles = fs.readdirSync(`./apps/${app}/modules/${module}/${document}/client`);

                clientFiles.forEach(clientFile => {
                    /**
                     * To default import ej: import MyComponent from '#my-component'
                     */
                    appAlias[`#${clientFile.split(".")[0]}`] = path.resolve(__dirname, `/apps/${app}/modules/${module}/${document}/client/${clientFile}`);
                    
                    /**
                     * to dynamic import ej: const myComponent = await import('./my-component.jsx')
                     * */
                    appAlias[`./${clientFile}`] = path.resolve(__dirname ,`/apps/${app}/modules/${module}/${document}/client/${clientFile}`);
                    //appAlias[`./${clientFile.split(".")[0]}`] = path.resolve(__dirname ,`/apps/${app}/modules/${module}/${document}/client/${clientFile}`);
                    //appAlias[`./src/${clientFile}`] = path.resolve(__dirname + `/apps/${app}/modules/${module}/${document}/client/${clientFile}`);
                });
            });
        });
    }
});
const componentsAlias = {};
const makeComponentToAlias = (dir) => {
    const alias = {};
    fs.readdirSync(dir).forEach(file => {
        if (fs.lstatSync(path.resolve(__dirname, dir, file)).isDirectory()) {
            Object.assign(alias, makeComponentToAlias(path.resolve(dir, file)));
        }else{
            componentsAlias[`#${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
            componentsAlias[`./${file}`] = path.resolve(__dirname, dir, file);
        }
    })
    return componentsAlias;
}

makeComponentToAlias('./loopar-env/src/components');

export default defineConfig({
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            ...componentsAlias,
            ...appAlias,
            '#': path.resolve(__dirname, 'src'),
            '#app': path.resolve(__dirname, 'src/App.jsx'),
            '#app-source-loader': path.resolve(__dirname, '/apps/app-source-loader.jsx'),
            '#components-loader': path.resolve(__dirname, '/loopar-env/src/componentes-loader.jsx'),
            '#tools': path.resolve(__dirname + '/loopar-env/src/tools'),
            '#loopar': path.resolve(__dirname + '/loopar-env/src/loopar.jsx'),
            '#global': path.resolve(__dirname + '/loopar-env/core/global'),
            '#elements': path.resolve(__dirname + '/public/js/components/elements.jsx'),
            '#assets': path.resolve(__dirname + '/public/assets'),
            '#context': path.resolve(__dirname + '/loopar-env/src/context'),
            '#workspace': path.resolve(__dirname + '/loopar-env/src/workspace'),
            "#entry-client": path.resolve(__dirname + '/src/entry-client.jsx'),
        },
    },
    plugins: [
        react(),
        importDynamicModule(),
    ]
});