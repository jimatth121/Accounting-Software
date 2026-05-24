"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { clsx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "small" | "smallDanger" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

const STYLES: Record<Variant, string> = {
  primary:
    "inline-flex items-center justify-center gap-2 min-h-[42px] rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(99,102,241,0.45)] transition disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0",
  secondary:
    "inline-flex items-center justify-center gap-2 min-h-[42px] rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600 transition",
  ghost:
    "inline-flex items-center justify-center gap-2 min-h-[42px] rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20 transition",
  small:
    "inline-flex items-center justify-center min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600 transition disabled:cursor-not-allowed disabled:opacity-50",
  smallDanger:
    "inline-flex items-center justify-center min-h-[34px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-rose-50 hover:border-rose-500 hover:text-rose-700 transition",
  icon:
    "flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-lg text-slate-500 transition hover:bg-brand-50 hover:border-brand-500 hover:text-brand-600"
};

export function Button({ variant = "primary", className, children, ...rest }: ButtonProps) {
  return (
    <button className={clsx(STYLES[variant], className)} {...rest}>
      {children}
    </button>
  );
}
