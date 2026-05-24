'use strict';

import loopar from "loopar";
import { useState, useEffect, useRef } from "react";
import { useCookies } from "@services/cookie";
import { usePersist } from "@services/persist-state";
import { buildPermissions } from "../helper";
import { PermissionTable } from "./permission-table.jsx";
import { RoleTabs } from "./role-tabs.jsx";
import Select from "@select";
import { FormWrapper } from "@context/form-provider";

export function RolePermissionManager({ manager = "general", role: initialRole, user: initialUser }) {
  const [catalog, setCatalog] = useCookies("umCatalog", null);
  const [commonActions, setCommonActions] = useState([]);
  const [user, setUser] = usePersist(`${manager}${initialUser || ""}user`, initialUser);
  const [role, setRole] = usePersist(`${manager}role`, initialRole);
  const [userRoles, setUserRoles] = useState(new Set());
  const [permissionsRefreshKey, setPermissionsRefreshKey] = useState(0);
  const formRef = useRef(null);

  useEffect(() => { setUser(initialUser); }, [initialUser]);
  useEffect(() => { setRole(initialRole); }, [initialRole]);

  useEffect(() => {
    loopar.api.get("Role Permission Manager", "getAllPerms", {
      success: (data) => {
        setCommonActions(data.commonActions);
        setCatalog(data.grouped);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) { setUserRoles(new Set()); return; }
    loopar.api.get("Role Permission Manager", "getUserRoles", {
      query: { user },
      success: (data) => setUserRoles(new Set(data.map(r => r.role)))
    });
  }, [user]);

  useEffect(() => {
    setPermissionsRefreshKey(0);
  }, [user]);

  const toggleUserRole = (roleName, assign) => {
    setUserRoles(prev => {
      const next = new Set(prev);
      assign ? next.add(roleName) : next.delete(roleName);
      return next;
    });
    loopar.api.post("Role Permission Manager", "toggleUserRole", {
      body: { user, role: roleName, assign },
      success: () => setPermissionsRefreshKey(v => v + 1),
      error: () => setUserRoles(prev => {
        const next = new Set(prev);
        assign ? next.delete(roleName) : next.add(roleName);
        return next;
      })
    });
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card overflow-hidden">
      {manager === "general" && (
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-0">
          <label>User</label>
          <FormWrapper
            __DATA__={{ name: user }}
            className="w-full"
            formRef={formRef}
            onChange={(d) => {
              if (d.name != user) {
                setUser(d.name);
                setRole(null);
              }
            }}
          >
            <Select
              data={{ name: "name", options: "User" }}
              dontHaveLabel={true}
              simpleInput={true}
            />
          </FormWrapper>
        </div>
      )}

{!!user && (
            <p className="text-md text-muted-foreground p-2">
              Override permissions directly for <strong>{user}</strong> User, independent of any assigned role.
              Direct permissions take precedence and apply regardless of role configuration.
            </p>
          )}

      {["general", "user"].includes(manager) && (
        <RoleTabs
          role={role}
          permissions={buildPermissions(catalog ?? {}, new Set())}
          onSelect={setRole}
          user={user}
          userRoles={userRoles}
          onToggleUserRole={toggleUserRole}
        />
      )}

      {(!role && !user) ? (
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground py-24">
          <span className="text-5xl select-none">🔐</span>
          <p className="text-sm">Select a Role to manage permissions</p>
        </div>
      ) : (
        <>
          <PermissionTable
            role={role}
            user={user}
            catalog={catalog}
            commonActions={commonActions}
            manager={manager}
            refreshKey={permissionsRefreshKey}
          />
        </>
      )}
    </div>
  );
}