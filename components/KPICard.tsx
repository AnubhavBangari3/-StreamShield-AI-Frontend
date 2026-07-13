import { Activity, LucideIcon } from "lucide-react";

type KPICardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  iconClass: string;
  loading?: boolean;
};

export default function KPICard({
  label,
  value,
  helper,
  icon: Icon,
  iconClass,
  loading = false,
}: KPICardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-5 flex items-center justify-between">
        <div className={`rounded-xl p-2.5 ${iconClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        <Activity className="h-4 w-4 text-slate-300" />
      </div>

      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {loading ? "—" : value}
      </p>

      <p className="mt-2 text-xs text-slate-400">
        {helper}
      </p>
    </article>
  );
}