// bin/ensure-site.js
import fs from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import path from 'path';

async function ensureDevSite() {
  const sitesDir = path.join(process.cwd(), 'sites', 'dev');
  
  if (!existsSync(sitesDir)) {
    await fs.mkdir(sitesDir, { recursive: true });
  }

  const sites = readdirSync(sitesDir).filter(f => !f.startsWith('.'));

  if (sites.length > 0) return;

  console.log('⚠️ Creating dev site...\n');

  await createDevSite();
}

async function createDevSite() {
  const siteName = 'dev';
  const port = process.env.PORT || 3000;
  const sitePath = path.join(process.cwd(), 'sites', siteName);

  await fs.mkdir(sitePath, { recursive: true });
  await fs.mkdir(path.join(sitePath, 'sessions'), { recursive: true });
  await fs.mkdir(path.join(sitePath, 'config'), { recursive: true });
  await fs.mkdir(path.join(sitePath, 'public', 'uploads'), { recursive: true });

  const envContent = `PORT=${port}
NAME=${siteName}
PORT=${port}
TENANT_ID=${siteName}
NODE_ENV=development
`;

  await fs.writeFile(path.join(sitePath, '.env'), envContent);


  console.log(`✅ Ddev site created: sites/${siteName}`);
  console.log(`   URL: http://localhost:${port}\n`);
}

ensureDevSite().catch(console.error);