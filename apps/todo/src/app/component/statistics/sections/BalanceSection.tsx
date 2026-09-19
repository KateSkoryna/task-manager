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
import { CategoryBreakdown } from '../lib/categories';
import ChartCard from '../components/ChartCard';
import { CHART_COLORS, TOOLTIP_STYLE, AXIS_TICK_STYLE } from '../chartColors';

interface BalanceSectionProps {
  breakdown: CategoryBreakdown[];
  categoryLabel: (category: CategoryBreakdown['category']) => string;
}

export default function BalanceSection({
  breakdown,
  categoryLabel,
}: BalanceSectionProps) {
  const { t } = useTranslation();

  const shareData = breakdown
    .filter((b) => b.plannedCount > 0)
    .map((b) => ({
      name: categoryLabel(b.category),
      planned: b.plannedCount,
      completed: b.completedCount,
    }));
  const rateData = breakdown
    .filter((b) => b.completionRatePercent !== null)
    .map((b) => ({
      name: categoryLabel(b.category),
      rate: b.completionRatePercent ?? 0,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChartCard title={t('statistics.categoryDistribution')}>
        {shareData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={shareData}
              margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={AXIS_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={AXIS_TICK_STYLE}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar
                dataKey="planned"
                fill={CHART_COLORS.planned}
                radius={[0, 3, 3, 0]}
                name={t('statistics.plannedLabel')}
              />
              <Bar
                dataKey="completed"
                fill={CHART_COLORS.completed}
                radius={[0, 3, 3, 0]}
                name={t('statistics.completedLabel')}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-sm">{t('statistics.noData')}</p>
        )}
      </ChartCard>

      <ChartCard title={t('statistics.completionRateByCategory')}>
        {rateData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
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
                width={90}
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
