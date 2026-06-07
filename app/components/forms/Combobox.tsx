"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { clsx } from "@/lib/utils";

export interface ComboboxOption {
  label: string;
  value: string;
  hint?: string;
  badge?: string;
}

interface ComboboxProps {
  label: string;
  value: string;
  onChange: (value: string, option: ComboboxOption | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  allowCustom?: boolean;
  required?: boolean;
  emptyHint?: string;
}

export function Combobox({
  label,
  value,
  onChange,
  options,
  placeholder = "Type to search…",
  allowCustom = true,
  required = false,
  emptyHint = "No matches — keep typing to use this as a custom entry."
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocumentClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    return () => document.removeEventListener("mousedown", onDocumentClick);
  }, [open]);

  const filtered = useMemo(() => {
    const term = value.trim().toLowerCase();
    if (!term) return options.slice(0, 50);
    return options
      .filter((option) => `${option.label} ${option.hint || ""}`.toLowerCase().includes(term))
      .slice(0, 50);
  }, [options, value]);

  useEffect(() => {
    setHighlight(0);
  }, [value, open]);

  function pick(option: ComboboxOption) {
    onChange(option.label, option);
    setOpen(false);
  }

  function keyHandler(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((prev) => Math.max(prev - 1, 0));
    } else if (event.key === "Enter") {
      if (open && filtered[highlight]) {
        event.preventDefault();
        pick(filtered[highlight]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative grid gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <div
        className={clsx(
          "flex items-center gap-2 rounded-lg border bg-white px-3 transition",
          open
            ? "border-brand-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          type="text"
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onChange(event.target.value, null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={keyHandler}
          className="min-h-[42px] flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              onChange("", null);
              setOpen(false);
            }}
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Toggle list"
          onClick={() => setOpen((prev) => !prev)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <ChevronDown className={clsx("h-4 w-4 transition", open ? "rotate-180" : "")} />
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl">
          {filtered.length ? (
            filtered.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(option)}
                className={clsx(
                  "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition",
                  index === highlight
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{option.label}</p>
                  {option.hint ? <p className="truncate text-[11px] text-slate-500">{option.hint}</p> : null}
                </div>
                {option.badge ? (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {option.badge}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-4 text-xs text-slate-500">
              {allowCustom ? emptyHint : "No matches"}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
