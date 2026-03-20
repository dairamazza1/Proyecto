import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "./AuthStoreWithPermissions.jsx";
import {
  computeEffectivePermission,
  fetchPermissions,
} from "../supabase/crudPermisos.jsx";
import { PermissionsContext } from "./permissionsContext.jsx";

const emptyPermission = {
  can_view: false,
  can_create: false,
  can_update: false,
  can_delete: false,
  can_validate: false,
  source: "none",
  inherited: false,
  row: null,
};

const normalizeAction = (action) => {
  if (!action) return "view";
  const normalized = String(action).toLowerCase();
  if (normalized === "read") return "view";
  return normalized;
};

const buildPermissionsMap = (rows, roleId, puestoId) => {
  const map = new Map();
  const featureIds = [
    ...new Set(
      (rows ?? [])
        .map((row) => Number(row?.feature_id))
        .filter((value) => Number.isFinite(value))
    ),
  ];

  featureIds.forEach((featureId) => {
    const featureRow = (rows ?? []).find(
      (row) => Number(row?.feature_id) === featureId
    );
    const featureName = featureRow?.feature?.name;
    if (!featureName) return;

    const effective = computeEffectivePermission(roleId, featureId, puestoId, rows);
    map.set(featureName, {
      feature_id: featureId,
      ...effective,
    });
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

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["permissions", roleId, puestoId],
    enabled: Boolean(roleId),
    queryFn: async () =>
      fetchPermissions({
        roleId,
        puestoId,
        includeGeneralFallback: puestoId !== null,
      }),
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const permissionsMap = useMemo(
    () => buildPermissionsMap(data, roleId, puestoId),
    [data, roleId, puestoId]
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
    refreshPermissions: refetch,
    rawPermissionsRows: data ?? [],
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}
