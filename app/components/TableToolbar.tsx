"use client";

import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { clsx } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterDef {
  key: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
}

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: FilterDef[];
  resultCount?: number;
  totalCount?: number;
  extra?: ReactNode;
}

export function TableToolbar({
  search,
  onSearchChange,
  placeholder = "Search…",
  filters = [],
  resultCount,
  totalCount,
  extra
}: TableToolbarProps) {
  const hasActiveFilter = filters.some((f) => f.value && f.value !== "all");
  const hasSearch = search.length > 0;

  function clearAll() {
    onSearchChange("");
    filters.forEach((f) => f.onChange("all"));
  }

  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3 lg:flex-row lg:items-center lg:gap-3">
      {/* Search */}
      <label className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
        />
        {hasSearch ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </label>

      {/* Filter dropdowns */}
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            {filter.label}
          </label>
          <select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className={clsx(
              "h-10 min-w-[140px] rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.18)]",
              filter.value && filter.value !== "all"
                ? "border-brand-500 text-brand-700"
                : "border-slate-200 text-slate-700"
            )}
          >
            <option value="all">All</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      ))}

      {extra}

      {(hasActiveFilter || hasSearch) ? (
        <button
          type="button"
          onClick={clearAll}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      ) : null}

      {typeof resultCount === "number" && typeof totalCount === "number" ? (
        <span className="text-xs font-medium text-slate-500 lg:ml-auto">
          Showing <strong className="text-slate-900">{resultCount}</strong> of <strong className="text-slate-900">{totalCount}</strong>
        </span>
      ) : null}
    </div>
  );
}
