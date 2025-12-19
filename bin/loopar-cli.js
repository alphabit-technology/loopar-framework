#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';

const projectPath = process.cwd();
const projectName = path.basename(projectPath);

function getProcessName(siteName) {
  return `${projectName}-${siteName}`;
}

const namespace = `${projectName}-`;

function pm2Command(cmd, silent = false) {
  try {
    const result = execSync(cmd, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    return result;
  } catch (err) {
    if (!silent) {
      console.error(chalk.red(`Error: ${err}`));
    }
    
    return null;
  }
}

const commands = {
  dev() {
    console.log(chalk.cyan(`Starting ${namespace}core site. `));
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