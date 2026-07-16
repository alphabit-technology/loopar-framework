/**
 * Build step 1/3 — Prepare a versioned release folder.
 *
 * Generates a release tag from the current UTC timestamp, writes it to
 * `.release-tag` so the rest of the build chain can pick it up, and creates
 * `releases/<tag>/` ready to receive the client/server bundles.
 *
 * Nothing in the live `dist` is touched here. Tenants in production keep
 * serving the previous release while the new one is being built.
 */
import fs from 'fs';
import path from 'pathe';

const ROOT = process.cwd();

// ISO-ish timestamp that sorts lexicographically: 2026-05-12_16-12-04
const now = new Date();
const tag = [
  now.getUTCFullYear(),
  String(now.getUTCMonth() + 1).padStart(2, '0'),
  String(now.getUTCDate()).padStart(2, '0'),
].join('-') + '_' + [
  String(now.getUTCHours()).padStart(2, '0'),
  String(now.getUTCMinutes()).padStart(2, '0'),
  String(now.getUTCSeconds()).padStart(2, '0'),
].join('-');

const releaseDir = path.join(ROOT, 'releases', tag);
fs.mkdirSync(releaseDir, { recursive: true });
fs.writeFileSync(path.join(ROOT, '.release-tag'), tag, 'utf8');

console.log(`\n📦 Preparing release ${tag}`);
console.log(`   → ${releaseDir}\n`);
