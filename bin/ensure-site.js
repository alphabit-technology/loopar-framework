// bin/ensure-site.js
import fs from 'fs/promises';
import { existsSync, readdirSync } from 'fs';
import path from 'path';
import inquirer from 'inquirer';

async function ensureCoreSite() {
  const sitesDir = path.join(process.cwd(), 'sites', 'core');
  
  if (!existsSync(sitesDir)) {
    await fs.mkdir(sitesDir, { recursive: true });
  }

  const sites = readdirSync(sitesDir).filter(f => !f.startsWith('.'));

  if (sites.length > 0) {
    console.log(["Site core already exists"])
    return;
  }

  console.log('⚠️  No sites found. Creating core site...\n');

  await createCoreSite();
}

async function createCoreSite() {
  const siteName = 'core';
  const port = process.env.PORT || 3000;
  const sitePath = path.join(process.cwd(), 'sites', siteName);

  await fs.mkdir(sitePath, { recursive: true });
  await fs.mkdir(path.join(sitePath, 'sessions'), { recursive: true });
  await fs.mkdir(path.join(sitePath, 'public', 'uploads'), { recursive: true });

  const envContent = `PORT=${port}
NAME=${siteName}
PORT=${port}
TENANT_ID=${siteName}
NODE_ENV=development
`;

  await fs.writeFile(path.join(sitePath, '.env'), envContent);

  const installedApps = {};

  await fs.writeFile(
    path.join(sitePath, 'installed-apps.json'),
    JSON.stringify(installedApps, null, 2)
  );

  console.log(`✅ Default site created: sites/${siteName}`);
  console.log(`   URL: http://localhost:${port}\n`);
}

async function createSiteInteractive() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Site name:',
      default: 'core'
    },
    {
      type: 'number',
      name: 'port',
      message: 'Port:',
      default: 3000
    }
  ]);

  await createSite(answers.name, answers.port);
}

ensureCoreSite().catch(console.error);