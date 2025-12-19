import fs from "fs";
import path from "path";
const __dirname = process.cwd();

export function readEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return {};

  const content = fs.readFileSync(envPath, "utf8");

  const result = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.+)$/);
    if (!match) continue;

    let [, key, value] = match;

    value = value.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

    result[key] = value;
  }

  return result;
}

const tenantsDir = path.join(__dirname, 'sites');
const tenants = fs.existsSync(tenantsDir) 
  ? fs.readdirSync(tenantsDir).filter(f => 
      fs.statSync(path.join(tenantsDir, f)).isDirectory()
    )
  : [];

const allApps = tenants.map(tenantId => {
  const tenantPath = path.join(tenantsDir, tenantId);
  const envData = readEnvFile(path.join(tenantPath, '.env'));

  const port = envData.PORT || 3000;
  const domain = envData.DOMAIN || "";
  const NODE_ENV = envData.NODE_ENV || "development";

  const installedAppsPath = path.join(tenantPath, 'installed-apps.json');

  let installedApps = [];

  try {
    installedApps = Object.keys(JSON.parse(fs.readFileSync(installedAppsPath, 'utf8')));
  } catch (err) {}

  return {
    namespace: path.basename(process.cwd()),
    name: tenantId, 
    script: 'node_modules/loopar/bin/pm2-wrapper.js',
    env: { 
      NODE_ENV: NODE_ENV || "development",
      TENANT_ID: tenantId,
      TENANT_PATH: tenantPath,
      DOMAIN: domain || "",
      PORT: port || "",
      INSTALLED_APPS: installedApps,
      IS_LOOPAR: true
    }
  };
});
const apps = allApps.find(app => app.name === 'dev');

export { 
  apps,
  allApps
 };