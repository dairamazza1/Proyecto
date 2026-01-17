import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getEmpleadosByUserIds,
  getPerfilesByIds,
} from "../supabase/crudPerfil";

const normalizePerfilIds = (ids = []) => {
  const unique = new Map();
  (ids ?? []).forEach((id) => {
    if (id === null || id === undefined) return;
    const raw = String(id).trim();
    if (!raw || !/^\d+$/.test(raw)) return;
    unique.set(raw, raw);
  });
  return Array.from(unique.values());
};

const buildDisplayMap = ({ ids = [], empleados = [], perfiles = [] }) => {
  const resolved = new Map();

  (empleados ?? []).forEach((empleado) => {
    const perfilId = empleado?.user_id;
    if (perfilId === null || perfilId === undefined) return;
    const firstName = empleado?.first_name ?? "";
    const lastName = empleado?.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    if (!fullName) return;
    resolved.set(String(perfilId), fullName);
  });

  (perfiles ?? []).forEach((perfil) => {
    const perfilId = perfil?.id;
    if (perfilId === null || perfilId === undefined) return;
    const email = perfil?.email ?? "";
    if (!email) return;
    const key = String(perfilId);
    if (!resolved.has(key)) {
      resolved.set(key, email);
    }
  });

  ids.forEach((id) => {
    const key = String(id);
    if (!resolved.has(key)) {
      resolved.set(key, `ID ${key}`);
    }
  });

  return Object.fromEntries(resolved.entries());
};

export function usePerfilDisplayNames(perfilIds = [], enabled = true) {
  const normalizedIds = useMemo(
    () => normalizePerfilIds(perfilIds),
    [perfilIds]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["perfilDisplayNames", normalizedIds],
    queryFn: async () => {
      if (!normalizedIds.length) return {};

      let empleados = [];
      try {
        empleados = await getEmpleadosByUserIds(normalizedIds);
      } catch {
        empleados = [];
      }

      const resolvedFromEmpleados = new Set(
        empleados
          .map((item) => item?.user_id)
          .filter((id) => id !== null && id !== undefined)
          .map((id) => String(id))
      );

      const unresolvedIds = normalizedIds.filter(
        (id) => !resolvedFromEmpleados.has(String(id))
      );

      let perfiles = [];
      if (unresolvedIds.length) {
        try {
          perfiles = await getPerfilesByIds(unresolvedIds);
        } catch {
          perfiles = [];
        }
      }

      return buildDisplayMap({
        ids: normalizedIds,
        empleados,
        perfiles,
      });
    },
    enabled: enabled && normalizedIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const displayMap = useMemo(
    () => new Map(Object.entries(data ?? {})),
    [data]
  );

  const getDisplayName = useCallback(
    (perfilId) => {
      if (perfilId === null || perfilId === undefined || perfilId === "") {
        return "-";
      }
      const key = String(perfilId);
      return displayMap.get(key) || `ID ${key}`;
    },
    [displayMap]
  );

  return { displayMap, getDisplayName, isLoading };
}
