"use client";

/* Client-side mock fetch seam. Replace with server components, React Query, or
   the real API layer later. The React Compiler lint rules discourage this
   pattern; it is intentional for Phase 1. */
/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { useCallback, useEffect, useRef, useState } from "react";

export function useAsyncData<T>(loader: () => Promise<T>, key = "") {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loaderRef.current();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, loading, error, reload };
}
