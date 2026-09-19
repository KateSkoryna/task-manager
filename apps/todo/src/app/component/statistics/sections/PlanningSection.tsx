import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { SeriesPoint, WorkloadDistribution } from '../lib/planning';
import ChartCard from '../components/ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK_STYLE } from '../chartColors';

interface PlanningSectionProps {
  series: SeriesPoint[];
  workload: WorkloadDistribution;
}

export default function PlanningSection({
  series,
  workload,
}: PlanningSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard
        title={t('statistics.plannedVsCompleted')}
        subtitle={t('statistics.plannedCompletedUnfinishedSubtitle')}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart
            data={series}
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
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="planned"
              stroke={CHART_COLORS.planned}
              fill={CHART_COLORS.planned}
              fillOpacity={0.15}
              strokeWidth={2}
              name={t('statistics.plannedLabel')}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke={CHART_COLORS.completed}
              fill={CHART_COLORS.completed}
              fillOpacity={0.25}
              strokeWidth={2}
              name={t('statistics.completedLabel')}
            />
            <Area
              type="monotone"
              dataKey="unfinished"
              stroke={CHART_COLORS.unfinished}
              fill={CHART_COLORS.unfinished}
              fillOpacity={0.15}
              strokeWidth={2}
              name={t('statistics.unfinishedLabel')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('statistics.workloadDistribution')}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={series.map((s) => ({ label: s.label, planned: s.planned }))}
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
              allowDecimals={false}
            />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar
              dataKey="planned"
              fill={CHART_COLORS.planned}
              radius={[3, 3, 0, 0]}
              name={t('statistics.plannedLabel')}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-1 text-xs text-muted">
          <p>
            {t('statistics.averagePerDay', {
              count: workload.averagePerActiveDay,
            })}
          </p>
          {workload.busiest && (
            <p>
              {t('statistics.busiestDay', {
                label: workload.busiest.label,
                count: workload.busiest.count,
              })}
            </p>
          )}
          {workload.lightest && (
            <p>
              {t('statistics.lightestDay', {
                label: workload.lightest.label,
                count: workload.lightest.count,
              })}
            </p>
          )}
          {workload.deviationFromNormal !== null &&
          workload.normalPerActiveDay !== null ? (
            <p>
              {t('statistics.deviationFromNormal', {
                delta: `${workload.deviationFromNormal >= 0 ? '+' : ''}${
                  workload.deviationFromNormal
                }`,
                normal: workload.normalPerActiveDay,
              })}
            </p>
          ) : (
            <p>{t('statistics.noWorkloadHistory')}</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}
