import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { AgingBucket, AgingBucketLabel, AgingSummary } from '../lib/aging';
import { Category } from '../lib/taskClassification';
import ChartCard from '../components/ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK_STYLE } from '../chartColors';

interface UnfinishedSectionProps {
  buckets: AgingBucket[];
  summary: AgingSummary;
  categoryLabel: (category: Category) => string;
}

const AGING_BUCKET_KEYS: Record<AgingBucketLabel, string> = {
  '1 day': 'statistics.agingBucket1Day',
  '2-3 days': 'statistics.agingBucket2to3Days',
  '4-7 days': 'statistics.agingBucket4to7Days',
  'more than 7 days': 'statistics.agingBucketMoreThan7Days',
};

export default function UnfinishedSection({
  buckets,
  summary,
  categoryLabel,
}: UnfinishedSectionProps) {
  const { t } = useTranslation();
  const translatedBuckets = buckets.map((bucket) => ({
    ...bucket,
    label: t(AGING_BUCKET_KEYS[bucket.label]),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title={t('statistics.unfinishedTaskAging')}>
        {summary.overdueCount > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={translatedBuckets}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
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
                allowDecimals={false}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="count"
                fill={CHART_COLORS.high}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-sm">{t('statistics.noOverdueTasks')}</p>
        )}
      </ChartCard>

      <div className="bg-surface rounded-2xl border border-default p-5 shadow-card h-full flex flex-col">
        <p className="text-sm font-semibold text-primary mb-4">
          {t('statistics.overdueSnapshot')}
        </p>
        <div className="flex-1 flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p
                className="text-6xl font-black leading-none"
                style={{ color: CHART_COLORS.high }}
              >
                {summary.overdueCount}
              </p>
              <p className="text-xs text-muted mt-2 uppercase tracking-wider">
                {t('statistics.overdueCountLabel')}
              </p>
            </div>
            <div className="text-center">
              <p
                className="text-6xl font-black leading-none"
                style={{ color: CHART_COLORS.high }}
              >
                {summary.staleCount}
              </p>
              <p className="text-xs text-muted mt-2 uppercase tracking-wider">
                {t('statistics.staleCountLabel')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-6xl font-black leading-none text-primary">
                {summary.averageAgeDays !== null
                  ? summary.averageAgeDays
                  : t('statistics.dash')}
              </p>
              <p className="text-xs text-muted mt-2 uppercase tracking-wider">
                {t('statistics.averageAgeLabel')}
              </p>
            </div>
          </div>
        </div>
        {summary.oldestTask && (
          <div className="mt-4 pt-4 border-t border-default space-y-1">
            <p className="text-sm text-primary">
              {t('statistics.oldestTask', {
                name: summary.oldestTask.name,
                days: summary.oldestTask.ageDays,
                category: categoryLabel(summary.oldestTask.category),
              })}
            </p>
            {summary.categoriesWithOldestTasks.length > 0 && (
              <p className="text-xs text-muted">
                {t('statistics.categoriesWithOldestTasks', {
                  categories: summary.categoriesWithOldestTasks
                    .map(categoryLabel)
                    .join(', '),
                })}
              </p>
            )}
            {summary.newestTask &&
              summary.newestTask.id !== summary.oldestTask.id && (
                <>
                  <p className="text-sm text-primary">
                    {t('statistics.newestTask', {
                      name: summary.newestTask.name,
                      days: summary.newestTask.ageDays,
                      category: categoryLabel(summary.newestTask.category),
                    })}
                  </p>
                  {summary.categoriesWithNewestTasks.length > 0 && (
                    <p className="text-xs text-muted">
                      {t('statistics.categoriesWithNewestTasks', {
                        categories: summary.categoriesWithNewestTasks
                          .map(categoryLabel)
                          .join(', '),
                      })}
                    </p>
                  )}
                </>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
