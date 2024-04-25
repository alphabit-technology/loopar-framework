import { ContextLoader } from "@loopar/context-loader";
const AppsSources = {};

export async function AppSourceLoader(source) {
  return new Promise((resolve, reject) => {
    if (source.client) {
      if (AppsSources[source.client]) {
        return resolve(AppsSources[source.client]);
      } else {
        import(`./${source.client}.jsx`).then((Source) => {
          AppsSources[source.client] = Source;
          return resolve(Source);
        }).catch((error) => {
          reject(error);
        });
      }
    } else {
      ContextLoader(source).then((Source) => {
        return resolve(Source);
      });
    }
  });
}
