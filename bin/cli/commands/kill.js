import chalk from 'chalk';
import { pm2Command } from '../pm2.js';

/**
 * Stops every Loopar process AND the daemon itself, scoped to the project's
 * PM2_HOME (set by loopar/bin/pm2-home.js). The next yarn start will
 * spawn a fresh daemon under <project>/.pm2/.
 */
export default function kill() {
  console.log(chalk.red(`Killing Loopar PM2 daemon at ${process.env.PM2_HOME}`));
  pm2Command('pm2 kill');
}
