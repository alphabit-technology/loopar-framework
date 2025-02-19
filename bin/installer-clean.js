import { rm } from 'fs/promises';
const framework = process.cwd();

async function cleanDistFolder() {
  try {
    await rm('../package-lock.json', { recursive: true, force: true });
    await rm('../yarn.lock', { recursive: true, force: true });
    await rm('../pnpm-lock.yaml', { recursive: true, force: true });
    
  } catch (error) {
    console.error('An error occurred while installer clean:', error);
  }
}

cleanDistFolder();