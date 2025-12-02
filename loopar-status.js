#!/usr/bin/env node
import pm2 from "pm2";
import Table from "cli-table3";
import chalk from "chalk";

const colorStatus = status => {
  status = status || "";
  if (status === "online") return chalk.green(status);
  if (["launching", "starting", "stopping"].includes(status)) return chalk.yellow(status);
  if (["stopped", "errored"].includes(status)) return chalk.red(status);
  return status;
};

const waitUntilOnline = (list, timeout = 100) => {
  const start = Date.now();
  return new Promise(resolve => {
    const check = () => {
      const allOnline = list.every(p => p.pm2_env.status === "online");
      if (allOnline || Date.now() - start > timeout) {
        resolve();
      } else {
        setTimeout(() => {
          pm2.list((err, newList) => {
            if (!err) list = newList;
            check();
          });
        }, 200);
      }
    };
    check();
  });
};

pm2.connect(async err => {
  if (err) {
    console.error("Can't connect to PM2:", err);
    process.exit(2);
  }

  pm2.list(async (err, list) => {
    if (err) {
      console.error("Can't get PM2 list:", err);
      pm2.disconnect();
      process.exit(1);
    }

    await waitUntilOnline(list);

    pm2.list((err2, finalList) => {
      if (err2) {
        console.error("Can't get final PM2 list:", err2);
        pm2.disconnect();
        process.exit(1);
      }

      const instanceCount = {};
      finalList.forEach(proc => {
        const isLoopar = proc.pm2_env.IS_LOOPAR ?? false;
        if (isLoopar) {
          const name = proc.name;
          instanceCount[name] = (instanceCount[name] || 0) + 1;
        }
      });

      const shownTenants = new Set();

      const table = new Table({
        head: [
          chalk.cyan("id"),
          chalk.cyan("pid"),
          chalk.cyan("site"),
          chalk.cyan("port"),
          chalk.cyan("hmr"),
          chalk.cyan("link"),
          chalk.cyan("status"),
          chalk.cyan("instances"),
          chalk.cyan("cpu"),
          chalk.cyan("mem"),
          chalk.cyan("uptime"),
          chalk.cyan("namespace"),
          chalk.cyan("version"),
          chalk.cyan("mode")
        ],
        style: { border: [] },
        colAligns: ["center", "center", "left", "center", "center", "left", "center", "center", "center", "right", "right", "center", "center"],
        wordWrap: true
      });

      finalList.forEach(proc => {
        const isLoopar = proc.pm2_env.IS_LOOPAR ?? false;
        if (isLoopar) {
          const name = proc.name;
          
          if (shownTenants.has(name)) {
            return;
          }
          shownTenants.add(name);

          const port = proc.pm2_env.PORT ?? "-";
          const hmr = proc.pm2_env.HMR_PORT ?? "-";

          const uptimeSec = proc.pm2_env.pm_uptime ? Math.floor((Date.now() - proc.pm2_env.pm_uptime) / 1000) : 0;
          const uptime = `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`;

          const link = port !== "-" ? `http://localhost:${port}/desk` : "-";
          
          const instances = instanceCount[name] || 1;
          const instancesDisplay = instances > 1 
            ? chalk.green(`${instances}`) 
            : chalk.gray(`${instances}`);

          table.push([
            chalk.white(proc.pm_id ?? "-"),
            chalk.white(proc.pid ?? "-"),
            chalk.magenta(name),
            chalk.cyan(port),
            chalk.blue(hmr),
            chalk.blue(link),
            colorStatus(proc.pm2_env.status),
            instancesDisplay,
            chalk.white((proc.monit.cpu ?? 0) + "%"),
            chalk.white(Math.round((proc.monit.memory ?? 0) / 1024 / 1024) + " MB"),
            chalk.white(uptime),
            chalk.white(proc.pm2_env.namespace ?? "-"),
            chalk.white(proc.pm2_env.version ?? "-"),
            chalk.white(proc.pm2_env.exec_mode.split("_")[0] ?? "-"),
          ]);
        }
      });

      console.log(table.toString());
      pm2.disconnect();
    });
  });
});