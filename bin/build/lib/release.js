/**
 * Shared release helpers for the build chain.
 *
 * A "release" is a timestamped, immutable folder under build/releases/ that
 * the `dist` symlink points to. The tag travels between build steps through
 * the `.release-tag` marker file at the project root.
 */
import fs from 'fs';
import path from 'pathe';

export const ROOT = process.cwd();
export const RELEASES_DIR = path.join(ROOT, 'build', 'releases');
export const TAG_FILE = path.join(ROOT, '.release-tag');

/** ISO-ish UTC timestamp that sorts lexicographically: 2026-05-12_16-12-04 */
export function makeTag(now = new Date()) {
  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
  ].join('-') + '_' + [
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
  ].join('-');
}

export const releaseDir = (tag) => path.join(RELEASES_DIR, tag);

export function writeTag(tag) {
  fs.writeFileSync(TAG_FILE, tag, 'utf8');
}

/** Read `.release-tag`, or exit with a clear message when a prior step is missing. */
export function readTag({ requiredBy = 'this step' } = {}) {
  if (!fs.existsSync(TAG_FILE)) {
    console.error(`❌ Missing .release-tag — run build/prepare first (required by ${requiredBy}).`);
    process.exit(1);
  }
  return fs.readFileSync(TAG_FILE, 'utf8').trim();
}

export function clearTag() {
  try { fs.unlinkSync(TAG_FILE); } catch (_) { /* already gone */ }
}
