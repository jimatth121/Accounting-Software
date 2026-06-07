"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange, loading }: PaginationProps) {
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const btn =
    "inline-flex h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-700";

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs font-medium text-slate-500">
        Showing <strong className="text-slate-900">{from}</strong>–<strong className="text-slate-900">{to}</strong> of{" "}
        <strong className="text-slate-900">{total}</strong>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={btn}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className={clsx("px-2 text-sm font-semibold text-slate-700 tabular-nums", loading && "opacity-50")}>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
