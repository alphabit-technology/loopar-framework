import { ActionScanner } from './ActionScanner.js';

/**
 * Reconcile the CATALOG rows of `Permission` (relation IS NULL) with the
 * actions the controllers expose. Grants (rows with `relation` = User|Role)
 * are never touched here: they belong to the admin (or to an app installer),
 * and may legitimately use wildcards (`*`) that no controller exposes.
 */
const isCatalog = row => row.relation == null || row.relation === '';

export async function PermissionSync(loopar){
  const codeMap = await ActionScanner.getAllActions();

  const dbRows = (await loopar.db.getAll(
    'Permission',
    ['name', 'document', 'action', 'relation'],
    null
  )).filter(isCatalog);

  const codeSet = new Set();
  const dbMap = new Map();

  for (const { document, action } of codeMap) {
    codeSet.add(`${document}:${action}`);
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
          relation: null,
          relation_name: null,
          scope: 'all',
        });
      }
      inserted++;
    }
  }

  // DELETE — catalog rows whose action no longer exists in code
  for (const [key, dbName] of dbMap) {
    if (!codeSet.has(key)) {
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
