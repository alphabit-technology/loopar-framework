import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tenantsDir = path.join(__dirname, 'sites');
const tenants = fs.existsSync(tenantsDir) 
  ? fs.readdirSync(tenantsDir).filter(f => 
      fs.statSync(path.join(tenantsDir, f)).isDirectory()
    )
  : [];

const apps = tenants.map(tenantId => {
  const tenantPath = path.join(tenantsDir, tenantId);
  const envFile = path.join(tenantPath, '.env');
  
  let port = 3000;
  if (fs.existsSync(envFile)) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    const portMatch = envContent.match(/PORT=(\d+)/);
    if (portMatch) port = parseInt(portMatch[1]);
  }

  return {
    name: `${tenantId}`,
    script: './bin/start.js',
    env: {
      NODE_ENV: 'development',
      TENANT_ID: tenantId,
      TENANT_PATH: tenantPath,
      PORT: port,
      HMR_PORT: port + 10000
    },
    env_production: {
      NODE_ENV: 'production',
      TENANT_ID: tenantId,
      TENANT_PATH: tenantPath,
      PORT: port
    }
  };
});

export { apps };