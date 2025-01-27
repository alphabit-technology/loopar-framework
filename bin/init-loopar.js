#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'pathe';

const framework = process.cwd();
const localModulePath = path.resolve(framework, '.loopar');

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`, error.message);
    process.exit(1);
  }
}

runCommand(`cd ${localModulePath} && npm link`);