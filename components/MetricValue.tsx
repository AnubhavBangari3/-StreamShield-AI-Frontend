type MetricValueProps = {
  label: string;
  value: string | number;
};

export default function MetricValue({
  label,
  value,
}: MetricValueProps) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>

      <p className="mt-1 font-medium capitalize text-slate-700">
        {value}
      </p>
    </div>
  );
}