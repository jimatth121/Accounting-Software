"use client";

import { Button } from "./Button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({ title, subtitle, count, actionLabel, onAction }: PageHeaderProps) {
  return (
    <div className="mb-4 flex h-9 items-center justify-between gap-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <h2 className="shrink-0 text-base font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="truncate text-xs text-slate-500">
          {subtitle}
          {typeof count === "number" ? ` · ${count} ${count === 1 ? "record" : "records"}` : null}
        </p>
      </div>
      {onAction && actionLabel ? (
        <Button variant="small" onClick={onAction} type="button" className="shrink-0">
          + {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
