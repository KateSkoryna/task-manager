import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { ConsistencyPoint } from '../lib/consistency';
import { TimingStats } from '../lib/timing';
import { Comparison } from '../lib/comparison';
import { Category } from '../lib/taskClassification';
import { TodoPriority } from '@shared/types';
import ChartCard from '../components/ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK_STYLE } from '../chartColors';

interface PeriodComparisons {
  completionRate: Comparison | null;
  averageDailyWorkload: Comparison | null;
  highPriorityShare: Comparison | null;
}

interface TrendsSectionProps {
  trend: ConsistencyPoint[];
  mostlyCompletedDays: number;
  timing: TimingStats;
  timingByCategory: Record<Category, TimingStats>;
  timingByPriority: Record<TodoPriority, TimingStats>;
  comparisons: PeriodComparisons;
  categoryLabel: (category: Category) => string;
  priorityLabel: (priority: TodoPriority) => string;
  periodLabel: string;
}

function TimingRow({ label, stats }: { label: string; stats: TimingStats }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between text-xs text-muted">
      <span>{label}</span>
      <span>
        {stats.sampleSize > 0
          ? t('statistics.medianDays', { days: stats.medianDays })
          : t('statistics.dash')}
      </span>
    </div>
  );
}

export default function TrendsSection({
  trend,
  mostlyCompletedDays,
  timing,
  timingByCategory,
  timingByPriority,
  comparisons,
  categoryLabel,
  priorityLabel,
  periodLabel,
}: TrendsSectionProps) {
  const { t } = useTranslation();

  const formatComparison = (comparison: Comparison | null, unit: string) =>
    comparison
      ? `${comparison.delta >= 0 ? '+' : ''}${comparison.delta}${unit} ${t(
          'statistics.vsPrevious',
          { period: periodLabel }
        )}`
      : t('statistics.dash');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard
        title={t('statistics.consistency')}
        subtitle={t('statistics.mostlyCompletedDays', {
          count: mostlyCompletedDays,
        })}
      >
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <LineChart
            data={trend}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
            <XAxis
              dataKey="label"
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={AXIS_TICK_STYLE}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="completionRatePercent"
              stroke={CHART_COLORS.completed}
              strokeWidth={2}
              dot={false}
              connectNulls
              name={t('statistics.completionRateLabel')}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="bg-surface rounded-2xl border border-default p-5 shadow-card space-y-4">
        <div>
          <p className="text-sm font-semibold text-primary mb-2">
            {t('statistics.timeToCompletion')}
          </p>
          <p className="text-xs text-muted mb-2">
            {timing.sampleSize > 0
              ? t('statistics.medianAndAverage', {
                  median: timing.medianDays,
                  average: timing.averageDays,
                })
              : t('statistics.dash')}
          </p>
          <div className="space-y-1">
            {(
              [
                'home',
                'education',
                'work',
                'family',
                'health',
                'uncategorized',
              ] as Category[]
            ).map((category) => (
              <TimingRow
                key={category}
                label={categoryLabel(category)}
                stats={timingByCategory[category]}
              />
            ))}
          </div>
          <div className="space-y-1 mt-2 border-t border-default pt-2">
            {(['low', 'medium', 'high'] as TodoPriority[]).map((priority) => (
              <TimingRow
                key={priority}
                label={priorityLabel(priority)}
                stats={timingByPriority[priority]}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-default pt-3 space-y-1 text-xs text-muted">
          <p className="text-sm font-semibold text-primary mb-1">
            {t('statistics.periodComparison')}
          </p>
          <p>
            {t('statistics.completionRateLabel')}:{' '}
            {formatComparison(comparisons.completionRate, ' pp')}
          </p>
          <p>
            {t('statistics.planningLoadLabel')}:{' '}
            {formatComparison(comparisons.averageDailyWorkload, '/day')}
          </p>
          <p>
            {t('statistics.priorityDistribution')}:{' '}
            {formatComparison(comparisons.highPriorityShare, ' pp')}
          </p>
        </div>
      </div>
    </div>
  );
}
