"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { clsx } from "@/lib/utils";
import { toast, type ToastKind, type ToastMessage } from "@/lib/toast";

const STYLES: Record<ToastKind, { ring: string; icon: string; bar: string; Icon: typeof CheckCircle2 }> = {
  success: {
    ring: "ring-emerald-200",
    icon: "bg-emerald-50 text-emerald-600",
    bar: "bg-gradient-to-b from-emerald-500 to-emerald-600",
    Icon: CheckCircle2
  },
  error: {
    ring: "ring-rose-200",
    icon: "bg-rose-50 text-rose-600",
    bar: "bg-gradient-to-b from-rose-500 to-rose-600",
    Icon: XCircle
  },
  info: {
    ring: "ring-brand-200",
    icon: "bg-brand-50 text-brand-600",
    bar: "bg-gradient-to-b from-brand-500 to-brand-600",
    Icon: Info
  },
  warning: {
    ring: "ring-amber-200",
    icon: "bg-amber-50 text-amber-700",
    bar: "bg-gradient-to-b from-amber-500 to-amber-600",
    Icon: AlertTriangle
  }
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-4 z-[300] flex flex-col items-center gap-2.5 px-4 sm:items-end sm:px-5"
    >
      {toasts.map((message) => {
        const style = STYLES[message.kind];
        const Icon = style.Icon;
        return (
          <div
            key={message.id}
            className={clsx(
              "pointer-events-auto group relative flex w-full max-w-md gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 pr-9 shadow-2xl shadow-slate-900/10 ring-1 animate-slideUp",
              style.ring
            )}
          >
            <div className={clsx("absolute left-0 top-0 h-full w-1.5", style.bar)} />
            <div className={clsx("ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", style.icon)}>
              <Icon className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-bold text-slate-900">{message.title}</p>
              {message.description ? (
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{message.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(message.id)}
              aria-label="Dismiss notification"
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
