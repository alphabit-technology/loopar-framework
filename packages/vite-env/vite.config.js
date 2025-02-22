import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { readdirSync, lstatSync } from 'fs';
import path from 'pathe';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';
import image from '@rollup/plugin-image';

const framework = process.cwd();
const loopar = 'node_modules/loopar';

const resRoot = (...args) => path.resolve(framework, ...args);
const resLoopar = (...args) => resRoot(loopar, ...args);

const Alias = (dir, prefix = '@', groupOnly=false) => {
  return readdirSync(dir).reduce((acc, name) => {
    const fullPath = path.resolve(dir, name);
    const baseName = name.split(".")[0];
    if (lstatSync(fullPath).isDirectory()) {
      if (groupOnly) {
        acc[`${prefix}${baseName}`] = fullPath;
      }else{
        Object.assign(acc, Alias(fullPath, prefix));
      }
    } else if (baseName.length > 0 && baseName !== 'index') {
      acc[`${prefix}${baseName}`] = fullPath;
    }
    return acc;
  }, {});
};

export default defineConfig(({ command }) => {
  const isServerBuild = command === 'build:server';
  return {
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', 'd.ts'],
      alias: {
        ...(Alias(resLoopar('src/components'))),
        ...(Alias(resLoopar('src'), '@', true)),
        ...(Alias(resLoopar('src/components'), '@@', true)),
        '@': resRoot('src/'),
        'loopar': resLoopar('src/loopar.jsx'),
        '@loopar': resLoopar('src/'),
        '@global': resLoopar('core/global'),
        '@workspace': resLoopar('src/workspace'),
        '@assets': resRoot('public/assets'),
        '@publicSRC': resRoot('public/src'),
        '@context': resLoopar('src/context'),
        '@services': resLoopar('services'),
        '/main': resRoot('src/app'),
        '@uiw': resRoot('node_modules/@uiw/'),
        'lucide-react': resRoot('node_modules/lucide-react'),
        'file-type': resRoot('node_modules/file-type'),
        'particles.js': resRoot('node_modules/particles.js'),
      },
    },
    plugins: [
      { ...image(), enforce: 'pre' },
      tailwindcss(),
      react({ devTarget: "esnext" }),
      viteCompression({
        algorithm: 'brotliCompress',
        threshold: 64,
        deleteOriginFile: false,
      }),
      visualizer({ open: false }),
    ],
    optimizeDeps: {
      force: true,
      enabled: true,
    },
    css: {
      preprocessorOptions: { css: { extract: true } },
      modules: { hot: true },
    },
    ssr: {
      noExternal: ['lucide-react', 'react-icons/pi'],
    },
    build: {
      outDir: resRoot(isServerBuild ? 'dist/server' : 'dist/client'),
      ssr: isServerBuild,
      manifest: true,
      target: 'esnext',
      minify: 'terser',
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        input: resRoot(isServerBuild ? 'src/entry-server.jsx' : 'main.html'),
      },
      chunkSizeWarningLimit: 1000,
    },
    esbuild: { treeShaking: true },
    server: {
      allowedHosts: true,
      hmr: true,
      watch: { usePolling: true },
      fs: { allow: ['.'] },
    },
  };
});
