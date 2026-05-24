import fs from 'fs/promises';
import { existsSync, readdirSync, readSync, statSync, readFileSync } from 'fs';
import path from 'pathe';

const SITES_DIR = path.join(process.cwd(), 'sites');

/**
 * Canonical fields for the tenant .env file.
 * Order matters — it determines the order in the written file.
 */
export const TENANT_ENV_FIELDS = [
  { key: '__DOCUMENT_STATUS__',   default: 'Active', required: false },
  { key: 'ID', default: null, required: true  },
  { key: 'NAME', default: null, required: true  },
  { key: 'PORT', default: 3000, required: true  },
  { key: 'DOMAIN', default: (data) => `${data.NAME ?? data.ID}.localhost`, required: false },
  { key: 'FORCE_CONNECT', default: 0, required: false },
  { key: 'NODE_ENV', default: 'development', required: false },
  { key: 'CONTROL_PLANE', default: 0, required: false },
  
  //TODO: Integrate Redis
  { key: 'REDIS_HOST', default: null, required: false },
  { key: 'REDIS_PORT', default: 6379, required: false },
  { key: 'REDIS_PASSWORD', default: null, required: false },
  { key: 'REDIS_TTL_PERMISSIONS', default: 300, required: false },
  { key: 'REDIS_TTL_SESSIONS', default: 86400, required: false },
];

const TENANT_FOLDERS = [
  'config',
  'sessions',
  path.join('public', 'uploads'),
  path.join('public', 'thumbnails'),
];

export function readEnvFile(envId) {
  if (!existsSync(path.join(SITES_DIR, envId))) return {};
  if (!existsSync(path.join(SITES_DIR, envId, ".env"))) return {};

  const result = {};
  const envPath = path.join(SITES_DIR, envId, '.env');

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([\w.-]+)\s*=\s*(.+)$/);
    if (!match) continue;
    let [, key, value] = match;
    value = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    result[key] = value;
  }

  result.TENANT_PATH = path.join(SITES_DIR, envId)
  return result;
}

export function buildTenantEnvData(data) {
  const normalized = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k.toUpperCase(), v])
  );

  const result = {};
  for (const field of TENANT_ENV_FIELDS) {
    const raw = normalized[field.key];
    let value = (raw !== undefined && raw !== null && raw !== '')
      ? raw
      : (typeof field.default === 'function' ? field.default(normalized) : field.default);

    if (value === null || value === undefined || value === '') {
      if (field.required) throw new Error(`[TenantBuilder] Missing required field: ${field.key}`);
      continue;
    }

    result[field.key] = String(value);
  }

  return result;
}

export function serializeEnv(envData) {
  return Object.entries(envData)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n') + '\n';
}

export async function createTenantFolders(tenantPath) {
  await fs.mkdir(tenantPath, { recursive: true });
  for (const folder of TENANT_FOLDERS) {
    await fs.mkdir(path.join(tenantPath, folder), { recursive: true });
  }
}

export async function writeTenantEnv(tenantPath, data) {
  const envData = buildTenantEnvData(data);
  await fs.writeFile(path.join(tenantPath, '.env'), serializeEnv(envData), 'utf8');
  return envData;
}

export async function saveTenant(data) {
  const name = data.name ?? data.NAME;
  if (!name) throw new Error('[TenantBuilder] name/NAME is required');

  const tenantPath = path.join(SITES_DIR, name);
  const isNew      = !existsSync(tenantPath);

  if (isNew) await createTenantFolders(tenantPath);
  const current = isNew ? {} : readEnvFile(path.join(tenantPath, '.env'));
  const merged  = { ...current, ...data };

  await writeTenantEnv(tenantPath, merged);

  return { tenantPath, isNew };
}

const tenants = () => sites().map(tenantId => {
  const envData = readEnvFile(tenantId);
  
  const port = envData.PORT || 3000;
  const domain = envData.DOMAIN || "";
  const NODE_ENV = envData.NODE_ENV || "development";
  const controlPlane = envData.CONTROL_PLANE || "0";

  return {
    namespace: path.basename(process.cwd()),
    name: tenantId,
    script: 'node_modules/loopar/bin/pm2-wrapper.js',
    env: {
      NODE_ENV: NODE_ENV || "development",
      TENANT_ID: tenantId,
      TENANT_PATH: envData.TENANT_PATH,
      DOMAIN: domain || "",
      PORT: port || "",
      CONTROL_PLANE: controlPlane,
      IS_LOOPAR: true
    }
  };
});

export function getTenantData(name, onNotFound = 'throw') {
  const tenantPatxh = path.join(SITES_DIR, name);
  const envFile = path.join(tenantPatxh, '.env');
  const app = tenants().find(a => a.name === name);

  if (!app || !existsSync(envFile)) {
    if (onNotFound === 'throw') throw new Error(`Tenant ${name} not found`);
    return onNotFound;
  }

  return { ...app, env: { ...app.env, ...readEnvFile(name) } };
}

function sites(){
  return existsSync(SITES_DIR)
  ? readdirSync(SITES_DIR).filter(f => 
      statSync(path.join(SITES_DIR, f)).isDirectory() && existsSync(SITES_DIR, f, ".env")
    )
  : [];
}

const tenant = {
  tenants,
  saveTenant,
  readEnvFile,
  getTenantData
}

export {
  tenant,
  tenants
}