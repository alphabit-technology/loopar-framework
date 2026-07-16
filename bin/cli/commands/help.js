import chalk from 'chalk';

export default function help() {
  console.log(chalk.cyan('\nLoopar CLI\n'));
  console.log(chalk.white('Usage: ') + chalk.cyan('yarn <command> [siteName]') + chalk.gray('  (or: node bin/cli/index.js <command>)\n'));
  console.log(chalk.white('Lifecycle:'));
  console.log(chalk.cyan('  start             ') + chalk.gray('Open the interactive tenant manager (TUI)'));
  console.log(chalk.cyan('  start all         ') + chalk.gray('Start every production tenant in sites/ (headless-safe)'));
  console.log(chalk.cyan('  start <site>      ') + chalk.gray('Start one tenant, whatever its NODE_ENV'));
  console.log(chalk.cyan('  stop [site]       ') + chalk.gray('Stop tenants (daemon stays alive)'));
  console.log(chalk.cyan('  restart [site]    ') + chalk.gray('Delete + fresh start, picks up .env changes'));
  console.log(chalk.cyan('  delete [site]     ') + chalk.gray('Remove processes from pm2 registry'));
  console.log(chalk.cyan('  kill              ') + chalk.gray('Kill processes AND the daemon (clean slate)'));
  console.log();
  console.log(chalk.white('Inspection:'));
  console.log(chalk.cyan('  tui               ') + chalk.gray('Interactive tenant manager (yarn tui — same as bare start)'));
  console.log(chalk.cyan('  logs [site]       ') + chalk.gray('Tail logs for all sites or one'));
  console.log();
  console.log(chalk.white('Operations:'));
  console.log(chalk.cyan('  watch             ') + chalk.gray('Warm release builder → build/staging under pm2 (stop: yarn stop build-watch)'));
  console.log(chalk.cyan('  startup           ') + chalk.gray('Register reboot-safe boot hook (run once after first deploy)'));
  console.log(chalk.cyan('  help              ') + chalk.gray('Show this message'));
  console.log();
  console.log(chalk.gray('Prod/dev is a per-tenant switch (sites/<site>/.env or the Tenant Manager UI),'));
  console.log(chalk.gray('not a command — start simply runs each tenant in whatever mode it is set to.'));
  console.log(chalk.gray('\nAll commands operate on the project-local pm2 daemon at:'));
  console.log(chalk.gray(`  ${process.env.PM2_HOME}\n`));
}
