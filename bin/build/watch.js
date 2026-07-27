/**
 * Warm watcher → build/staging/  (config-driven).
 *
 *   yarn watch                  (under pm2: autorestart + yarn logs build-watch)
 *   node bin/build/watch.js     (foreground, Ctrl+C to stop)
 *
 * Sets WATCH=1 and lets vite.config.js do the rest (watch on, outDir =
 * build/staging/, compression off). Keeps a warm graph so source edits rebuild
 * incrementally and fast, without touching the live `dist`. Deploy a snapshot:
 *
 *   node bin/build/activate-staging.js   (or: yarn activate)
 *
 * NOTE: Rolldown's watcher is experimental — measure the incremental rebuild
 * time before relying on it.
 */
import { build } from 'vite';

process.env.WATCH = '1';
process.env.NODE_ENV = 'production';

async function startWatcher(target) {
  process.env.BUILD_TARGET = target;
  const watcher = await build({}); // vite.config.js handles watch/outDir/no-compression
  if (watcher && typeof watcher.on === 'function') {
    watcher.on('event', (e) => {
      if (e.code === 'BUNDLE_END') {
        console.log(`✅ [${target}] rebuilt${e.duration != null ? ` in ${e.duration}ms` : ''}`);
      } else if (e.code === 'ERROR') {
        console.error(`❌ [${target}] ${e.error?.message || e.error}`);
      }
    });
  }
}

console.log('🏗  Initial full build → build/staging/ …');
await startWatcher('client');
await startWatcher('server');
console.log('\n👀 Watching source — edits rebuild incrementally to build/staging/.');
console.log('   Deploy a snapshot with:  yarn activate\n');
