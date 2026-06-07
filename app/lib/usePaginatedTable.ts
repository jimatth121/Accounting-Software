"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import type { Paginated } from "./types";

const PAGE_SIZE = 10;

const EMPTY = <T,>(): Paginated<T> => ({
  data: [],
  page: 1,
  pageSize: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasMore: false
});

/**
 * Coerces a list response into the paginated shape. Newer endpoints already
 * return `{ data, page, total, ... }`; older/legacy ones (and some deploys)
 * return a bare array — in that case we paginate it client-side so the table
 * still works instead of crashing on `rows.map`.
 */
function normalize<T>(res: unknown, requestedPage: number): Paginated<T> {
  if (Array.isArray(res)) {
    const total = res.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(totalPages, Math.max(1, requestedPage));
    const start = (page - 1) * PAGE_SIZE;
    return {
      data: res.slice(start, start + PAGE_SIZE) as T[],
      page,
      pageSize: PAGE_SIZE,
      total,
      totalPages,
      hasMore: page < totalPages
    };
  }
  if (res && typeof res === "object" && Array.isArray((res as Paginated<T>).data)) {
    return res as Paginated<T>;
  }
  return EMPTY<T>();
}

/**
 * Debounces a fast-changing value (e.g. a search box) so we don't refetch on
 * every keystroke.
 */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

/**
 * Fetches a server-paginated table endpoint (10 rows per page by default).
 *
 * Pass the route-specific filter values in `filters`; empty / "all" values are
 * dropped. Changing any filter resets back to page 1. Returns the current page
 * of rows plus the pagination metadata and a `refetch` to call after mutations.
 */
export function usePaginatedTable<T>(
  endpoint: string,
  filters: Record<string, string | number | undefined> = {}
) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<T>>(EMPTY<T>());
  const [loading, setLoading] = useState(true);

  // Stable key for the active filters (sorted, blanks removed) so the effects
  // only re-run when a meaningful value changes.
  const filtersKey = useMemo(() => {
    const entries = Object.entries(filters)
      .map(([k, v]) => [k, v == null ? "" : String(v)] as const)
      .filter(([, v]) => v !== "" && v !== "all")
      .sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify(entries);
  }, [filters]);

  // Reset to the first page whenever the filters change.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setPage(1);
  }, [filtersKey]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      (JSON.parse(filtersKey) as [string, string][]).forEach(([k, v]) => params.set(k, v));
      const res = await api<unknown>(`${endpoint}?${params.toString()}`, { silent: true });
      setResult(normalize<T>(res, page));
    } catch {
      // Network/API errors are surfaced globally by api(); keep the last page.
    } finally {
      setLoading(false);
    }
  }, [endpoint, page, filtersKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // If the requested page no longer exists (e.g. the last row on the last page
  // was deleted), pull back to the last valid page. Only act once a fetch has
  // settled — checking mid-flight would fight user navigation because
  // `result` still reflects the previous page, causing page flip-flopping.
  useEffect(() => {
    if (loading) return;
    if (result.total > 0 && page > result.totalPages) setPage(result.totalPages);
  }, [loading, result.total, result.totalPages, page]);

  return {
    rows: result.data,
    meta: result,
    // Reflect the user's requested page (which drives the fetch), not the
    // server echo, so the controls stay stable while the next page loads.
    page,
    setPage,
    loading,
    refetch
  };
}
