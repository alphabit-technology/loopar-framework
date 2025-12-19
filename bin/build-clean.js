import { rm } from 'fs/promises';

async function cleanDistFolder() {
  try {
    await rm('../dist', { recursive: true, force: true });
    console.log('The "dist" folder has been successfully removed.');
  } catch (error) {
    console.error('An error occurred while removing the "dist" folder:', error);
  }
}

cleanDistFolder();