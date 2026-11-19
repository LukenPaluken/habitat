"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "./api";

export interface QueryState<T> {
  data: T | undefined;
  error: string | null;
  /** First load: there is nothing to show yet. */
  loading: boolean;
  /** Reload with stale data on screen (dimmed, not replaced). */
  refreshing: boolean;
  reload: () => Promise<void>;
  setData: (updater: (current: T) => T) => void;
}

/**
 * Minimal data loading: `key` identifies the query (when it changes, it
 * refetches) and `fetcher` performs the request. Stale responses that arrive
 * late are discarded, so a slow filter never overwrites the next one.
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
