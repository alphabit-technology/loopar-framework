#!/usr/bin/env node

import "loopar/bin/pm2-home.js";
import { execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';

const projectPath = process.cwd();
const projectName = path.basename(projectPath);

function getProcessName(siteName) {
  return `${projectName}-${siteName}`;
}

const namespace = `${projectName}-`;

/**
 * Run a shell command and return success as a boolean.
 * Note: with stdio:'inherit' execSync returns null on success too, so we
 * can't infer success from the return value — only the absence of a thrown
 * error means it worked.
 */
function pm2Command(cmd, silent = false) {
  try {
    execSync(cmd, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (err) {
    if (!silent) {
      console.error(chalk.red(`Error: ${err}`));
    }
    return false;
  }
}

const commands = {
  dev() {
    console.log(chalk.cyan(`Starting ${namespace}dev site. `));
    pm2Command(`node bin/ensure-site.js && pm2 start bin/loopar.ecosystem.config.mjs --namespace ${namespace} --silent && node bin/loopar-status.js --env development`);
  },
  start(siteName) {
    if (!siteName) {
      console.log(chalk.cyan('Starting core site.'));
      pm2Command(`node bin/ensure-site.js && pm2 start bin/loopar.ecosystem.config.mjs --namespace ${namespace} --silent && node bin/loopar-status.js --env production`);
    } else {
      console.log(chalk.cyan(`Starting ${siteName}...`));
      pm2Command(`node bin/ensure-site.js && pm2 start bin/loopar.ecosystem.config.mjs --namespace ${namespace} --only ${siteName} --silent && node bin/loopar-status.js --env production`);
    }
  },

  stop(siteName) {
    if (!siteName) {
      console.log(chalk.yellow('Stopping all sites...'));
      pm2Command(`pm2 stop all --namespace ${namespace}`);
    } else {
      const processName = getProcessName(siteName);
      console.log(chalk.yellow(`Stopping ${siteName}...`));
      pm2Command(`pm2 stop ${processName} --namespace ${namespace}`);
    }
  },

  restart(siteName) {
    if (!siteName) {
      console.log(chalk.cyan('Restarting all sites...'));
      pm2Command(`pm2 restart all --namespace ${namespace}`);
    } else {
      const processName = getProcessName(siteName);
      console.log(chalk.cyan(`Restarting ${siteName}...`));
      pm2Command(`pm2 restart ${processName} --namespace ${namespace}`);
    }
  },

  delete(siteName) {
    if (!siteName) {
      console.log(chalk.red('Deleting all sites from PM2...'));
      pm2Command(`pm2 delete all --namespace ${namespace}`);
    } else {
      const processName = getProcessName(siteName);
      console.log(chalk.red(`Deleting ${siteName} from PM2...`));
      pm2Command(`pm2 delete ${processName} --namespace ${namespace}`);
    }
  },

  kill() {
    // Stops every Loopar process AND the daemon itself, scoped to the
    // project's PM2_HOME (set by bin/pm2-home.js). The next yarn dev/start
    // will spawn a fresh daemon under <project>/.pm2/.
    console.log(chalk.red(`Killing Loopar PM2 daemon at ${process.env.PM2_HOME}`));
    pm2Command('pm2 kill');
  },

  startup() {
    // Make Loopar reboot-safe: register a systemd unit that, on boot,
    // starts the project-local pm2 daemon (with the right PM2_HOME) and
    // resurrects every tenant we previously saved.
    //
    // We never run the sudo command ourselves — pm2 prints it so the user
    // can review and execute it explicitly.
    console.log(chalk.cyan('\n📋 Loopar startup setup\n'));
    console.log(chalk.gray(`PM2_HOME = ${process.env.PM2_HOME}\n`));

    // Step 1 — snapshot the current process list
    console.log(chalk.cyan('Step 1: saving current pm2 process list...\n'));
    const saved = pm2Command('pm2 save');
    if (!saved) {
      console.error(chalk.red('\n❌ pm2 save failed. Ensure the daemon is running (yarn start) and try again.\n'));
      process.exit(1);
    }

    // Step 2 — generate the systemd (or launchd, on macOS) unit
    console.log(chalk.cyan('\nStep 2: generating boot-time unit...\n'));
    console.log(chalk.yellow('⚠️  pm2 will print a sudo command below. Copy and run it in your shell.\n'));
    pm2Command('pm2 startup');

    console.log(chalk.green('\n✅ After running the sudo command, all tenants currently online will'));
    console.log(chalk.green('   resurrect automatically on every reboot.\n'));
    console.log(chalk.gray('Verify:'));
    console.log(chalk.cyan('  sudo reboot'));
    console.log(chalk.cyan('  ssh ...'));
    console.log(chalk.cyan('  yarn list   # all previously-online tenants should be online again\n'));
    console.log(chalk.gray('Remove auto-start later (if needed):'));
    console.log(chalk.cyan('  pm2 unstartup\n'));
  },

  help() {
    console.log(chalk.cyan('\nLoopar CLI\n'));
    console.log(chalk.white('Usage: ') + chalk.cyan('yarn <command> [siteName]') + chalk.gray('  (or: node bin/loopar-cli.js <command>)\n'));
    console.log(chalk.white('Lifecycle:'));
    console.log(chalk.cyan('  dev               ') + chalk.gray('Start dev tenant + tail logs'));
    console.log(chalk.cyan('  start [site]      ') + chalk.gray('Start core (or one site) in production mode'));
    console.log(chalk.cyan('  stop [site]       ') + chalk.gray('Stop processes (daemon stays alive)'));
    console.log(chalk.cyan('  restart [site]    ') + chalk.gray('Restart processes'));
    console.log(chalk.cyan('  delete [site]     ') + chalk.gray('Remove processes from pm2 registry'));
    console.log(chalk.cyan('  kill              ') + chalk.gray('Kill processes AND the daemon (clean slate)'));
    console.log();
    console.log(chalk.white('Inspection:'));
    console.log(chalk.cyan('  list / status     ') + chalk.gray('Show all tenants in this Loopar daemon'));
    console.log(chalk.cyan('  logs [site]       ') + chalk.gray('Tail logs for all sites or one'));
    console.log();
    console.log(chalk.white('Operations:'));
    console.log(chalk.cyan('  startup           ') + chalk.gray('Register reboot-safe boot hook (run once after first deploy)'));
    console.log(chalk.cyan('  help              ') + chalk.gray('Show this message'));
    console.log();
    console.log(chalk.gray('All commands operate on the project-local pm2 daemon at:'));
    console.log(chalk.gray(`  ${process.env.PM2_HOME}\n`));
  },

  logs(siteName) {
    if (!siteName) {
      console.log(chalk.cyan('Showing logs for all sites...\n'));
      pm2Command(`pm2 logs all --namespace ${namespace}`);
    } else {
      const processName = getProcessName(siteName);
      console.log(chalk.cyan(`Showing logs for ${siteName}...\n`));
      pm2Command(`pm2 logs ${processName} --namespace ${namespace}`);
    }
  },

  list() {
    pm2Command(`node bin/loopar-status.js ${namespace}`);
  },

  status() {
    this.list();
  },
};

const [,, command, siteName] = process.argv;

if (!command || command === 'help' || command === '--help' || command === '-h') {
  commands.help();
  process.exit(0);
}

if (!commands[command]) {
  console.error(chalk.red(`\n❌ Unknown command: ${command}\n`));
  commands.help();
  process.exit(1);
}

commands[command](siteName);