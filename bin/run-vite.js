/**
 * Build step 2/3 — Run Vite into the staged release folder.
 *
 * Invoked twice by the build chain — once with `client`, once with `server`.
 * Reads `.release-tag` (set by build-prepare) and tells Vite to bundle into
 * `releases/<tag>/<target>/` instead of the live `dist/`.
 *
 * We use Vite's programmatic API rather than the CLI to:
 *   1. Avoid shell-substitution of the tag (cross-platform).
 *   2. Keep BUILD_TARGET env aligned with the outDir so vite.config.js picks
 *      the right rolldownOptions/ssr branch.
 *
 * Usage: node bin/run-vite.js <client|server>
 */
import { build } from 'vite';
import fs from 'fs';
import path from 'pathe';

const target = process.argv[2];

if (!['client', 'server'].includes(target)) {
  console.error('Usage: node bin/run-vite.js <client|server>');
  process.exit(1);
}

const ROOT = process.cwd();
const tagFile = path.join(ROOT, '.release-tag');

if (!fs.existsSync(tagFile)) {
  console.error('❌ Missing .release-tag — run build-prepare first.');
  process.exit(1);
}

const tag = fs.readFileSync(tagFile, 'utf8').trim();
const outDir = path.join(ROOT, 'releases', tag, target);

// vite.config.js reads this to pick the right outDir/ssr branch & rolldown
// options. Our inline `outDir` below still takes precedence, but setting
// BUILD_TARGET keeps the rest of the config consistent.
process.env.BUILD_TARGET = target;

// Defense in depth: a `vite build` MUST run with NODE_ENV=production so
// Vite/Rollup substitute the constant in the React build (and every other
// library that branches on it). If we let an inherited NODE_ENV=development
// through, the resulting bundle minifies React's dev build and crashes at
// runtime with errors like `x is not a function`. This complements the
// override already done by the UI build trigger; running through here from
// the shell with no env set picks up the same guarantee.
process.env.NODE_ENV = 'production';

console.log(`\n🏗  Vite build → ${path.relative(ROOT, outDir)}\n`);

await build({
  build: {
    outDir,
    // Default emptyOutDir is fine — releases/<tag>/<target>/ was just created
    // empty by build-prepare, so there's nothing to clear and no risk of
    // stomping on the live dist.
    ...(target === 'server' && { ssr: 'app/entry-server.jsx' }),
  },
});
