export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-40 rounded bg-slate-200" />

      <div className="space-y-3">
        <div className="h-4 rounded bg-slate-200" />
        <div className="h-4 w-5/6 rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
      </div>

      <div className="mt-6 h-40 rounded-xl bg-slate-200" />
    </div>
  );
}