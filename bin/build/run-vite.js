/**
 * Build step 2/3 — Run Vite into the staged release folder.
 *
 * Invoked twice by the build chain — once with `client`, once with `server`.
 * Reads `.release-tag` (set by build/prepare) and tells Vite to bundle into
 * `build/releases/<tag>/<target>/` instead of the live `dist/`.
 *
 * Usage: node bin/build/run-vite.js <client|server>
 */
import { build } from 'vite';
import path from 'pathe';
import { ROOT, readTag, releaseDir } from './lib/release.js';

const target = process.argv[2];

if (!['client', 'server'].includes(target)) {
  console.error('Usage: node bin/build/run-vite.js <client|server>');
  process.exit(1);
}

const tag = readTag({ requiredBy: 'run-vite' });
const outDir = path.join(releaseDir(tag), target);

// vite.config.js reads this to pick the right outDir/ssr branch & rolldown
// options. Our inline `outDir` below still takes precedence, but setting
// BUILD_TARGET keeps the rest of the config consistent.
process.env.BUILD_TARGET = target;
process.env.NODE_ENV = 'production';

console.log(`\n🏗  Vite build → ${path.relative(ROOT, outDir)}\n`);

await build({
  build: {
    outDir,
    ...(target === 'server' && { ssr: 'app/entry-server.jsx' }),
  },
});
