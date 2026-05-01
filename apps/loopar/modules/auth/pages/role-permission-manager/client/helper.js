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
  return `220px ${commonActions.map(() => '72px').join(' ')}${hasOwn ? ' 90px' : ''}`;
}

export function buildPermissions(catalog, assignedSet) {
  const hasAll = assignedSet.has('*:*');
  const result = {};
  for (const [app, docs] of Object.entries(catalog)) {
    result[app] = {};
    for (const [doc, actions] of Object.entries(docs)) {
      const docAll = assignedSet.has(`${doc}:*`);
      result[app][doc] = {};
      for (const action of actions) {
        result[app][doc][action] =
          hasAll || docAll ||
          assignedSet.has(`*:${action}`) ||
          assignedSet.has(`${doc}:${action}`);
      }
    }
  }
  return result;
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