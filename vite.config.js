import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'path';
//import importDynamicModule from 'vite-plugin-dynamic-import-vars';
import vike from "vike/plugin";

const appAlias = {};
const makeAppsToAlias = (dir) => {
  fs.readdirSync(dir).forEach(app => {
    if (fs.lstatSync(path.resolve(__dirname, dir, app)).isDirectory()) {
      const moduleRoot = path.resolve(__dirname, dir, `${app}/modules`);
      const modules = fs.readdirSync(moduleRoot);

      modules.forEach(module => {
        const documentsRoot = path.resolve(`${moduleRoot}/${module}`);
        const documents = fs.readdirSync(documentsRoot);

        documents.forEach(document => {
          const clientRoot = path.resolve(`${documentsRoot}/${document}/client`);
          const clientFiles = fs.readdirSync(clientRoot);

          clientFiles.forEach(clientFile => {
            /**
             * To default import ej: import MyComponent from '$my-component'
             */
            appAlias[`$${clientFile.split(".")[0]}`] = path.resolve(`${clientRoot}/${clientFile}`);
            appAlias[`@${clientFile.split(".")[0]}`] = path.resolve(`${clientRoot}/${clientFile}`);

            /**
             * to dynamic import ej: const myComponent = await import('./my-component.jsx')
             * But to work you need use:
             * import { AppSourceLoader } from "$/app-source-loader";
             * 
             * await AppSourceLoader(clientFile): (await import('item-client')).default
             * */
            appAlias[`/src/${clientFile}`] = path.resolve(`${clientRoot}/${clientFile}`);
          });
        });
      });
    }
  });
}

makeAppsToAlias('./apps');
makeAppsToAlias('./.loopar/apps');

const componentsAlias = {};
const makeComponentToAlias = (dir) => {
  const alias = {};
  fs.readdirSync(dir).forEach(file => {
    if (fs.lstatSync(path.resolve(__dirname, dir, file)).isDirectory()) {
      Object.assign(alias, makeComponentToAlias(path.resolve(dir, file)));
    } else {
      componentsAlias[`@${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
      componentsAlias[`$${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
      componentsAlias[`./${file}`] = path.resolve(__dirname, dir, file);
      componentsAlias[`/components/${file}`] = path.resolve(__dirname, dir, file);
    }
  })
  return componentsAlias;
}

const groupComponentesAlias = {};
const makeGroupComponentsAlias = (dir) => {
  return fs.readdirSync(dir).forEach(file => {
    groupComponentesAlias[`@${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
    //groupComponentesAlias[`./workspace/${file}`] = path.resolve(__dirname, dir, file);
  }, {});
}

makeComponentToAlias('./.loopar/src/components');
makeGroupComponentsAlias('./.loopar/src');

export default defineConfig({
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.mjs', '.ts', '.tsx'],
    alias: {
      ...componentsAlias,
      ...appAlias,
      ...groupComponentesAlias,
      '@loopar': path.resolve(__dirname, './.loopar/src/'),
      '@': path.resolve(__dirname, './src/'),
      '$': path.resolve(__dirname, 'src'),
      '$app': path.resolve(__dirname, 'src/App.tsx'),
      '$index': path.resolve(__dirname, 'src/pages/index.tsx'),

      '$tools': path.resolve(__dirname + '/.loopar/src/tools'),
      '$loopar': path.resolve(__dirname + '/.loopar/src/loopar.jsx'),
      'loopar': path.resolve(__dirname + '/.loopar/src/loopar.jsx'),
      '$global': path.resolve(__dirname + '/.loopar/core/global'),
      '@global': path.resolve(__dirname + '/.loopar/core/global'),
      //'$elements': path.resolve(__dirname + '/public/js/components/elements.jsx'),
      '$assets': path.resolve(__dirname + '/public/assets'),
      '@assets': path.resolve(__dirname + '/public/assets'),
      //'@public': path.resolve(__dirname + '/public'),
      "@publicSRC": path.resolve(__dirname + '/public/src'),
      '$context': path.resolve(__dirname + '/.loopar/src/context'),
      '@context': path.resolve(__dirname + '/.loopar/src/context'),
      '@services': path.resolve(__dirname + '/.loopar/services'),
      '$workspace': path.resolve(__dirname + '/.loopar/src/workspace'),

      '/workspace': path.resolve(__dirname + '/.loopar/src/workspace'),
      "$entry-client": path.resolve(__dirname + '/src/entry-client.jsx'),
      "$css": path.resolve(__dirname + '/.loopar/src/css'),

      '$app-source-loader': path.resolve(__dirname, '/apps/app-source-loader.jsx'),
      '$components-loader': path.resolve(__dirname, '/.loopar/src/components-loader.jsx'),

      "@styles": path.resolve(__dirname, 'src/app/styles'),
      "/styles": path.resolve(__dirname, 'src/app/styles'),
      //'@context-loader': path.resolve(__dirname, '/loopar/src/context-loader.jsx'),
    },
  },
  plugins: [
    react({
      //jsxImportSource: "@emotion/react",
      //devTarget: "es2022"
    }),
    vike(),
    //importDynamicModule(),
    //root: path.resolve(__dirname, './src
  ],
  optimizeDeps: {
    include: ['lucide-react'],
    //include: ['@emotion/styled', 'lucide-react'],
  },
  css: {
    preprocessorOptions: {
      css: {
        extract: true,
      },
    },
    modules: {
      hot: true,
    },
  },
  ssr: {
    noExternal: ['lucide-react']
  }
  // server.hmr.overlay: false
});