import { existsSync } from 'fs';
import path from 'path';
// tenant-builder directly — NOT the "loopar" core index. Importing the full
// core here cost seconds of boot for what is a pure fs operation, and this
// script runs as a child on every start (and as postinstall).
import { tenant } from "loopar/bin/tenant/tenant-builder.js";

const DEV_SITE = path.join(process.cwd(), 'sites', 'dev');

async function ensureDevSite() {
  if (existsSync(path.join(DEV_SITE, '.env'))) return;

  console.log('⚠️  Creating dev site...\n');

  await tenant.saveTenant({
    ID: 'dev',
    NAME: 'dev',
    PORT: process.env.PORT || 3000,
    NODE_ENV: 'development',
  });

  console.log('✅ Dev site created: sites/dev\n');
}

ensureDevSite().catch(console.error);