import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
import { readdirSync, lstatSync } from 'fs';
import { resolve } from 'pathe';
import { compression, defineAlgorithm } from 'vite-plugin-compression2';
import { constants } from 'zlib';
import { visualizer } from 'rollup-plugin-visualizer';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';

const framework = process.cwd();
const loopar = 'node_modules/loopar';

const resRoot = (...args) => resolve(framework, ...args);
const resLoopar = (...args) => resRoot(loopar, ...args);

const Alias = (dir, dirOnly = false) => {
  return readdirSync(dir).reduce((acc, name) => {
    const fullPath = resolve(dir, name);
    const baseName = name.split(".")[0];

    if (lstatSync(fullPath).isDirectory()) {
      acc[`@@${baseName}`] = fullPath;
      !dirOnly && Object.assign(acc, Alias(fullPath));
    } else if (baseName.length > 0 && baseName !== 'index') {
      acc[`@${baseName}`] = fullPath;
    }
    return acc;
  }, {});
};

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';
  const isServerBuild = process.env.BUILD_TARGET === 'server';

  return {
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
      dedupe: ['react', 'react-dom'],
      alias: {
        ...Alias(resLoopar('src/components')),
        ...Alias(resLoopar('src'), true),
        '@cn': resolve('node_modules/cn/src'),
        '@app': resRoot('app/'),
        'loopar': resLoopar('src/loopar.jsx'),
        '@loopar': resLoopar('src/'),
        '@global': resLoopar('core/global'),
        '@workspace': resLoopar('src/workspace'),
        '@publicSRC': resRoot('public/src'),
        '@context': resLoopar('src/context'),
        '@services': resLoopar('services'),
        '/app': resRoot('app'),

        '@uiw': resRoot('node_modules/@uiw/'),
        'file-type': resRoot('node_modules/file-type'),
      },
    },

    plugins: [
      tailwindcss(),
      react({ 
        devTarget: "esnext",
        babel: {
          plugins: ['babel-plugin-react-compiler']
        }
      }),

      !isDev && compression({
        algorithms: [
          defineAlgorithm('gzip', { level: 9 }),
          defineAlgorithm('brotliCompress', {
            params: {
              [constants.BROTLI_PARAM_QUALITY]: 11,
            }
          }),
        ],
        threshold: 512,
        include: /\.(js|mjs|css|html|json|svg)$/,
        exclude: [/\.map$/, /stats\.html$/],
      }),

      process.env.ANALYZE && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: 'stats.html'
      })
    ].filter(Boolean),

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "lucide-react",
        "react-icons/pi",
      ],
    },

    ssr: {
      noExternal: ['lucide-react', 'react-icons/pi'],
    },

    build: {
      outDir: resRoot(isServerBuild ? 'dist/server' : 'dist/client'),
      ssr: isServerBuild,
      manifest: !isServerBuild,
      target: 'esnext',
      minify: isDev ? false : 'terser',
      terserOptions: !isDev ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
        },
      } : undefined,
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        input: resRoot(isServerBuild ? 'app/entry-server.jsx' : 'main.html'),
        output: !isServerBuild ? {
          chunkFileNames: 'assets/[hash].js',
          assetFileNames: 'assets/[hash].[ext]',
          manualChunks(id) {
            if (!id.includes('node_modules')) return; 

            if (id.includes('react-dom') || id.includes('/react@')) {
              return 'react-vendor';
            }
            
            if (id.includes('lucide-react') || id.includes('react-icons')) {
              return 'icons';
            }
          }
        } : undefined,
      },
      chunkSizeWarningLimit: 1000,
    },

    esbuild: {
      treeShaking: true,
      drop: isDev ? [] : ['console', 'debugger'],
    },
    server: {
      allowedHosts: true
    }
  };
});
