/**
 * PM2_HOME bootstrap — anchor Loopar's own pm2 daemon to <root>/.pm2/, isolated
 * from the sysadmin's ~/.pm2/ (avoids the "In-memory PM2 is out-of-date" version
 * drift). Import this BEFORE any `pm2` import or `pm2` shell call. Idempotent:
 * an existing PM2_HOME is respected.
 */
import path from "node:path";

if (!process.env.PM2_HOME) {
  process.env.PM2_HOME = path.join(process.cwd(), ".pm2");
}
