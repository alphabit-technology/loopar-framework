const ContextSources = {};

export async function ContextLoader(source) {
  return new Promise((resolve) => {
    if (ContextSources[source.context]) {
      resolve(ContextSources[source.context]);
    } else {
      import(`./context/${source.context}.jsx`).then((Source) => {
        ContextSources[source.context] = Source;
        resolve(Source);
      });
    }
  });
}
