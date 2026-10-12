'use strict';

import { isEncryptedSecret, SECRET_PREFIX } from './secrets.js';

/** Encrypt-mode password field names declared in an entity's doc_structure. */
function encryptedFieldsOf(entity) {
  let structure = entity.doc_structure;
  if (typeof structure === 'string') {
    try { structure = JSON.parse(structure); } catch { return []; }
  }
  const out = [];
  (function walk(nodes) {
    for (const node of nodes || []) {
      if (node?.element === 'password' && node.data?.name && node.data.secret !== 'hash') {
        out.push(node.data.name);
      }
      walk(node?.elements);
    }
  })(structure);
  return out;
}

/**
 * One-way migration of plaintext secrets to `enc:v1:` ciphertext.
 * Idempotent: only values without the prefix are touched, so it is cheap to
 * run on every boot. Writes bypass the ORM events on purpose (no history
 * rows, no hooks) — this changes the storage format, not the value.
 */
export async function migratePlaintextSecrets(loopar) {
  if (!loopar.__installed__) return;

  const qx = loopar.db.qx();
  const hasTable = async (name) => {
    try { return await loopar.db.knex.schema.hasTable(name); } catch { return false; }
  };
  let migrated = 0;

  for (const entity of loopar.getEntities()) {
    const fields = encryptedFieldsOf(entity);
    if (!fields.length) continue;

    if (entity.is_single) {
      const tbl = 'Document Single Values';
      if (!await hasTable(tbl)) continue;
      const rows = await qx(tbl)
        .select('name', 'value')
        .where({ document: entity.name })
        .whereIn('field', fields);
      for (const row of rows) {
        if (!row.value || isEncryptedSecret(row.value)) continue;
        await qx(tbl).where({ name: row.name }).update({ value: loopar.encryptSecret(String(row.value)) });
        migrated++;
      }
      continue;
    }

    if (!await hasTable(entity.name)) continue;
    for (const field of fields) {
      if (!await loopar.db.knex.schema.hasColumn(entity.name, field)) continue;
      const rows = await qx(entity.name)
        .select('id', field)
        .whereNotNull(field)
        .where(field, '<>', '')
        .where(field, 'not like', `${SECRET_PREFIX}%`);
      for (const row of rows) {
        await qx(entity.name).where({ id: row.id }).update({ [field]: loopar.encryptSecret(String(row[field])) });
        migrated++;
      }
    }
  }

  if (migrated) console.log(`[secrets] encrypted ${migrated} plaintext secret value(s) for tenant ${loopar.tenantId}`);
}
