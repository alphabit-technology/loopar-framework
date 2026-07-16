import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { pm2Command, withPm2, startTenant, productionSites } from '../pm2.js';

/**
 * start            → interactive TUI (needs a TTY) — the front door.
 * start all        → every PRODUCTION tenant in sites/ (headless-safe;
 *                    dev/test sites are skipped — there can be dozens;
 *                    start those explicitly or from the TUI).
 * start <site>     → that tenant, whatever its NODE_ENV. Prod/dev is a
 *                    per-tenant switch (sites/<site>/.env), not a command.
 */
export default async function start(siteName) {
  pm2Command('node bin/setup/ensure-site.js', true);

  if (!siteName) {
    if (!process.stdout.isTTY || !process.stdin.isTTY) {
      console.error(chalk.red('No interactive terminal — cannot open the TUI.'));
      console.error(chalk.gray('Headless usage: `yarn start all` (every production tenant) or `yarn start <site>`.'));
      process.exit(1);
    }
    const tui = fileURLToPath(new URL('../../tui/index.js', import.meta.url));
    const { status } = spawnSync(process.execPath, [tui], { stdio: 'inherit' });
    process.exit(status ?? 0);
  }

  const targets = siteName === 'all' ? productionSites() : [siteName];
  if (!targets.length) {
    console.log(chalk.yellow('No production tenants found in sites/. Use `yarn start <site>`.'));
    return;
  }
  await withPm2(async () => {
    for (const name of targets) await startTenant(name);
  });
}
