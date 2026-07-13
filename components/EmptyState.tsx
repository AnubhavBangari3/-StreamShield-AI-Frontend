type EmptyStateProps = {
  text: string;
};

export default function EmptyState({
  text,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}