import type { ReactNode } from "react";
import { clsx } from "@/lib/utils";

interface NoticeProps {
  children: ReactNode;
  tone?: "warn" | "info";
}

const TONES = {
  warn: "bg-gradient-to-r from-amber-100 to-amber-200 border-amber-300 text-amber-800",
  info: "bg-gradient-to-r from-brand-100 to-brand-200 border-brand-300 text-brand-800"
};

export function Notice({ children, tone = "warn" }: NoticeProps) {
  return (
    <div className={clsx("rounded-2xl border px-5 py-3.5 text-sm font-medium shadow-card", TONES[tone])}>
      {children}
    </div>
  );
}
