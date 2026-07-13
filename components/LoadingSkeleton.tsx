export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-1/3 rounded bg-slate-200" />

      <div className="mb-6 h-10 w-1/2 rounded bg-slate-200" />

      <div className="space-y-3">
        <div className="h-3 rounded bg-slate-200" />
        <div className="h-3 rounded bg-slate-200" />
        <div className="h-3 w-2/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}