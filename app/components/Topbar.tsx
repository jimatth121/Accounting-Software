"use client";

import { UserButton } from "@clerk/nextjs";
import { Button } from "./Button";

interface TopbarProps {
  section: string;
  companyName?: string | null;
  onMenuClick: () => void;
  onSettings: () => void;
  notificationCount?: number;
}

function getInitials(name?: string | null): string {
  if (!name) return "SB";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "SB";
}

export function Topbar({ section, companyName, onMenuClick, onSettings, notificationCount = 0 }: TopbarProps) {
  const display = companyName || "SmartBooks Demo";

  return (
    <header className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-card md:px-5 md:py-3">
      {/* Left: page name */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="icon"
          type="button"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          className="md:hidden"
        >
          ☰
        </Button>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-600">Page</p>
          <h2 className="truncate text-lg font-bold tracking-tight text-slate-900 md:text-xl">
            {section}
          </h2>
        </div>
      </div>

      {/* Right: notifications, settings, company chip */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-600 transition hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600"
        >
          <span aria-hidden>⚑</span>
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : (
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          type="button"
          onClick={onSettings}
          aria-label="Settings"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-lg text-slate-600 transition hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600 hover:rotate-45"
        >
          <span aria-hidden>⚙</span>
        </button>

        <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

        <button
          type="button"
          onClick={onSettings}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-1.5 py-1 transition hover:border-brand-500 hover:bg-brand-50 sm:pl-1.5 sm:pr-3"
          aria-label={`Company: ${display}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-fuchsia-500 text-sm font-bold text-white shadow-md shadow-brand-500/30">
            {getInitials(companyName)}
          </div>
          <div className="hidden text-left sm:block">
            <strong className="block max-w-[160px] truncate text-sm font-bold text-slate-900">
              {display}
            </strong>
            <p className="text-[11px] font-medium text-slate-500">Workspace</p>
          </div>
        </button>

        <UserButton
          appearance={{ elements: { avatarBox: "h-9 w-9 rounded-xl shadow-md" } }}
        />
      </div>
    </header>
  );
}
