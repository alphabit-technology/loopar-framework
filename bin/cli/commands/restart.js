import chalk from 'chalk';
import { pm2Command, withPm2, restartTenant, projectName } from '../pm2.js';

/**
 * restart <site> rebuilds the config from sites/<site>/.env (delete + fresh
 * start), so env changes apply. restart (no arg) is an in-place pm2 restart
 * of whatever is running — it does NOT re-read .env files.
 */
export default async function restart(siteName) {
  if (!siteName) {
    console.log(chalk.cyan('Restarting all running sites (in place)...'));
    pm2Command(`pm2 restart all --namespace ${projectName}`);
    return;
  }
  await withPm2(() => restartTenant(siteName));
}
