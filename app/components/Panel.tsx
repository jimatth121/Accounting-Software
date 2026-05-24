import type { ReactNode } from "react";
import { clsx } from "@/lib/utils";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={clsx(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-card md:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}
