import { useCallback, useEffect, useState } from "react";

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const normalizeDefaults = (defaults) => {
  const normalized = {};

  Object.entries(defaults ?? {}).forEach(([key, value]) => {
    normalized[key] = value === true;
  });

  return normalized;
};

const sanitizeDisclosureState = (value, defaults) => {
  const nextState = { ...defaults };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return nextState;
  }

  Object.keys(defaults).forEach((key) => {
    if (typeof value[key] === "boolean") {
      nextState[key] = value[key];
    }
  });

  return nextState;
};

const readPersistedDisclosureState = (storageKey, defaults) => {
  if (!storageKey || !canUseLocalStorage()) {
    return { ...defaults };
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);
    if (!storedValue) {
      return { ...defaults };
    }

    const parsedValue = JSON.parse(storedValue);
    return sanitizeDisclosureState(parsedValue, defaults);
  } catch {
    return { ...defaults };
  }
};

export function usePersistedDisclosureState({ storageKey, defaults }) {
  const normalizedDefaults = normalizeDefaults(defaults);
  const defaultsSignature = JSON.stringify(normalizedDefaults);
  const [cache, setCache] = useState(() => ({
    storageKey,
    defaultsSignature,
    state: readPersistedDisclosureState(storageKey, normalizedDefaults),
  }));

  const resolvedState =
    cache.storageKey === storageKey &&
    cache.defaultsSignature === defaultsSignature
      ? cache.state
      : readPersistedDisclosureState(storageKey, normalizedDefaults);

  useEffect(() => {
    if (!storageKey || !canUseLocalStorage()) {
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(resolvedState));
    } catch {
      // Ignora errores de persistencia local y mantiene el estado en memoria.
    }
  }, [resolvedState, storageKey]);

  const setCachedState = useCallback(
    (nextState) => {
      setCache({
        storageKey,
        defaultsSignature,
        state: sanitizeDisclosureState(nextState, normalizedDefaults),
      });
    },
    [defaultsSignature, normalizedDefaults, storageKey],
  );

  const toggle = useCallback(
    (sectionKey) => {
      if (!Object.prototype.hasOwnProperty.call(normalizedDefaults, sectionKey)) {
        return;
      }

      setCachedState({
        ...resolvedState,
        [sectionKey]: !resolvedState[sectionKey],
      });
    },
    [normalizedDefaults, resolvedState, setCachedState],
  );

  const setSection = useCallback(
    (sectionKey, value) => {
      if (!Object.prototype.hasOwnProperty.call(normalizedDefaults, sectionKey)) {
        return;
      }
      if (typeof value !== "boolean") {
        return;
      }

      setCachedState({
        ...resolvedState,
        [sectionKey]: value,
      });
    },
    [normalizedDefaults, resolvedState, setCachedState],
  );

  const resetToDefaults = useCallback(() => {
    setCachedState(normalizedDefaults);
  }, [normalizedDefaults, setCachedState]);

  return {
    state: resolvedState,
    toggle,
    setSection,
    resetToDefaults,
  };
}
