/**
 * Enforces `engines.node` from package.json. Yarn Berry does not check
 * engines, so this runs at preinstall, in the CLI and when the core boots —
 * an old Node otherwise dies later as a mute SIGSEGV in a native module.
 */
import semver from 'semver';
import pkg from '../package.json' with { type: 'json' };

const required = pkg.engines.node;

if (!semver.satisfies(process.version, required)) {
  console.error(
    `\nLoopar requires Node ${required} — found ${process.version}.\n` +
    `Update Node before continuing (Ubuntu/NodeSource: sudo apt update && sudo apt install -y nodejs).\n`
  );
  process.exit(1);
}
