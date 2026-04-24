import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_PREFIX = "clinical:selectedSucursal";
const DEFAULT_TTL_MS = 8 * 60 * 60 * 1000;

const hasSessionStorage = () =>
  typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const buildStorageKey = ({ userId, empresaId }) => {
  if (!userId || !empresaId) return "";
  return `${STORAGE_PREFIX}:${userId}:${empresaId}`;
};

const readStoredSucursalId = ({ storageKey, ttlMs }) => {
  if (!storageKey || !hasSessionStorage()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(storageKey);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue);
    const storedAt = Number(parsed?.storedAt);
    const sucursalId = Number(parsed?.sucursalId);

    if (!storedAt || Date.now() - storedAt > ttlMs) {
      window.sessionStorage.removeItem(storageKey);
      return null;
    }

    return Number.isFinite(sucursalId) ? sucursalId : null;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
};

const writeStoredSucursalId = ({ storageKey, sucursalId }) => {
  if (!storageKey || !hasSessionStorage()) return;

  if (sucursalId === null || sucursalId === undefined || sucursalId === "") {
    window.sessionStorage.removeItem(storageKey);
    return;
  }

  window.sessionStorage.setItem(
    storageKey,
    JSON.stringify({
      sucursalId: Number(sucursalId),
      storedAt: Date.now(),
    }),
  );
};

export const clearPersistedSucursalSelections = (userId = null) => {
  if (!hasSessionStorage()) return;

  const prefix = userId ? `${STORAGE_PREFIX}:${userId}:` : `${STORAGE_PREFIX}:`;
  const keysToRemove = [];

  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
};

export function usePersistedSucursalSelection({
  userId,
  empresaId,
  sucursales = [],
  enabled = true,
  ttlMs = DEFAULT_TTL_MS,
  fallbackSucursalId = null,
} = {}) {
  const storageKey = useMemo(
    () => buildStorageKey({ userId, empresaId }),
    [empresaId, userId],
  );
  const [selectedOverride, setSelectedOverride] = useState(null);

  const storedSucursalId = useMemo(() => {
    if (!enabled || !storageKey) return null;
    return readStoredSucursalId({ storageKey, ttlMs });
  }, [enabled, storageKey, ttlMs]);

  const selectedCandidate =
    selectedOverride?.storageKey === storageKey
      ? selectedOverride.sucursalId
      : storedSucursalId ?? (fallbackSucursalId ? Number(fallbackSucursalId) : null);

  const isValidSelection =
    selectedCandidate == null ||
    !sucursales?.length ||
    sucursales.some((sucursal) => Number(sucursal?.id) === Number(selectedCandidate));
  const selectedSucursalId = isValidSelection ? selectedCandidate : null;

  useEffect(() => {
    if (enabled && storageKey && selectedCandidate != null && !isValidSelection) {
      writeStoredSucursalId({ storageKey, sucursalId: null });
    }
  }, [enabled, isValidSelection, selectedCandidate, storageKey]);

  const setSelectedSucursalId = useCallback(
    (nextValue) => {
      const normalized =
        nextValue === null || nextValue === undefined || nextValue === ""
          ? null
          : Number(nextValue);

      setSelectedOverride({ storageKey, sucursalId: normalized });

      if (enabled && storageKey) {
        writeStoredSucursalId({ storageKey, sucursalId: normalized });
      }
    },
    [enabled, storageKey],
  );

  return [selectedSucursalId, setSelectedSucursalId];
}
