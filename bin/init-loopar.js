#!/usr/bin/env node
import { execSync } from 'child_process';

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`, error.message);
    process.exit(1);
  }
}

runCommand(`cd .loopar && npm link`);
runCommand(`cd .. && npm link loopar`);