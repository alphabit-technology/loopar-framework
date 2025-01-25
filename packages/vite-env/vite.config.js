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
  fs.readdirSync(dir).forEach(name => {
    if (fs.lstatSync(path.resolve(framework, dir, name)).isDirectory()) {
      makeComponentToAlias(path.resolve(dir, name));
    } else if(name.split(".")[0].length > 0) {
      componentsAlias[`@${name.split(".")[0]}`] = path.resolve(framework, dir, name);
    }
  });
}

makeComponentToAlias(`${framework}/.loopar/src/components`);

const groupSRCAlias = fs.readdirSync(`${framework}/.loopar/src`).reduce((acc, name) => {
  if (fs.lstatSync(path.resolve(framework, `${framework}/.loopar/src`, name)).isDirectory()) {
    acc[`@${name}`] = path.resolve(framework, `${framework}/.loopar/src`, name);
  } else {
    if (name.split(".")[0].length > 0 && name.split(".")[0] != 'index' && ['jsx', 'tsx'].includes(name.split(".")[1])) {
      acc[`@${name.split(".")[0]}`] = path.resolve(framework, `${framework}/.loopar/src`, name);
    }
  }
  return acc;
}, {});


const groupComponentsAlias = fs.readdirSync(`${framework}/.loopar/src/components`).reduce((acc, name) => {
  if (fs.lstatSync(path.resolve(`${framework}/.loopar/src/components`, name)).isDirectory()) {
    acc[`@@${name}`] = path.resolve(framework, `${framework}/.loopar/src/components`, name);
  } else {
    if(name.split(".")[0].length > 0) {
      acc[`@${name.split(".")[0]}`] = path.resolve(framework, `${framework}/.loopar/src/components`, name);
    }
  }
  return acc;
}, {});


const loopar = '.loopar';
export default defineConfig(({ command }) => ({
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', 'd.ts'],
    alias: {
      ...componentsAlias,
      ...groupSRCAlias,
      ...groupComponentsAlias,
      '@loopar': path.resolve(framework, `${loopar}/src/`),
      '@_loopar': path.resolve(framework, `/apps/loopar/modules/`),
      '@': path.resolve(framework, 'src/'),
      '@app': path.resolve(framework, 'src/App.tsx'),

      'loopar': path.resolve(framework, `${loopar}/src/loopar.jsx`),
      '@global': path.resolve(framework, `${loopar}/core/global`),
      '@assets': path.resolve(framework, 'public/assets'),
      "@publicSRC": path.resolve(framework, '/public/src'),
      '@context': path.resolve(framework, `${loopar}/src/context`),
      '@services': path.resolve(framework, `${loopar}/services`),

      //'@loader': path.resolve(framework, 'src/loader.jsx'),
      "@main/styles": path.resolve(framework, 'src/app/styles'),
      "/main/styles": path.resolve(framework, 'src/app/styles'),
      "/main/scripts": path.resolve(framework, 'src/app/scripts'),
      '@uiw': path.resolve(framework, 'node_modules/@uiw/'),
      'lucide-react': path.resolve(framework, 'node_modules/lucide-react'),
      'file-type': path.resolve(framework, 'node_modules/file-type'),
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
    force: true,
    enabled: true,
    //include: ['lucide-react', 'react-icons/pi']
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
    chunkSizeWarningLimit: 1000
  },
  esbuild: {
    treeShaking: true
  },
  server: {
    allowedHosts: true,
    hmr: true,
    watch: {
      usePolling: true
    },
    fs: {
      allow: ['.']
    },
  }
}));