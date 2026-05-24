"use client";

import { NAV_ITEMS } from "@/lib/constants";
import type { NavLabel } from "@/lib/types";
import { clsx } from "@/lib/utils";

interface SidebarProps {
  active: NavLabel;
  onSelect: (label: NavLabel) => void;
  open: boolean;
  onClose: () => void;
  companyName?: string | null;
}

export function Sidebar({ active, onSelect, open, onClose, companyName }: SidebarProps) {
  return (
    <>
      <aside
        className={clsx(
          "z-[100] flex flex-col gap-7 overflow-y-auto bg-gradient-to-b from-slate-900 via-brand-950 to-brand-900 px-4 py-6 text-white",
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          "fixed top-0 left-0 h-screen w-[280px] transition-transform duration-200 shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-base font-extrabold text-white shadow-lg shadow-fuchsia-500/40">
            SB
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">SmartBooks AI</p>
            <h1 className="mt-1 text-base font-bold tracking-tight">Workspace</h1>
          </div>
        </div>

        <nav className="grid gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onSelect(item.label);
                  onClose();
                }}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm font-medium transition",
                  isActive
                    ? "border-white/15 bg-gradient-to-br from-brand-500/40 to-fuchsia-500/30 text-white shadow-lg shadow-brand-500/30"
                    : "text-brand-200 hover:bg-white/5 hover:text-white"
                )}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 items-center justify-center rounded-lg text-sm",
                    isActive
                      ? "bg-gradient-to-br from-cyan-500 to-fuchsia-500 shadow-lg shadow-cyan-500/40"
                      : "bg-white/10"
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-rose-500 font-bold text-white">
              U
            </div>
            <div className="min-w-0">
              <strong className="block text-sm text-white">Welcome back</strong>
              <p className="truncate text-xs text-brand-200/80">{companyName || "Your business"}</p>
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <div className="fixed inset-0 z-[90] bg-slate-900/50 md:hidden" onClick={onClose} aria-hidden="true" />
      ) : null}
    </>
  );
}
