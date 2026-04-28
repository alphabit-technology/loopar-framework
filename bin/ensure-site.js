import { existsSync } from 'fs';
import path from 'path';
import { tenant } from "loopar";

const DEV_SITE = path.join(process.cwd(), 'sites', 'dev');

async function ensureDevSite() {
  if (existsSync(path.join(DEV_SITE, '.env'))) return;

  console.log('⚠️  Creating dev site...\n');

  await tenant.saveTenant({
    NAME: 'dev',
    PORT: process.env.PORT || 3000,
    NODE_ENV: 'development',
  });

  console.log('✅ Dev site created: sites/dev\n');
}

ensureDevSite().catch(console.error);