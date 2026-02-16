import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../supabase/supabase.config.jsx";
import { useAuthStore } from "./AuthStoreWithPermissions.jsx";

const PermissionsContext = createContext(null);

const emptyPermission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_validate: false,
};

const normalizeAction = (action) => {
  if (!action) return "view";
  const normalized = String(action).toLowerCase();
  if (normalized === "read") return "view";
  return normalized;
};

const buildPermissionsMap = (rows, puestoId) => {
  const map = new Map();

  (rows ?? []).forEach((row) => {
    const featureName = row?.feature?.name;
    if (!featureName) return;

    const existing = map.get(featureName);
    const isSpecific = row.puesto_id !== null && row.puesto_id !== undefined;
    const isMatchPuesto = isSpecific && row.puesto_id === puestoId;

    if (!existing) {
      map.set(featureName, row);
      return;
    }

    if (isMatchPuesto) {
      map.set(featureName, row);
    }
  });

  return map;
};

export function PermissionsProvider({ children }) {
  const profile = useAuthStore((state) => state.profile);
  const empleado = useAuthStore((state) => state.empleado);

  const roleId =
    typeof profile?.app_role_id === "number" ? profile.app_role_id : null;
  const puestoId =
    typeof empleado?.puesto_id === "number" ? empleado.puesto_id : null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["permissions", roleId, puestoId],
    enabled: Boolean(roleId),
    queryFn: async () => {
      let query = supabase
        .from("funcionalidades_roles")
        .select(
          `
          id,
          app_role_id,
          puesto_id,
          can_view,
          can_create,
          can_update,
          can_delete,
          can_validate,
          feature:funcionalidades(name)
        `
        )
        .eq("app_role_id", roleId);

      if (puestoId === null) {
        query = query.is("puesto_id", null);
      } else {
        query = query.or(`puesto_id.is.null,puesto_id.eq.${puestoId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const permissionsMap = useMemo(
    () => buildPermissionsMap(data, puestoId),
    [data, puestoId]
  );

  const can = (feature, action = "view") => {
    if (!feature) return false;
    const normalizedAction = normalizeAction(action);
    const entry = permissionsMap.get(feature);
    if (!entry) return false;
    if (normalizedAction === "view") return Boolean(entry.can_view);
    if (normalizedAction === "create") return Boolean(entry.can_create);
  if (normalizedAction === "update") return Boolean(entry.can_update);
  if (normalizedAction === "delete") return Boolean(entry.can_delete);
    if (normalizedAction === "validate") return Boolean(entry.can_validate);
    return false;
  };

  const getPermissions = (feature) => {
    if (!feature) return emptyPermission;
      return permissionsMap.get(feature) ?? emptyPermission;
  };

  const value = {
    roleId,
    puestoId,
    permissionsMap,
    isLoading,
    error,
    can,
    getPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  return useContext(PermissionsContext);
}
