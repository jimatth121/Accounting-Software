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
    <div className="mb-5 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {subtitle}
          {typeof count === "number" ? ` · ${count} ${count === 1 ? "record" : "records"}` : null}
        </p>
      </div>
      {onAction && actionLabel ? (
        <Button onClick={onAction} type="button">
          + {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
