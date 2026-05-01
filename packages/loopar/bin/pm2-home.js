/**
 * PM2_HOME bootstrap.
 *
 * Loopar runs its OWN pm2 daemon, anchored to <projectRoot>/.pm2/, isolated
 * from whatever pm2 the sysadmin has under ~/.pm2/. This avoids the
 * "In-memory PM2 is out-of-date" daemon/CLI version drift entirely, and keeps
 * the multitenant supervisor self-contained inside the project folder.
 *
 * Import this module BEFORE any `pm2` import or any `execSync('pm2 ...')` call:
 *
 *     import "loopar/bin/pm2-home.js";
 *     import pm2 from "pm2";
 *
 * The bootstrap is idempotent — if PM2_HOME is already set in the environment
 * (e.g. by an outer wrapper), it is respected.
 */
import path from "node:path";

if (!process.env.PM2_HOME) {
  process.env.PM2_HOME = path.join(process.cwd(), ".pm2");
}
