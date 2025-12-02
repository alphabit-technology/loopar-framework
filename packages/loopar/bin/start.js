#!/usr/bin/env node

const tenantId = process.env.TENANT_ID;
import { loopar } from "../index.js";

if (!tenantId) {
  console.error('❌ TENANT_ID is not defined');
  process.exit(1);
}

await loopar.init({
  tenantId,
  installedApps: JSON.parse(process.env.INSTALLED_APPS),
});