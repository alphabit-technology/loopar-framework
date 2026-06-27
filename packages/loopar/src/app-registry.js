let cache;

export async function getAppRegistry(environment = 'client') {
  if (cache !== undefined) return cache;
  try {
    cache = environment === 'server'
      ? await readServerRegistry()
      : await readClientRegistry();
  } catch {
    cache = {};
  }
  return cache;
}

export function resetAppRegistryCache() {
  cache = undefined;
}

async function readClientRegistry() {
  const res = await fetch('/app-registry.json', { cache: 'force-cache' });
  return res.ok ? await res.json() : {};
}

async function readServerRegistry() {
  const fs = await import(/* @vite-ignore */ 'node:fs');
  const path = await import(/* @vite-ignore */ 'node:path');
  const file = path.join(process.cwd(), 'dist/server/app-registry.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
}
