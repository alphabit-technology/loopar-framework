'use strict';

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import loopar from "loopar";
import { cap, getOwnActions, makeGridCols, buildPermissions, expandWildcard, updateCell, updateColumn, updateAllDoc } from "../helper";
import { Checkbox } from "./Checkbox.jsx";
import { OwnChip } from "./own-chip.jsx";
import { AppTabs } from "./app-tabs.jsx";
import { useCookies } from "@services/cookie";

export function PermissionTable({
  role,
  user,
  catalog,
  commonActions,
  manager = "general",
  refreshKey = 0,
  saving: externalSaving,
  onToggle,
  onToggleAll,
  onToggleCol,
  isPending,
}) {
  const [permissions, setPermissions] = useState({});
  const [inheritedPerms, setInheritedPerms] = useState(new Set());
  const [deniedPerms, setDeniedPerms] = useState(new Set());
  const [currentApp, setCurrentApp] = useCookies(`${manager}currentApp`, null);
  const [search, setSearch] = useCookies(`${manager}search`, "");
  const [saving, setSaving] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  const [isRolePending, startRoleTransition] = useTransition();
  const [, startUITransition] = useTransition();
  const [, startExpandTransition] = useTransition();

  const effectiveSaving = externalSaving ?? saving;
  const effectivePending = isPending || isRolePending;
  const refreshResolved = useCallback(async () => {
    if (!catalog) return;
    if (!role && !user) {
      startRoleTransition(() => {
        setPermissions(buildPermissions(catalog, new Set()));
        setInheritedPerms(new Set());
        setDeniedPerms(new Set());
      });
      return;
    }

    const resolved = await loopar.api.get(
      "Role Permission Manager",
      "getResolvedPermissions",
      { query: { role, user } }
    );

    const assigned = new Set(resolved?.assigned ?? []);
    const inherited = new Set(resolved?.inherited ?? []);
    const denied = new Set(resolved?.denied ?? []);

    startRoleTransition(() => {
      setInheritedPerms(inherited);
      setDeniedPerms(denied);
      setPermissions(buildPermissions(catalog, assigned));
    });
  }, [catalog, role, user]);

  useEffect(() => {
    if (!catalog) return;

    setLoading(true);

    const loadPermissions = async () => {
      try {
        await refreshResolved();
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [catalog, role, user, refreshResolved]);

  useEffect(() => {
    if (!refreshKey) return;
    refreshResolved();
  }, [refreshKey, refreshResolved]);

  const handleToggle = useCallback((document, action, assign) => {
    const key = `${document}:${action}`;
    setSaving(key);

    if (!assign) {
      const acts = permissions[currentApp]?.[document] ?? {};
      setPermissions(prev => Object.values(acts).every(Boolean)
        ? expandWildcard(prev, currentApp, document, action)
        : updateCell(prev, currentApp, document, action, false));

      if (inheritedPerms.has(key)) {
        setDeniedPerms(prev => new Set([...prev, key]));
        setInheritedPerms(prev => { const n = new Set(prev); n.delete(key); return n; });
      }
    } else {
      setPermissions(prev => updateCell(prev, currentApp, document, action, true));
      if (deniedPerms.has(key)) {
        setDeniedPerms(prev => { const n = new Set(prev); n.delete(key); return n; });
      }
    }

    if (onToggle) {
      onToggle(document, action, assign, {
        success: async () => {
          setSaving(null);
          await refreshResolved();
        },
        error: () => {
          setPermissions(prev => updateCell(prev, currentApp, document, action, !assign));
          setSaving(null);
          refreshResolved();
        }
      });
    } else {
      loopar.api.post("Role Permission Manager", "toggle", {
        body: { mode: user ? "User" : "Role", entity: user || role, document, action, assign },
        success: async () => {
          setSaving(null);
          await refreshResolved();
        },
        error: () => {
          setPermissions(prev => updateCell(prev, currentApp, document, action, !assign));
          setSaving(null);
          refreshResolved();
        }
      });
    }
  }, [permissions, currentApp, inheritedPerms, deniedPerms, onToggle, user, role, refreshResolved]);

  const handleToggleAll = useCallback((document, assign) => {
    setPermissions(prev => updateAllDoc(prev, currentApp, document, assign));
    if (onToggleAll) {
      onToggleAll(document, assign);
    } else {
      loopar.api.post("Role Permission Manager", "toggleAll", {
        body: { mode: user ? "User" : "Role", entity: user || role, document, assign },
        success: () => refreshResolved(),
        error: () => refreshResolved()
      });
    }
  }, [currentApp, onToggleAll, user, role, refreshResolved]);

  const handleToggleCol = useCallback((action) => {
    const docs = permissions[currentApp] ?? {};
    let total = 0, assigned = 0;
    for (const acts of Object.values(docs))
      if (action in acts) { total++; if (acts[action]) assigned++; }
    const assign = assigned < total;
    setPermissions(prev => updateColumn(prev, currentApp, action, assign));
    if (onToggleCol) {
      onToggleCol(action, assign);
    } else {
      loopar.api.post("Role Permission Manager", "toggleCol", {
        body: { mode: user ? "User" : "Role", entity: user || role, app: currentApp, action, assign },
        success: () => refreshResolved(),
        error: () => refreshResolved()
      });
    }
  }, [permissions, currentApp, onToggleCol, user, role, refreshResolved]);

  const currentDocs = permissions[currentApp] ?? {};

  const hasAnyOwn = useMemo(() =>
    Object.values(currentDocs).some(acts => getOwnActions(acts, commonActions).length > 0),
    [currentDocs, commonActions]
  );

  const gridCols = makeGridCols(commonActions, hasAnyOwn);

  function colState(action) {
    let total = 0, assigned = 0;
    for (const acts of Object.values(currentDocs))
      if (action in acts) { total++; if (acts[action]) assigned++; }
    if (!total) return 'none';
    if (assigned === total) return 'all';
    return assigned > 0 ? 'partial' : 'off';
  }

  function docState(acts) {
    const vals = Object.values(acts);
    if (!vals.length) return 'none';
    if (vals.every(Boolean)) return 'all';
    return vals.some(Boolean) ? 'partial' : 'off';
  }

  const filtered = useMemo(() =>
    Object.entries(currentDocs).filter(([doc]) =>
      doc.toLowerCase().includes((search || "").toLowerCase())
    ),
    [currentDocs, search]
  );

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
      <div className="w-4 h-4 border border-border border-t-primary rounded-full animate-spin mr-2" />
      Loading permissions...
    </div>
  );

  return (
    <div className="flex flex-col overflow-hidden">
      <AppTabs
        permissions={permissions}
        currentApp={currentApp}
        onSelect={app => startUITransition(() => { setCurrentApp(app); setSearch(""); })}
        search={search}
        onSearch={setSearch}
      />

      <div
      className={`overflow-auto transition-opacity duration-200 shrink-0
        sticky top-[var(--header-height,80px)]
        h-fit max-h-[calc(100dvh-var(--header-height,80px)-var(--footer-height,0px))]`}
        style={{
          opacity: effectivePending ? 0.4 : 1,
          pointerEvents: effectivePending ? 'none' : 'auto',
          scrollbarWidth: 'thin',
        }}
      >
        <div 
          className="sticky top-0 z-10 border-b border-border bg-secondary text-xs"
        >
          <div 
            className="grid bg-secondary" style={{ gridTemplateColumns: gridCols, minWidth: 'max-content' }}
          >
            <div className="sticky left-0 z-20 bg-secondary px-4 py-2 border-r border-border flex items-center">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Document</span>
            </div>

            {commonActions.map(a => {
              const state = colState(a);
              const color = state === 'all' ? 'text-primary' : state === 'partial' ? 'text-warning' : 'text-muted-foreground';
              return (
                <div key={a} className="px-1 py-2 flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-semibold uppercase tracking-wider ${color}`}>{a}</span>
                  <Checkbox
                    checked={state === 'all'}
                    partial={state === 'partial'}
                    onClick={() => handleToggleCol(a)}
                  />
                </div>
              );
            })}

            {hasAnyOwn && (
              <div className="px-3 py-2 flex items-center">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Own</span>
              </div>
            )}
          </div>
        </div>

        {/* Rows */}
        {filtered.length === 0 && (search || "").length > 0 ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            No documents match <strong className="ml-1">"{search}"</strong>
          </div>
        ) : (
          filtered.map(([doc, acts]) => {
            const extras = getOwnActions(acts, commonActions);
            const isExpanded = expanded[doc];
            const extraAssigned = extras.filter(a => acts[a]).length;
            const state = docState(acts);
            const allChecked = state === 'all';

            return (
              <div key={doc}>
                <div
                  className="grid group border-b border-border/50 hover:bg-primary/[.02] transition-colors text-xs"
                  style={{ gridTemplateColumns: gridCols, minWidth: 'max-content' }}
                >
                  <div className="sticky left-0 z-[5] bg-card group-hover:bg-primary/[.02] transition-colors px-3 py-1.5 border-r border-border flex items-center gap-1.5 font-medium text-foreground whitespace-nowrap">
                    {extras.length > 0 ? (
                      <button
                        onClick={() => startExpandTransition(() => setExpanded(p => ({ ...p, [doc]: !p[doc] })))}
                        className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        <svg width="7" height="7" viewBox="0 0 8 8" fill="none"
                          className={`transition-transform duration-150 ${isExpanded ? "rotate-90" : ""}`}>
                          <path d="M2 1.5L5.5 4L2 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : <span className="w-4 flex-shrink-0" />}

                    <span className="truncate text-[12px]">{cap(doc)}</span>

                    <button
                      onClick={() => handleToggleAll(doc, !allChecked)}
                      className={`ml-auto flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border transition-all
                        ${allChecked
                          ? "bg-primary/10 text-primary border-primary/25 hover:bg-primary/20"
                          : state === 'partial'
                            ? "bg-warning/10 text-warning border-warning/25 hover:bg-warning/20"
                            : "bg-transparent text-muted-foreground border-border hover:border-input"
                        }`}>
                      {allChecked ? "✓ All" : state === 'partial' ? "— Partial" : "+ All"}
                    </button>
                  </div>

                  {commonActions.map(action => {
                    const key = `${doc}:${action}`;
                    const has = action in acts;
                    const checked = has && acts[action];
                    const isInherited = inheritedPerms.has(key);
                    const isDenied = deniedPerms.has(key);
                    const isSav = effectiveSaving === key;

                    return (
                      <div key={action} className="flex items-center justify-center py-0.5">
                        {isSav
                          ? <div className="inline-flex items-center justify-center w-8 h-8">
                              <div className="w-3 h-3 border border-border border-t-primary rounded-full animate-spin" />
                            </div>
                          : <Checkbox
                              checked={checked && !isInherited}
                              inherited={isInherited && !isDenied}
                              denied={isDenied}
                              na={!has && !isInherited && !isDenied}
                              onClick={() => (has || isInherited || isDenied) && handleToggle(doc, action, isDenied ? true : !checked)}
                            />
                        }
                      </div>
                    );
                  })}

                  {hasAnyOwn && (
                    <div className="px-3 py-1 flex items-center">
                      {extras.length > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border
                          ${extraAssigned > 0 ? "bg-primary/10 text-primary border-primary/25" : "bg-transparent text-muted-foreground border-border"}`}>
                          {extraAssigned}/{extras.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isExpanded && extras.length > 0 && (
                  <div className="border-b border-border/50 bg-muted/20 flex text-xs" style={{ minWidth: 'max-content' }}>
                    <div className="sticky left-0 z-[5] bg-muted/20 px-6 py-2 border-r border-border flex items-center flex-shrink-0" style={{ width: 220 }}>
                      <span className="text-[9px] text-muted-foreground italic uppercase tracking-wider">Own</span>
                    </div>
                    <div className="px-3 py-2 flex flex-wrap gap-1.5">
                      {extras.map(action => (
                        <OwnChip key={action} action={action}
                          checked={acts[action]} saving={effectiveSaving === `${doc}:${action}`}
                          onClick={() => handleToggle(doc, action, !acts[action])} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}