/**
 * preinstall hook — remove foreign lockfiles so Yarn 4 is the only manager.
 *
 * npm lifecycle scripts run with cwd = project root, so paths are resolved
 * from there. (The old version used '../…' which pointed OUTSIDE the project
 * — it silently did nothing thanks to force:true, or worse, could touch the
 * parent folder's lockfiles.)
 */
import { rm } from 'fs/promises';
import path from 'pathe';

const ROOT = process.cwd();

try {
  await rm(path.join(ROOT, 'package-lock.json'), { force: true });
  await rm(path.join(ROOT, 'pnpm-lock.yaml'), { force: true });
} catch (error) {
  console.error('An error occurred while installer clean:', error);
}
