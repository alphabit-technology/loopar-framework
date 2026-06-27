/**
 * Standalone per-app build (phase A).
 *
 *   node bin/build-app.js <appName>
 *
 * Builds one app's page components into dist/{client,server}/apps/<name>/ with
 * shared framework instances left external (resolved at runtime from
 * globalThis.__loopar_shared__), and registers each page in app-registry.json
 * so the host loader can import it without that app being in the host build.
 *
 * The app must be excluded from the host glob in src/loader.jsx, and the host
 * must have been built first so dist/ exists.
 */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const appName = process.argv[2];

if (!appName) {
  console.error('Usage: node bin/build-app.js <appName>');
  process.exit(1);
}

// Bare specifiers the app may import that must stay shared with the host.
const SHARED = ['@context/page-context'];

function sharedExternals(specs) {
  const set = new Set(specs);
  const PREFIX = '\0loopar-shared:';
  return {
    name: 'loopar-shared-externals',
    enforce: 'pre',
    resolveId(id) {
      return set.has(id) ? PREFIX + id : null;
    },
    load(id) {
      if (!id.startsWith(PREFIX)) return null;
      const spec = id.slice(PREFIX.length);
      return `export default globalThis.__loopar_shared__[${JSON.stringify(spec)}];`;
    },
  };
}

function collectEntries(appDir) {
  const entries = {};
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (
        e.isFile() &&
        p.includes(`${path.sep}client${path.sep}`) &&
        p.endsWith('.jsx')
      ) {
        entries[path.basename(p, '.jsx')] = p;
      }
    }
  };
  walk(appDir);
  return entries;
}

function mergeRegistry(file, additions) {
  let current = {};
  try {
    if (fs.existsSync(file)) current = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    current = {};
  }
  Object.assign(current, additions);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(current, null, 2));
}

const appDir = path.join(ROOT, 'apps', appName);
if (!fs.existsSync(appDir)) {
  console.error(`App not found: ${appDir}`);
  process.exit(1);
}

const entries = collectEntries(appDir);
if (Object.keys(entries).length === 0) {
  console.error(`No client/*.jsx entries found under apps/${appName}`);
  process.exit(1);
}

process.env.NODE_ENV = 'production';

const config = (ssr) => ({
  configFile: false,
  logLevel: 'warn',
  plugins: [react(), sharedExternals(SHARED)],
  build: {
    outDir: path.join(ROOT, ssr ? 'dist/server' : 'dist/client', 'apps', appName),
    emptyOutDir: true,
    ssr,
    minify: !ssr,
    target: 'esnext',
    rollupOptions: {
      input: entries,
      output: {
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
      },
    },
  },
});

console.log(`\n🏗  Building app "${appName}" → dist/{client,server}/apps/${appName}\n`);
await build(config(false));
await build(config(true));

const clientReg = {};
const serverReg = {};
for (const name of Object.keys(entries)) {
  clientReg[name] = { client: `/apps/${appName}/${name}.js` };
  serverReg[name] = {
    server: pathToFileURL(
      path.join(ROOT, 'dist/server/apps', appName, `${name}.js`)
    ).href,
  };
}

mergeRegistry(path.join(ROOT, 'dist/client/app-registry.json'), clientReg);
mergeRegistry(path.join(ROOT, 'dist/server/app-registry.json'), serverReg);

console.log(`\n✅ ${appName}: ${Object.keys(entries).length} page(s) built and registered`);
console.log(`   pages: ${Object.keys(entries).join(', ')}\n`);
