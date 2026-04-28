'use strict';

import { createContext, useContext, useCallback, useRef } from "react";
import loopar, { useRealtime } from "loopar";

let _permSet = null;
let _publicSet = new Set();
let _deniedSet = new Set();

function initSets({ private: priv, public: pub, denied = [] } = {}) {
  _permSet = priv === null ? null : new Set(priv ?? []);
  _publicSet = new Set(pub ?? []);
  _deniedSet = new Set(denied);
}

function checkPermission(document, action) {
  const key = `${document}:${action}`.toLowerCase().replaceAll(" ", "");

  //console.log(["Check Permission",key, _publicSet])
  if (_publicSet.has(key)) return true;
  if (_permSet === null) return true;

  if (_deniedSet.has(key)) return false;

  return (
    _permSet.has('*:*') ||
    _permSet.has(`${document}:*`) ||
    _permSet.has(`*:${action}`) ||
    _permSet.has(key)
  );
}

const AuthContext = createContext(null);

export function AuthProvider({ permissions: initialPermissions, userId, children }) {
  const initialized = useRef(false);
  if (!initialized.current) {
    initSets(initialPermissions);
    initialized.current = true;
  }

  const refreshPermissions = useCallback(async () => {
    try {
      const data = await loopar.method(
        "Role Permission Manager",
        "getOwnPermissions",
        { user: userId }
      );
      initSets(data);
    } catch (err) {

      console.error("[AuthProvider] Failed to refresh permissions:", err);
    }
  }, [userId]);

  useRealtime(`permissionsChanged`, () => {
    refreshPermissions();
  });

  const award = useCallback((document, action) => {
    return checkPermission(document, action);
  }, []);

  return (
    <AuthContext.Provider value={{ award, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export { checkPermission as award };