import os from 'os';
import chalk from 'chalk';
import { pm2Command } from '../pm2.js';

/**
 * Make Loopar reboot-safe: register a boot unit (launchd on macOS, systemd
 * on Linux) that, on boot, starts the project-local pm2 daemon (with the
 * right PM2_HOME) and resurrects every tenant we previously saved.
 *
 * The boot unit MUST be registered to run as the current, non-root user.
 * If pm2 is ever registered or run as root, every file the daemon and its
 * child processes touch — build/releases/, uploads/, sites/, logs, .pm2/ —
 * becomes root-owned, and you lose read/write access to your own project.
 * Passing -u/--hp explicitly keeps the printed sudo command unambiguous.
 *
 * We never run the sudo command ourselves — pm2 prints it so the user
 * can review and execute it explicitly.
 */
export default function startup() {
  const user = os.userInfo().username;
  const home = os.homedir();
  const platform = process.platform === 'darwin' ? 'launchd' : 'systemd';

  console.log(chalk.cyan('\n📋 Loopar startup setup\n'));
  console.log(chalk.gray(`PM2_HOME = ${process.env.PM2_HOME}`));
  console.log(chalk.gray(`User     = ${user}`));
  console.log(chalk.gray(`Home     = ${home}`));
  console.log(chalk.gray(`Platform = ${platform}\n`));

  if (user === 'root') {
    console.error(chalk.red('❌ Run this as your normal user, NOT with sudo.'));
    console.error(chalk.red('   Registering pm2 as root makes every project file root-owned.\n'));
    process.exit(1);
  }

  // Step 1 — snapshot the current process list
  console.log(chalk.cyan('Step 1: saving current pm2 process list...\n'));
  const saved = pm2Command('pm2 save');
  if (!saved) {
    console.error(chalk.red('\n❌ pm2 save failed. Ensure the daemon is running (yarn start all) and try again.\n'));
    process.exit(1);
  }

  // Step 2 — generate the boot unit, explicitly scoped to this user so the
  // daemon is never registered to run as root.
  console.log(chalk.cyan('\nStep 2: generating boot-time unit...\n'));
  console.log(chalk.yellow('⚠️  pm2 will print a sudo command below. Copy and run it AS-IS.'));
  console.log(chalk.yellow('   That is the ONLY pm2 command that should ever use sudo.\n'));
  pm2Command(`pm2 startup ${platform} -u ${user} --hp ${home}`);

  console.log(chalk.green(`\n✅ After running the sudo command, all tenants currently online will`));
  console.log(chalk.green(`   resurrect automatically on every reboot — owned by ${user}, not root.\n`));
  console.log(chalk.red('🚫 Never run pm2 / yarn / npm with sudo again. Doing so makes project'));
  console.log(chalk.red('   files root-owned and you lose read/write access in your editor.\n'));
  console.log(chalk.gray('Verify:'));
  console.log(chalk.cyan('  sudo reboot'));
  console.log(chalk.cyan('  yarn tui    # all previously-online tenants should be online again\n'));
  console.log(chalk.gray('Remove auto-start later (if needed):'));
  console.log(chalk.cyan(`  pm2 unstartup ${platform}\n`));
}
