import chalk from 'chalk';
import { withPm2, startProcess, projectName } from '../pm2.js';

/**
 * Warm release builder under pm2 (autorestart, logs alongside the tenants).
 * Keeps build/staging/ fresh with incremental rebuilds on every source edit
 * (see bin/build/watch.js) so Activate deploys an up-to-date snapshot.
 *
 * NOT needed for day-to-day development — dev tenants serve through Vite
 * middleware with HMR. Run this when you're preparing releases.
 *
 * Stop it like any other process:   yarn stop build-watch
 * Foreground alternative (Ctrl+C):  node bin/build/watch.js
 */
export default async function watch() {
  console.log(chalk.cyan('Starting build-watch under pm2...'));
  const ok = await withPm2(() => startProcess({
    name: 'build-watch',
    namespace: projectName,
    script: 'bin/build/watch.js',
    autorestart: true,
    max_memory_restart: '1G',
    env: { NODE_ENV: 'production' },
  }));
  if (ok) {
    console.log(chalk.green('build-watch online — build/staging/ rebuilds on every source edit.'));
    console.log(chalk.gray('Logs: yarn logs build-watch · Stop: yarn stop build-watch · Deploy snapshot: yarn activate'));
  }
}
