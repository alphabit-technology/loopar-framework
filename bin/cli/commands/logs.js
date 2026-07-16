import chalk from 'chalk';
import { pm2Command, projectName } from '../pm2.js';

export default function logs(siteName) {
  if (!siteName) {
    console.log(chalk.cyan('Showing logs for all sites...\n'));
    pm2Command(`pm2 logs all --namespace ${projectName}`);
  } else {
    console.log(chalk.cyan(`Showing logs for ${siteName}...\n`));
    pm2Command(`pm2 logs ${siteName}`);
  }
}
