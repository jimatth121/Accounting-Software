"use client";

import { useEffect, useState } from "react";

interface InputProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

// Number inputs treat an external value of 0 as "no entry yet" so the field
// renders empty (with placeholder) instead of literal "0". The display is held
// in local state so a user can still type "0" intentionally and see it stick.
function initialDisplay(value: string | number | undefined, isNumber: boolean): string {
  if (value === undefined || value === null) return "";
  if (isNumber && (value === 0 || value === "0")) return "";
  return String(value);
}

export function Input({ label, value, onChange, type = "text", required = false, placeholder }: InputProps) {
  const isNumber = type === "number";
  const [display, setDisplay] = useState<string>(() => initialDisplay(value, isNumber));

  // Resync from props when the external value transitions away from what the
  // current display would parse to (e.g., a programmatic reset or another piece
  // of the form changing this field). For numbers we compare numerically so
  // typing "0" doesn't get clobbered.
  useEffect(() => {
    const incoming = value === undefined || value === null ? "" : String(value);
    if (!isNumber) {
      setDisplay((prev) => (incoming === prev ? prev : incoming));
      return;
    }
    setDisplay((prev) => {
      const prevNum = prev === "" ? 0 : Number(prev);
      const incomingNum = incoming === "" ? 0 : Number(incoming);
      if (!Number.isNaN(prevNum) && prevNum === incomingNum) return prev;
      return initialDisplay(value, true);
    });
  }, [value, isNumber]);

  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={display}
        onChange={(event) => {
          setDisplay(event.target.value);
          onChange(event.target.value);
        }}
        className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
