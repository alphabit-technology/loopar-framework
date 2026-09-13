'use strict';

export function avatarColor(name) {
  const colors = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#10b981","#3b82f6"];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
}

export function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function getOwnActions(acts, commonActions) {
  return Object.keys(acts).filter(a => !commonActions.includes(a));
}

export function makeGridCols(commonActions, hasOwn) {
  return `260px ${commonActions.map(() => '72px').join(' ')}${hasOwn ? ' 90px' : ''}`;
}

// Keys are `${document}:${action.toLowerCase()}` on both sides: the catalog
// lists actions Capitalized (from `actionList` → "List") while grants may be
// stored lowercase (seeded roles). The server normalizes the same way.
export const permKey = (document, action) => `${document}:${String(action ?? '').toLowerCase()}`;
const lc = k => String(k ?? '').toLowerCase();

/**
 * Keys that would cover (document, action) for a document of `app`, most
 * specific first. Mirrors PermissionManager.scope() on the server.
 */
export function coveringKeys(app, document, action) {
  return [
    permKey(document, action),
    `${document}:*`,
    permKey(`App:${app}`, action),
    `App:${app}:*`,
    permKey('*', action),
    '*:*',
  ];
}

/**
 * Resolve one cell against what the server returned for the subject.
 *   resolved = { direct: [keys], inherited: {key: [roles]}, denied: [keys], scopes: {key: 'own'} }
 * Returns { granted, kind: 'deny'|'direct'|'wildcard'|'role'|'none', via, own, key }
 *   via  – the covering key (wildcard) or the role names (role) that provide it
 *   own  – scope 'own' (every provider is 'own'); widest wins
 */
export function resolveCell(resolved, app, document, action) {
  const key = permKey(document, action);
  const direct = new Set((resolved?.direct ?? []).map(lc));
  const denied = new Set((resolved?.denied ?? []).map(lc));
  const inherited = {};
  for (const [k, roles] of Object.entries(resolved?.inherited ?? {})) inherited[lc(k)] = roles;
  const scopes = {};
  for (const [k, v] of Object.entries(resolved?.scopes ?? {})) scopes[lc(k)] = v;

  if (denied.has(lc(key))) return { granted: false, kind: 'deny', via: null, own: false, key };

  const keys = coveringKeys(app, document, action);
  let hit = null;
  for (const k of keys) {
    const l = lc(k);
    if (direct.has(l)) { hit = { kind: l === lc(key) ? 'direct' : 'wildcard', via: k, l }; break; }
    if (inherited[l]) { hit = { kind: 'role', via: inherited[l], l }; break; }
  }
  if (!hit) return { granted: false, kind: 'none', via: null, own: false, key };

  // scope: own only if EVERY provider of this cell is own (widest wins)
  const providers = keys.map(lc).filter(l => direct.has(l) || inherited[l]);
  const own = providers.length > 0 && providers.every(l => scopes[l] === 'own');
  return { granted: true, kind: hit.kind, via: hit.via, own, key, coveringKey: hit.l };
}

/** permissions map {app: {doc: {action: bool}}} built from a resolved payload. */
export function buildPermissionsFromResolved(catalog, resolved) {
  const result = {};
  for (const [app, docs] of Object.entries(catalog ?? {})) {
    result[app] = {};
    for (const [doc, actions] of Object.entries(docs)) {
      result[app][doc] = {};
      for (const action of actions) {
        result[app][doc][action] = resolveCell(resolved, app, doc, action).granted;
      }
    }
  }
  return result;
}

// Legacy: flat set of keys → permissions map (still used by callers that only have `assigned`).
export function buildPermissions(catalog, assignedSet) {
  return buildPermissionsFromResolved(catalog, { direct: [...assignedSet], inherited: {}, denied: [], scopes: {} });
}

export function expandWildcard(permissions, app, document, action) {
  const acts = permissions[app]?.[document] ?? {};
  const expanded = {};
  for (const a of Object.keys(acts)) expanded[a] = a !== action;
  return { ...permissions, [app]: { ...permissions[app], [document]: expanded } };
}

export function countAppAssigned(docs) {
  return Object.values(docs).flatMap(a => Object.values(a)).filter(Boolean).length;
}

export function countAppTotal(docs) {
  return Object.values(docs).flatMap(a => Object.keys(a)).length;
}

export function countTotalAssigned(permissions) {
  return Object.values(permissions)
    .flatMap(docs => Object.values(docs).flatMap(a => Object.values(a)))
    .filter(Boolean).length;
}

export function updateCell(permissions, app, document, action, assign) {
  return { ...permissions, [app]: { ...permissions[app], [document]: { ...permissions[app][document], [action]: assign } } };
}

export function updateColumn(permissions, app, action, assign) {
  const updated = {};
  for (const [doc, acts] of Object.entries(permissions[app] ?? {}))
    updated[doc] = action in acts ? { ...acts, [action]: assign } : { ...acts };
  return { ...permissions, [app]: updated };
}

export function updateAllDoc(permissions, app, document, assign) {
  const acts = permissions[app]?.[document] ?? {};
  const updated = {};
  for (const a of Object.keys(acts)) updated[a] = assign;
  return { ...permissions, [app]: { ...permissions[app], [document]: updated } };
}
