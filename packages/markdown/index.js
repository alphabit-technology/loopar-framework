import path from 'pathe';
import { pathToFileURL } from 'url';
import fs from 'fs';
import { build } from 'vite';

const selfRoute = path.resolve(process.cwd(), "packages/markdown");
const distPath = path.resolve(selfRoute, "dist/ssr");

if (!fs.existsSync(distPath)) {
  await build({
    root: path.resolve(selfRoute),
    ssr: {
      noExternal: ['@uiw/react-markdown-preview'],
    },
    build: {
      ssr: true,
      outDir: path.resolve(selfRoute, "dist/ssr"),
      rollupOptions: {
        input: path.resolve(selfRoute, "src/markdown-render.js"),
      },
      minify: 'terser'
    },
  });
}

const { renderMarkdown } = await import(pathToFileURL(path.resolve(selfRoute, "dist/ssr/markdown-render.js")).href);

export const markdownRenderer = (markdown) => renderMarkdown(markdown);
