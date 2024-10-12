import { ContextLoader } from "@loopar/context-loader";
const AppsSources = {};

export async function AppSourceLoader(source) {
  return new Promise((resolve, reject) => {
    if(!source) return null;

    if (source.client) {
      if (AppsSources[source.client]) {
        return resolve(AppsSources[source.client]);
      } else {
        try {
          const Source =  resolve(import(`./${source.client}.jsx`));
          AppsSources[source.client] = Source;
          return resolve(Source);
        } catch (error) {
          console.error(`Error importing module: ${source.client}`, error);
          throw new Error(`Error importing module: ${source.client}`);
          
        }
        /*import(`./${source.client}.jsx`).then((Source) => {
          AppsSources[source.client] = Source;
          return resolve(Source);
        }).catch((error) => {
          console.error(`Error importing module: ${source.client}`, error);
          throw new Error(`Error importing module: ${source.client}`);
          ///return reject(error);
        });*/
      }
    } else {
      ContextLoader(source).then((Source) => {
        return resolve(Source);
      });
    }
  });
}
