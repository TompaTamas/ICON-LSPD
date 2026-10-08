import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';

/** Adat betöltése egy API-útvonalról; `path = null` esetén nem tölt. */
export function useApi(path, { refreshMs = 0 } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!!path);
  const alive = useRef(true);

  const load = useCallback(async () => {
    if (!path) return;
    try {
      const result = await api(path);
      if (alive.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (alive.current) setError(err);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    alive.current = true;
    setLoading(!!path);
    load();
    if (!refreshMs) return () => { alive.current = false; };
    const timer = setInterval(load, refreshMs);
    return () => {
      alive.current = false;
      clearInterval(timer);
    };
  }, [load, path, refreshMs]);

  return { data, error, loading, reload: load, setData };
}
