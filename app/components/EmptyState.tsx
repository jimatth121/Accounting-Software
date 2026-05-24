interface EmptyStateProps {
  text: string;
}

export function EmptyState({ text }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-10 text-center text-slate-500">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-400">
        ◌
      </div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
