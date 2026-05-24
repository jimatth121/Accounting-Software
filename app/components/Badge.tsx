import type { ReactNode } from "react";
import { clsx } from "@/lib/utils";

type Tone = "brand" | "high" | "medium" | "low" | "neutral";

interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
}

const TONES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  high: "bg-rose-100 text-rose-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-emerald-100 text-emerald-800",
  neutral: "bg-slate-100 text-slate-600"
};

export function Badge({ children, tone = "brand" }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        TONES[tone]
      )}
    >
      {children}
    </span>
  );
}
