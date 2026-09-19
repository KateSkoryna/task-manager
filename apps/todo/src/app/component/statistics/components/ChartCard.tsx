import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export default function ChartCard({
  title,
  subtitle,
  children,
}: ChartCardProps) {
  return (
    <div className="bg-surface rounded-2xl border border-default pt-5 px-5 pb-5 shadow-card h-full flex flex-col">
      <p className="text-sm font-semibold text-primary mb-1">{title}</p>
      {subtitle && <p className="text-xs text-muted mb-4">{subtitle}</p>}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
