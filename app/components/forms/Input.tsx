"use client";

interface InputProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}

export function Input({ label, value, onChange, type = "text", required = false, placeholder }: InputProps) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        required={required}
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-h-[42px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
      />
    </label>
  );
}
