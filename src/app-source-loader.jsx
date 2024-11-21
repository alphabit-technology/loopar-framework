import { ContextLoader } from "@loopar/context-loader"; 

const AppsSources = {};
const appsModules = import.meta.glob('/apps/**/modules/**/**/**/client/*.jsx');
const coreModules = import.meta.glob('/.loopar/apps/core/modules/**/**/**/client/*.jsx');
const inputModules = { ...appsModules, ...coreModules };

const outputModules = Object.keys(inputModules).reduce((acc, key) => {
  const fileName = key.split('/').pop();
  const simplifiedKey = `app/${fileName.replace('.jsx', '')}`;
  acc[simplifiedKey] = inputModules[key];
  return acc;
}, {});

export async function AppSourceLoader(source) {
  if (!source) return null;

  if (source.client && AppsSources[source.client]) {
    return AppsSources[source.client];
  }

  try {
    if (source.client) {
      const moduleImport = outputModules[source.client];
      if (moduleImport) {
        const Source = await moduleImport();
        AppsSources[source.client] = Source;
        return Source;
      }
    } else {
      const Source = await ContextLoader(source);
      return Source;
    }
  } catch (error) {
    console.error(`Error importing module: ${source.client}`, error);
    throw new Error(`Error importing module: ${source.client}`);
  }
}
