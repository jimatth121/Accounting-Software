"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { clsx } from "@/lib/utils";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  clearable?: boolean;
}

function toDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  clearable = true
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const selected = toDate(value);
  const display = selected ? format(selected, "dd MMM yyyy") : "";

  return (
    <div ref={containerRef} className="relative grid gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={clsx(
          "group flex w-full min-h-[42px] items-center gap-2 rounded-lg border bg-white px-3 text-left text-sm transition",
          open
            ? "border-brand-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
            : "border-slate-200 hover:border-slate-300",
          display ? "text-slate-900" : "text-slate-400"
        )}
      >
        <Calendar className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-500" />
        <span className="flex-1 truncate">{display || placeholder}</span>
        {display && clearable ? (
          <button
            type="button"
            aria-label="Clear date"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            className="flex h-5 w-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </button>

      {open ? (
        <div className="absolute top-full left-0 z-30 mt-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            classNames={{
              root: "smartbooks-day-picker",
              months: "flex",
              month: "space-y-3",
              caption_label: "text-sm font-bold text-slate-900",
              nav: "flex items-center gap-1",
              button_previous:
                "h-8 w-8 rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700",
              button_next:
                "h-8 w-8 rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700",
              weekdays: "text-[10px] font-bold uppercase tracking-wider text-slate-400",
              weekday: "w-9 pb-1 text-center",
              day: "h-9 w-9 text-center text-sm",
              day_button:
                "h-9 w-9 rounded-lg text-sm transition hover:bg-brand-50 hover:text-brand-700",
              selected:
                "bg-gradient-to-br from-brand-500 to-fuchsia-500 text-white font-semibold shadow-md shadow-brand-500/30 hover:!bg-brand-600 hover:!text-white",
              today:
                "ring-1 ring-brand-500/40 text-brand-700 font-bold",
              outside: "text-slate-300",
              disabled: "opacity-40 pointer-events-none",
              dropdowns: "flex gap-2",
              dropdown:
                "rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
