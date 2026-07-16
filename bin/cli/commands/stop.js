import chalk from 'chalk';
import { pm2Command, pm2Stop, projectName } from '../pm2.js';

export default async function stop(siteName) {
  if (!siteName) {
    // Only touches what's actually running in this project's namespace
    // (tenants + build-watch) — not the dozens of test sites on disk.
    console.log(chalk.yellow('Stopping all sites...'));
    pm2Command(`pm2 stop all --namespace ${projectName}`);
    return;
  }
  console.log(chalk.yellow(`Stopping ${siteName}...`));
  await pm2Stop(siteName);
}
