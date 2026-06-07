"use client";

import { Fragment } from "react";
import type { Column } from "@/lib/types";
import { clsx } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: (T & { _key?: string | number })[];
  empty?: string;
  zebra?: boolean;
  density?: "comfortable" | "compact";
}

export function DataTable<T>({
  columns,
  rows,
  empty = "No records yet",
  zebra = true,
  density = "comfortable"
}: DataTableProps<T>) {
  if (!rows.length) {
    return <EmptyState text={empty} />;
  }

  const cellPad = density === "compact" ? "px-3 py-2" : "px-4 py-3.5";

  return (
    <Fragment>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-card">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[1] bg-slate-50/95 backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    "border-b border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap",
                    column.align === "right" ? "text-right" : "text-left"
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row._key ?? index}
                className={clsx(
                  "border-b border-slate-100 last:border-b-0 transition hover:bg-brand-50/50",
                  zebra && index % 2 === 1 ? "bg-slate-50/40" : ""
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      cellPad,
                      "align-middle",
                      column.align === "right" ? "text-right" : "text-left"
                    )}
                  >
                    {column.render ? column.render(row) : ((row as Record<string, unknown>)[column.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="md:hidden grid gap-3">
        {rows.map((row, index) => (
          <div key={row._key ?? index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            {columns.map((column) => {
              const value = column.render ? column.render(row) : ((row as Record<string, unknown>)[column.key] as React.ReactNode);
              if (!column.label) {
                return (
                  <div key={column.key} className="mt-3">
                    {value}
                  </div>
                );
              }
              return (
                <div key={column.key} className="flex items-center justify-between gap-3 border-b border-dashed border-slate-200 py-2 last:border-b-0">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{column.label}</span>
                  <span className="text-right text-sm text-slate-900">{value}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Fragment>
  );
}
