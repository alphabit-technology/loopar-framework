'use strict';

import { isAuditableEntity, Helpers } from "../../index.js";

const HISTORY_TABLE = "Document History";

const ACTIONS = Object.freeze({
  CREATED: "Created",
  UPDATED: "Updated",
  DELETED: "Deleted",
  RESTORED: "Restored",
  COMMENTED: "Commented",
});


function isTrackable(loopar, document) {
  if (!document) return false;
  if (document === HISTORY_TABLE) return false;        // no self-recursion
  const ref = loopar.getRef?.(document);
  return isAuditableEntity(ref);
}

/**
 * Compute a per-field diff between two row snapshots. Returns null
 * when nothing changed (so the listener can skip writing a no-op
 * Update row).
 *
 * Audit columns are intentionally excluded — every Update changes
 * __updated_at__, including that in the diff would make every entry
 * look the same and drown the real changes in noise.
 */
function buildDiff(before, after) {
  if (!before || !after) return null;
  const SKIP = new Set([
    "__created_at__", "__updated_at__", "__deleted_at__", "__document_status__",
  ]);
  const diff = {};
  for (const key of Object.keys(after)) {
    if (SKIP.has(key)) continue;
    const a = after[key];
    const b = before[key];

    if (JSON.stringify(a) !== JSON.stringify(b)) {
      diff[key] = { before: b ?? null, after: a ?? null };
    }
  }
  return Object.keys(diff).length ? diff : null;
}

function buildHistoryRow(loopar, { document, doc, action, extras = {} }) {
  return {
    name: Helpers.randomString(15),
    document,
    document_name: doc?.name ?? doc?.data?.name ?? null,
    action,
    user: loopar.currentUser?.name ?? null,
    event_at: new Date().toISOString(),
    diff: extras.diff ? JSON.stringify(extras.diff)     : null,
    comment: extras.comment ?? null,
    metadata: extras.metadata ? JSON.stringify(extras.metadata) : null,
  };
}

async function writeHistory(loopar, payload) {
  try {
    await loopar.db.insertRow(HISTORY_TABLE, payload);
  } catch (err) {
    console.error(
      `[history] failed to write ${payload.action} for ${payload.document}:` +
      `${payload.document_name}: ${err.message}`
    );
  }
}

async function addComment(loopar, document, documentName, text, { metadata } = {}) {
  if (!text || !documentName) return;
  await writeHistory(loopar, {
    name: Helpers.randomString(15),
    document,
    document_name: documentName,
    action: ACTIONS.COMMENTED,
    user: loopar.currentUser?.name ?? null,
    event_at: new Date().toISOString(),
    diff: null,
    comment: text,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
}

/**
 * Wire the listeners. Called once at boot, after the ORM is
 * instantiated. The KnexORM bus is static, so we register against
 * the constructor (KnexORM.on, not this.db.on).
 */
export function setupDocumentHistory(loopar, KnexORM) {
  // afterCreate: rows that come in fresh, plus the restore path that
  // insertRow fires when reviving a soft-deleted name. We tell them
  // apart by the row data:
  //   - restore: __deleted_at__ was just set back to null, the existing
  //     id is reused. We mark it as Restored.
  //   - regular: a brand-new id was allocated. Created.
  // The shape of `doc` differs by source; we fall back to Created when
  // the marker isn't there.
  KnexORM.on("afterCreate", async ({ document, doc }) => {
    if (!isTrackable(loopar, document)) return;
    const action = doc?.__restored__ ? ACTIONS.RESTORED : ACTIONS.CREATED;
    delete doc.__restored__;          // internal flag, don't persist
    await writeHistory(loopar, buildHistoryRow(loopar, { document, doc, action }));
  });

  // afterUpdate gets both `before` (snapshot pre-write) and `doc`
  // (incoming payload). The diff is computed here, not at the ORM
  // level, so history-specific concerns stay out of the ORM.
  KnexORM.on("afterUpdate", async ({ document, doc, before }) => {
    if (!isTrackable(loopar, document)) return;
    const diff = buildDiff(before, doc?.data ?? doc);
    if (!diff) return;                // no real change, skip
    await writeHistory(loopar, buildHistoryRow(loopar, {
      document, doc: doc?.data ?? doc, action: ACTIONS.UPDATED, extras: { diff },
    }));
  });

  KnexORM.on("afterDelete", async ({ document, doc }) => {
    if (!isTrackable(loopar, document)) return;
    await writeHistory(loopar, buildHistoryRow(loopar, {
      document, doc, action: ACTIONS.DELETED,
    }));
  });

  loopar.history = {
    addComment: (document, documentName, text, opts) =>
      addComment(loopar, document, documentName, text, opts),
    ACTIONS,
  };
}

export { ACTIONS };
