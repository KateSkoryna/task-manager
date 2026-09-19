interface KpiCardProps {
  label: string;
  value: string;
  sublabel?: string;
  /** e.g. "+8 pp vs previous week" — omitted entirely when there isn't enough data to compare. */
  comparisonLabel?: string;
}

export default function KpiCard({
  label,
  value,
  sublabel,
  comparisonLabel,
}: KpiCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-default p-5 shadow-card flex flex-col items-center justify-center text-center">
      <span className="text-3xl font-bold leading-none text-primary">
        {value}
      </span>
      <span className="text-xs text-muted mt-2 uppercase tracking-wider">
        {label}
      </span>
      {sublabel && <span className="text-xs text-muted mt-1">{sublabel}</span>}
      {comparisonLabel && (
        <span className="text-xs font-medium mt-1 text-accent">
          {comparisonLabel}
        </span>
      )}
    </div>
  );
}
