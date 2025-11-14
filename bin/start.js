#!/usr/bin/env node

import { readFile } from 'fs/promises';
import path from "pathe";

const tenantId = process.env.TENANT_ID;
const tenantPath = process.env.TENANT_PATH;

import { loopar } from "loopar";

if (!tenantId) {
  console.error('❌ TENANT_ID no está definido');
  process.exit(1);
}

const tenantConfigPath = path.join(tenantPath, 'installed-apps.json');
const tenantConfig = JSON.parse(await readFile(tenantConfigPath, 'utf8'));

await loopar.init({
  tenantId,
  tenantPath,
  installedApps: tenantConfig.installed,
});