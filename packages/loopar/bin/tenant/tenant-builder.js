import fs from 'fs/promises';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import path from 'pathe';
import crypto from 'node:crypto';

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
  { key: 'CUSTOMER_EMAIL', default: null, required: false },
  { key: 'CLOUD_VERIFIER_URL', default: null, required: false },
  { key: 'CLOUD_VERIFIER_TOKEN', default: null, required: false },

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
  // Canonical fields first — apply defaults + required validation.
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

  // Preserve any custom keys that aren't in TENANT_ENV_FIELDS — operators
  // (and the control plane) can stash arbitrary env vars in the tenant .env
  // (e.g. CLOUD_CLAIM_SECRET, integration credentials). Without this pass
  // every saveTenant would silently strip them on re-serialization. We
  // explicitly skip TENANT_PATH because readEnvFile injects it as a runtime
  // convenience and it isn't real config.
  const canonicalKeys = new Set(TENANT_ENV_FIELDS.map(f => f.key));
  for (const [key, value] of Object.entries(normalized)) {
    if (canonicalKeys.has(key)) continue;
    if (key === 'TENANT_PATH') continue;
    if (value === null || value === undefined || value === '') continue;
    result[key] = String(value);
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
  // Read the current .env (if any) and merge `data` on top, so each save
  // patches the file instead of overwriting it. Callers that touch only one
  // or two fields don't accidentally wipe the rest.
  const current = isNew ? {} : readEnvFile(name);
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
  const customerEmail = envData.CUSTOMER_EMAIL || "";
  const cloudVerifierUrl = envData.CLOUD_VERIFIER_URL || "";
  const cloudVerifierToken = envData.CLOUD_VERIFIER_TOKEN || "";
  // CLOUD_CLAIM_SECRET is the JWT signing secret for the magic-link claim
  // tokens. It lives ONLY on the control-plane tenant's .env (never gets
  // serialized into TENANT_ENV_FIELDS because it has no business in client
  // tenant .env files). Passing it through here lets the control-plane
  // process see it via process.env so issueClaimToken / verifyAndConsumeClaim
  // can sign and verify.
  const cloudClaimSecret = envData.CLOUD_CLAIM_SECRET || "";

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
      CUSTOMER_EMAIL: customerEmail,
      CLOUD_VERIFIER_URL: cloudVerifierUrl,
      CLOUD_VERIFIER_TOKEN: cloudVerifierToken,
      CLOUD_CLAIM_SECRET: cloudClaimSecret,
      IS_LOOPAR: true
    }
  };
});

export function getTenantData(name, onNotFound = 'throw') {
  const tenantPath = path.join(SITES_DIR, name);
  const envFile = path.join(tenantPath, '.env');
  const app = tenants().find(a => a.name === name);

  if (!app || !existsSync(envFile)) {
    if (onNotFound === 'throw') throw new Error(`Tenant ${name} not found`);
    return onNotFound;
  }

  return { ...app, env: { ...app.env, ...readEnvFile(name) } };
}

function sites() {
  if (!existsSync(SITES_DIR)) return [];
  return readdirSync(SITES_DIR).filter(f => {
    return statSync(path.join(SITES_DIR, f)).isDirectory();
  });
}

export function allocateFreePort({ base = 3100, max = 3999 } = {}) {
  const used = new Set(
    tenants()
      .map(t => Number(t.env?.PORT))
      .filter(p => Number.isFinite(p) && p > 0)
  );
  for (let p = base; p < max; p++) {
    if (!used.has(p)) return p;
  }
  throw new Error(`No free tenant port in range ${base}..${max}`);
}

/**
 * Pre-seed `config/db.config.json` for a new tenant by copying another
 * tenant's template and picking a unique `database` name. With this in place
 * the new tenant skips `/loopar/system/connect` on first boot and goes
 * straight to install. The control plane uses this to clone its own DB
 * config when provisioning a customer workspace.
 *
 * @param {object}  opts
 * @param {string}  opts.from  Source tenant whose db.config.json is copied.
 * @param {string}  opts.to    Destination tenant (the new one).
 * @returns {Promise<string>}  The unique database name written into the copy.
 */
export async function saveDbConfig({ from, to } = {}) {
  if (!from || !to) {
    throw new Error('[TenantBuilder] saveDbConfig: { from, to } are required');
  }
  const srcPath = path.join(SITES_DIR, from, 'config', 'db.config.json');
  if (!existsSync(srcPath)) {
    throw new Error(
      `[TenantBuilder] saveDbConfig: source not found at ${srcPath} — ` +
      `cannot template a new tenant's DB config.`
    );
  }
  const tmpl = JSON.parse(readFileSync(srcPath, 'utf8'));
  // Unique per-tenant DB name. SHA-1 of tenant+timestamp (16 hex chars) keeps
  // it short, predictable, and collision-free in practice.
  tmpl.database =
    'db_' + crypto.createHash('sha1').update(to + Date.now()).digest('hex').slice(0, 16);

  const dstDir = path.join(SITES_DIR, to, 'config');
  await fs.mkdir(dstDir, { recursive: true });
  await fs.writeFile(
    path.join(dstDir, 'db.config.json'),
    JSON.stringify(tmpl, null, 2),
    'utf8'
  );
  return tmpl.database;
}

export function tenantUrl(name, override = {}) {
  // Override lets callers compute the URL before the tenant .env exists on
  // disk (e.g. the provisioning flow needs the URL inside the JWT payload
  // BEFORE writing the env). Without it, look up the live tenant by name.
  let domain = override.domain;
  let port   = override.port;
  if (!domain) {
    const t = tenants().find(x => x.name === name);
    if (!t) return null;
    const env = t.env || {};
    domain = env.DOMAIN || `${name}.localhost`;
    port   = Number(env.PORT);
  }
  // Local-only domains never get SSL and need their port appended.
  // Real domains (anything not ending in .localhost / not bare "localhost")
  // are served behind Caddy with auto-HTTPS, so the URL omits the port.
  const isLocal = domain === 'localhost' || domain.endsWith('.localhost');
  return isLocal ? `http://${domain}:${port}` : `https://${domain}`;
}

const tenant = {
  tenants,
  saveTenant,
  readEnvFile,
  getTenantData,
  allocateFreePort,
  tenantUrl,
  saveDbConfig,
}

export {
  tenant,
  tenants
}