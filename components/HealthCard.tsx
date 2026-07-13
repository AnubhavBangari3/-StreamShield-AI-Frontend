type HealthCardProps = {
  label: string;
  value: number;
  valueClass: string;
};

export default function HealthCard({
  label,
  value,
  valueClass,
}: HealthCardProps) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>
        {value}
      </p>
    </article>
  );
}