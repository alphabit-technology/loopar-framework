/**
 * Remove the live `dist` symlink/folder. Utility — not part of the build
 * chain (activate.js swaps dist atomically without ever deleting it).
 *
 * Resolves from process.cwd() (the project root when run via yarn/node from
 * the root). The old version used '../dist', which pointed OUTSIDE the
 * project and silently did nothing thanks to force:true.
 */
import { rm } from 'fs/promises';
import path from 'pathe';

try {
  await rm(path.join(process.cwd(), 'dist'), { recursive: true, force: true });
  console.log('The "dist" folder has been successfully removed.');
} catch (error) {
  console.error('An error occurred while removing the "dist" folder:', error);
}
