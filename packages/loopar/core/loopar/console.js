import {Core} from "./core.js";

export class Console extends Core { 
  async log(...args) {
    console.log(...args);
  }

  async error(...args) {
    console.error(...args);
  }

  async warn(...args) {
    console.warn(...args);
  }


  printMessage() {
    console.log(`__________________________________________________________`);
    console.log(...arguments);
    console.log(`***********************************************************\n`);
  }

  printSuccess() {
    console.log("\x1b[32m__________________________________________________________");
    console.log(...arguments);
    console.log(`\x1b[32m***********************************************************`);
    console.log("\x1b[0m", "");
  }

  printError() {
    console.log("\x1b[31m__________________________________________________________");
    console.error(...arguments);
    console.log(`\x1b[31m***********************************************************`);
    console.log("\x1b[0m", "");
  }
}