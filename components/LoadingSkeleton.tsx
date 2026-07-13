type LoadingSkeletonProps = {
  count?: number;
};

export default function LoadingSkeleton({
  count = 3,
}: LoadingSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="h-5 w-44 rounded bg-slate-200" />
            <div className="h-6 w-20 rounded-full bg-slate-200" />
          </div>

          <div className="space-y-3">
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-4 w-5/6 rounded bg-slate-200" />
            <div className="h-4 w-2/3 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}