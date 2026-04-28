import { ActionScanner } from './ActionScanner.js';

export async function PermissionSync(loopar){
  const codeMap = await ActionScanner.getAllActions();

  const dbRows = await loopar.db.getAll(
    'Permission',
    ['name', 'document', 'action'],
    null
  );

  const codeSet = new Set();
  const dbMap = new Map();

  for (const [document, actions] of Object.entries(codeMap)) {
    for (const action of actions) {
      codeSet.add(`${document}:${action}`);
    }
  }

  for (const row of dbRows) {
    dbMap.set(`${row.document}:${row.action}`, row.name);
  }

  let inserted = 0;
  let deleted  = 0;

  // INSERT — in code but not in DB
  for (const key of codeSet) {
    if (!dbMap.has(key)) {
      const [document, action] = key.split(':');
      const app = ActionScanner.getApp(document);

      if(await loopar.db.count("Permission", `${document}-${action}`) == 0){
        await loopar.db.insertRow('Permission', {
          name: `${document}-${action}`,
          document,
          action,
          app: app ?? null,
        });
      }
      inserted++;
    }
  }

  for (const [key, dbName] of dbMap) {
    if (!codeSet.has(key)) {
      const [document, action] = key.split(':');

      await loopar.db.deleteWhere('Permission', {
        document,
        action,
      });

      await loopar.db.deleteRow('Permission', dbName);
      deleted++;
    }
  }

  console.log(`[PermissionSync] +${inserted} inserted, -${deleted} deleted`);
  return { inserted, deleted, permissions: await loopar.db.getAll(
    'Permission',
    ['name', 'document', 'action'],
    null
  )}
}