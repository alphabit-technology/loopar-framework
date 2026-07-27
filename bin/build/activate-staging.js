/**
 * Snapshot build/staging/ into a versioned release and activate it atomically.
 *
 *   node bin/build/activate-staging.js   (or: yarn activate)
 *
 * Reuses build/activate.js for the symlink swap + tenant reload + prune. Run
 * this when the watcher (build/watch.js) is idle (not mid-rebuild), so the
 * snapshot is consistent.
 */
import fs from 'fs';
import path from 'pathe';
import { execFileSync } from 'child_process';
import { ROOT, makeTag, releaseDir, writeTag } from './lib/release.js';

const STAGING = path.join(ROOT, 'build', 'staging');

if (
  !fs.existsSync(path.join(STAGING, 'client')) ||
  !fs.existsSync(path.join(STAGING, 'server'))
) {
  console.error('❌ build/staging incomplete (missing client/server). Run `yarn watch` first.');
  process.exit(1);
}

const tag = makeTag();

console.log(`\n📦 Snapshot build/staging → build/releases/${tag}`);
fs.cpSync(STAGING, releaseDir(tag), { recursive: true });
writeTag(tag);

console.log('🚀 Activating…\n');
execFileSync('node', ['bin/build/activate.js'], { stdio: 'inherit', cwd: ROOT });
