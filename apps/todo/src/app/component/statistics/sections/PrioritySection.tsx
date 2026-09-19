import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import {
  PriorityDistribution,
  PriorityTrendPoint,
  PriorityCompletion,
} from '../lib/priorities';
import ChartCard from '../components/ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK_STYLE } from '../chartColors';

interface PrioritySectionProps {
  distribution: PriorityDistribution;
  highShareTrend: PriorityTrendPoint[];
  completionRates: PriorityCompletion[];
  priorityLabel: (priority: PriorityCompletion['priority']) => string;
}

export default function PrioritySection({
  distribution,
  highShareTrend,
  completionRates,
  priorityLabel,
}: PrioritySectionProps) {
  const { t } = useTranslation();

  const mixData = [
    { name: priorityLabel('low'), count: distribution.low },
    { name: priorityLabel('medium'), count: distribution.medium },
    { name: priorityLabel('high'), count: distribution.high },
  ];
  const rateData = completionRates
    .filter((r) => r.completionRatePercent !== null)
    .map((r) => ({
      name: priorityLabel(r.priority),
      rate: r.completionRatePercent ?? 0,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard
        title={t('statistics.priorityDistribution')}
        subtitle={
          distribution.highSharePercent !== null
            ? t('statistics.highSharePercent', {
                percent: distribution.highSharePercent,
              })
            : undefined
        }
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={mixData}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={CHART_COLORS.grid}
              vertical={false}
            />
            <XAxis
              dataKey="name"
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
        <ResponsiveContainer width="100%" height={100}>
          <LineChart
            data={highShareTrend}
            margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
          >
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
              dataKey="highSharePercent"
              stroke={CHART_COLORS.high}
              strokeWidth={2}
              dot={false}
              connectNulls
              name={t('statistics.highShareTrend')}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title={t('statistics.completionRateByPriority')}>
        {rateData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
            <BarChart
              layout="vertical"
              data={rateData}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={AXIS_TICK_STYLE}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={AXIS_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="rate"
                fill={CHART_COLORS.completed}
                radius={[0, 3, 3, 0]}
                name={t('statistics.completionRateLabel')}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-sm">{t('statistics.noData')}</p>
        )}
      </ChartCard>
    </div>
  );
}
