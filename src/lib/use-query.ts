"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

export interface QueryState<T> {
  data: T | undefined;
  error: string | null;
  /** Primera carga: todavía no hay nada para mostrar. */
  loading: boolean;
  /** Recarga con datos viejos en pantalla (se atenúan, no se reemplazan). */
  refreshing: boolean;
  reload: () => Promise<void>;
  setData: (updater: (current: T) => T) => void;
}

/**
 * Carga de datos mínima: `key` identifica la consulta (cuando cambia, vuelve a
 * pedir) y `fetcher` hace el pedido. Las respuestas viejas que llegan tarde se
 * descartan, así un filtro lento no pisa al siguiente.
 */
export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>
): QueryState<T> {
  const [data, setDataState] = useState<T | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetcherRef = useRef(fetcher);
  const sequence = useRef(0);
  const hasData = useRef(false);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const run = useCallback(async () => {
    const current = ++sequence.current;
    if (hasData.current) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetcherRef.current();
      if (current !== sequence.current) return;
      hasData.current = true;
      setDataState(result);
      setError(null);
    } catch (caught) {
      if (current !== sequence.current) return;
      setError(errorMessage(caught));
    } finally {
      if (current === sequence.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void run();
  }, [key, run]);

  const setData = useCallback((updater: (current: T) => T) => {
    setDataState((current) =>
      current === undefined ? current : updater(current)
    );
  }, []);

  return { data, error, loading, refreshing, reload: run, setData };
}
