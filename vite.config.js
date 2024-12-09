import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import path from 'pathe';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';

const componentsAlias = {};
const makeComponentToAlias = (dir) => {
  const alias = {};
  fs.readdirSync(dir).forEach(file => {
    if (fs.lstatSync(path.resolve(__dirname, dir, file)).isDirectory()) {
      Object.assign(alias, makeComponentToAlias(path.resolve(dir, file)));
    } else {
      componentsAlias[`@${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
    }
  })
  return componentsAlias;
}

const groupComponentesAlias = {};
const makeGroupComponentsAlias = (dir) => {
  return fs.readdirSync(dir).forEach(file => {
    groupComponentesAlias[`@${file.split(".")[0]}`] = path.resolve(__dirname, dir, file);
  }, {});
}

makeComponentToAlias('./.loopar/src/components');
makeGroupComponentsAlias('./.loopar/src');

export default defineConfig(({ command }) => ({
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      ...componentsAlias,
      ...groupComponentesAlias,
      '@loopar': path.resolve(__dirname, './.loopar/src/'),
      '@': path.resolve(__dirname, './src/'),
      '@app': path.resolve(__dirname, 'src/App.tsx'),

      'loopar': path.resolve(__dirname + '/.loopar/src/loopar.jsx'),
      '@global': path.resolve(__dirname + '/.loopar/core/global'),
      '@assets': path.resolve(__dirname + '/public/assets'),
      "@publicSRC": path.resolve(__dirname + '/public/src'),
      '@context': path.resolve(__dirname + '/.loopar/src/context'),
      '@services': path.resolve(__dirname + '/.loopar/services'),
      '@services1': path.resolve(__dirname + '/.loopar/services1'),

      '@loader': path.resolve(__dirname, 'src/loader.jsx'),
      "@main/styles": path.resolve(__dirname, 'src/app/styles'),
      "/main/styles": path.resolve(__dirname, 'src/app/styles'),
      "/main/scripts": path.resolve(__dirname, 'src/app/scripts')
    },
  },
  plugins: [
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
    outDir: command === 'build:server' ? 'dist/server' : 'dist/client',
    ssr: command === 'build:server',
    manifest: true,
    target: 'esnext',
    minify: 'terser',
    cssCodeSplit: true,
    sourcemap: false,
    rollupOptions: {
      input: command === 'build:server' ? './src/entry-server.jsx' : 'main.html',
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