import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'pathe';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';
import image from '@rollup/plugin-image';
const framework = process.cwd();

const componentsAlias = {};
const makeComponentToAlias = (dir) => {
  const alias = {};
  fs.readdirSync(dir).forEach(file => {
    if (fs.lstatSync(path.resolve(framework, dir, file)).isDirectory()) {
      Object.assign(alias, makeComponentToAlias(path.resolve(dir, file)));
    } else {
      componentsAlias[`@${file.split(".")[0]}`] = path.resolve(framework, dir, file);
    }
  })
  return componentsAlias;
}

const groupComponentesAlias = {};
const makeGroupComponentsAlias = (dir) => {
  return fs.readdirSync(dir).forEach(file => {
    groupComponentesAlias[`@${file.split(".")[0]}`] = path.resolve(framework, dir, file);
  }, {});
}

const loopar = '.loopar';

makeComponentToAlias(`${loopar}/src/components`);
makeGroupComponentsAlias(`${loopar}/src`);


export default defineConfig(({ command }) => ({
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', 'd.ts'],
    alias: {
      ...componentsAlias,
      ...groupComponentesAlias,
      '@loopar': path.resolve(framework, `${loopar}/src/`),
      '@': path.resolve(framework, 'src/'),
      '@app': path.resolve(framework, 'src/App.tsx'),

      'loopar': path.resolve(framework, `${loopar}/src/loopar.jsx`),
      '@global': path.resolve(framework, `${loopar}/core/global`),
      '@assets': path.resolve(framework, 'public/assets'),
      "@publicSRC": path.resolve(framework, '/public/src'),
      '@context': path.resolve(framework, `${loopar}/src/context`),
      '@services': path.resolve(framework, `${loopar}/services`),

      '@loader': path.resolve(framework, 'src/loader.jsx'),
      "@main/styles": path.resolve(framework, 'src/app/styles'),
      "/main/styles": path.resolve(framework, 'src/app/styles'),
      "/main/scripts": path.resolve(framework, 'src/app/scripts')
    },
  },
  plugins: [
    {
      ...image(),
      enforce: 'pre',
    },
    tailwindcss(),
    //viteFastify(),
    react({
      devTarget: "esnext",
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      threshold: 64,
      deleteOriginFile: false
    }),
    visualizer({
      open: false
    })
  ],
  optimizeDeps: {
    include: ['lucide-react', 'react-icons/pi']
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
    noExternal: ['lucide-react', 'react-icons/pi']
  },
  build: {
    outDir: path.resolve(framework, command == 'build:server' ? 'dist/server' : 'dist/client'),
    ssr: command == 'build:server',
    manifest: true,
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      input: path.resolve(framework, command == 'build:server' ? `src/entry-server.jsx` : 'main.html'),
    },
  },
  esbuild: {
    treeShaking: true
  },
  server: {
    hmr: true,
    watch: {
      usePolling: true
    },
    fs: {
      allow: ['.']
    },
  }
}));