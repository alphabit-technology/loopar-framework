import path from 'pathe';
import fs from 'fs';
import { build } from 'vite';

const selfRoute = path.resolve(process.cwd(), "packages/markdown");
const srcFile = path.resolve(selfRoute, "src/markdown-render.js");
const distDir = path.resolve(selfRoute, "dist/ssr");
const distFile  = path.resolve(distDir, "markdown-render.js");

const needsBuild = () => {
  if (process.env.NODE_ENV === 'production') return !fs.existsSync(distFile);
  if (!fs.existsSync(distFile)) return true;
  return fs.statSync(srcFile).mtimeMs > fs.statSync(distFile).mtimeMs;
};

if (needsBuild()) {
  await build({
    root: selfRoute,
    ssr: {
      noExternal: ['@uiw/react-markdown-preview'],
    },
    build: {
      ssr: true,
      outDir: distDir,
      rolldownOptions: {
        input: srcFile,
      },
      minify: true,
    },
  });
}

const { renderMarkdown } = await import(distFile);

export const markdownRenderer = (markdown) => renderMarkdown(markdown);