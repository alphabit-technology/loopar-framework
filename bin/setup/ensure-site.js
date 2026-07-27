import { existsSync } from 'fs';
import path from 'path';
import { tenant } from "loopar/bin/tenant/tenant-builder.js";

const DEV_SITE = path.join(process.cwd(), 'sites', 'dev');

async function ensureDevSite() {
  // Already provisioned config.json — nothing to do.
  if (existsSync(DEV_SITE)) return;

  console.log('⚠️  Creating dev site...\n');

  // Local dev bootstrap: create `dev` active so the Desk is reachable on a
  // fresh install. (Other tenants default OFF — cloud-coherent.)
  await tenant.saveTenant({
    NAME: 'dev',
    DOMAIN: 'dev.localhost',
    STATUS: 'active',
  });

  console.log('✅ Dev site created: sites/dev/config.json\n');
}

ensureDevSite().catch(console.error);