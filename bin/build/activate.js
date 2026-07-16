/**
 * Build step 3/3 — Activate the staged release.
 *
 *   1. Atomically swap `dist` → `releases/<tag>` via rename(2).
 *      Existing PM2 workers keep serving the OLD bundle until reload — their
 *      ESM module cache still holds the previous dist/server/entry-server.js.
 *      Static file lookups (main.html, client assets) flip instantly because
 *      they're resolved per request.
 *
 *   2. `pm2.reload` each production tenant.
 *      In cluster mode (exec_mode: 'cluster'), reload forks a fresh worker —
 *      which loads the new SSR bundle from scratch — waits for it to come
 *      online, then kills the old worker. New requests hit new code, no
 *      blank-screen window.
 *
 *   3. Prune old releases.
 *      Keep the last N timestamped releases so rollback is just
 *      `ln -sfn releases/<previous> dist && pm2 reload all`.
 */
import "loopar/bin/pm2-home.js";
import fs from 'fs';
import path from 'pathe';
import { promisify } from 'util';
import pm2 from 'pm2';
import { tenant } from 'loopar';

const ROOT = process.cwd();
const KEEP_RELEASES = 3;

const tagFile = path.join(ROOT, '.release-tag');
if (!fs.existsSync(tagFile)) {
  console.error('❌ Missing .release-tag — build-prepare did not run.');
  process.exit(1);
}
const tag = fs.readFileSync(tagFile, 'utf8').trim();

const releaseTarget = `releases/${tag}`;            // relative — symlink stays portable
const distPath = path.join(ROOT, 'dist');
const tmpLink = path.join(ROOT, '.dist.swap');

// ────────────────────────────────────────────────────────────────────────────
// 1. Atomic symlink swap
// ────────────────────────────────────────────────────────────────────────────

// Clean any leftover from a prior interrupted run
try { fs.unlinkSync(tmpLink); } catch (_) { /* ignore */ }

fs.symlinkSync(releaseTarget, tmpLink, 'dir');

const existing = fs.lstatSync(distPath, { throwIfNoEntry: false });
if (existing && existing.isDirectory() && !existing.isSymbolicLink()) {
  // First migration from the old layout: dist/ is a real folder, not a
  // symlink. rename(2) cannot replace a non-empty directory with a symlink,
  // so we move the legacy dist aside first. After this run, dist is always
  // a symlink and future swaps are a single atomic rename.
  console.log('⚠️  Legacy dist/ detected (real directory). Moving aside…');
  fs.renameSync(distPath, path.join(ROOT, 'releases', `_legacy_${tag}`));
}

// Atomic on POSIX — replaces the existing symlink (or creates fresh) in a
// single syscall. No window where `dist` is missing.
fs.renameSync(tmpLink, distPath);
console.log(`🔗 dist → ${releaseTarget}`);

// ────────────────────────────────────────────────────────────────────────────
// 2. Reload production tenants
// ────────────────────────────────────────────────────────────────────────────

const pm2Connect = () => new Promise((res, rej) => pm2.connect(e => e ? rej(e) : res()));
const pm2Reload = promisify(pm2.reload.bind(pm2));
const pm2Describe = promisify(pm2.describe.bind(pm2));

// If the build was kicked off from a worker (e.g. via the Build button in
// the UI), that worker passes BUILD_INITIATOR so we don't reload it here —
// reloading it would kill the worker mid-process and discard the in-memory
// build state the UI is polling. The initiator updates its own code by an
// explicit "Reload" click after the build finishes.
const skipTenant = process.env.BUILD_INITIATOR || null;

await pm2Connect();
try {
  const tenants = tenant.tenants();
  let reloaded = 0;

  for (const t of tenants) {
    if (t.env.NODE_ENV !== 'production') {
      console.log(`⏭  ${t.name} (${t.env.NODE_ENV || 'development'}) — not production, skipped`);
      continue;
    }

    if (skipTenant && t.name === skipTenant) {
      console.log(`⏭  ${t.name} — build initiator, skipped (reload manually after build)`);
      continue;
    }

    const desc = await pm2Describe(t.name);
    const status = desc[0]?.pm2_env?.status;
    if (status !== 'online') {
      console.log(`⏭  ${t.name} (${status || 'stopped'}) — not online, skipped`);
      continue;
    }

    try {
      await pm2Reload(t.name);
      console.log(`♻️  ${t.name} reloaded`);
      reloaded++;
    } catch (err) {
      console.error(`❌ ${t.name} reload failed: ${err.message || err}`);
    }
  }

  console.log(`\n   ${reloaded}/${tenants.length} tenants reloaded`);
} finally {
  pm2.disconnect();
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Prune old releases (keep last N, never touch the active one)
// ────────────────────────────────────────────────────────────────────────────

const releasesDir = path.join(ROOT, 'releases');
const allReleases = fs.readdirSync(releasesDir)
  .filter(name => name !== tag && !name.startsWith('_legacy_'))
  .sort() // ISO timestamps sort chronologically
  .reverse(); // newest first

const toKeep = allReleases.slice(0, KEEP_RELEASES - 1); // newest N-1 prior + current = N total
const toPrune = allReleases.slice(KEEP_RELEASES - 1);

for (const old of toPrune) {
  fs.rmSync(path.join(releasesDir, old), { recursive: true, force: true });
  console.log(`🗑  pruned releases/${old}`);
}

if (toKeep.length > 0) {
  console.log(`\n   kept for rollback: ${toKeep.join(', ')}`);
}

// Clean the marker so a fresh build-prepare must run next time
fs.unlinkSync(tagFile);

console.log(`\n✅ Deploy ${tag} activated\n`);
