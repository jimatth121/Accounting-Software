import type { ReactNode } from "react";
import { clsx } from "@/lib/utils";

type Accent = "indigo" | "cyan" | "emerald" | "amber" | "rose" | "violet";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon?: ReactNode;
  accent?: Accent;
}

const ACCENT_BAR: Record<Accent, string> = {
  indigo: "bg-gradient-to-r from-brand-500 to-brand-400",
  cyan: "bg-gradient-to-r from-cyan-500 to-cyan-300",
  emerald: "bg-gradient-to-r from-emerald-500 to-emerald-400",
  amber: "bg-gradient-to-r from-amber-500 to-amber-400",
  rose: "bg-gradient-to-r from-rose-500 to-rose-400",
  violet: "bg-gradient-to-r from-violet-500 to-violet-400"
};

const ACCENT_ICON: Record<Accent, string> = {
  indigo: "bg-brand-50 text-brand-600",
  cyan: "bg-cyan-50 text-cyan-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  violet: "bg-violet-50 text-violet-700"
};

const TREND_COLOR = {
  up: "text-emerald-600",
  down: "text-rose-600",
  neutral: "text-slate-500"
};

export function MetricCard({ label, value, delta, trend = "neutral", icon, accent = "indigo" }: MetricCardProps) {
  return (
    <article className="relative grid gap-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:shadow-hover">
      <div className={clsx("absolute inset-x-0 top-0 h-[3px]", ACCENT_BAR[accent])} />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {icon ? (
          <span className={clsx("flex h-9 w-9 items-center justify-center rounded-lg text-base font-bold", ACCENT_ICON[accent])}>
            {icon}
          </span>
        ) : null}
      </div>
      <strong className="text-[26px] font-bold tracking-tight text-slate-900">{value}</strong>
      {delta ? <span className={clsx("text-xs font-semibold", TREND_COLOR[trend])}>{delta}</span> : null}
    </article>
  );
}
