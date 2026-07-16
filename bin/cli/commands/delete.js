import chalk from 'chalk';
import { pm2Command, pm2Delete, projectName } from '../pm2.js';

/** Remove processes from the pm2 registry — sites/ folders stay on disk. */
export default async function del(siteName) {
  if (!siteName) {
    console.log(chalk.red('Deleting all sites from PM2...'));
    pm2Command(`pm2 delete all --namespace ${projectName}`);
    return;
  }
  console.log(chalk.red(`Deleting ${siteName} from PM2...`));
  await pm2Delete(siteName);
}
