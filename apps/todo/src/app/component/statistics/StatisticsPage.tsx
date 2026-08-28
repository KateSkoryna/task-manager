import { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import Container from '../elements/Container';
import { useTodoListsQuery } from '../../fetchers/api';
import {
  Period,
  CHART_COLORS,
  filterByPeriod,
  computeTimeSeries,
  computeWeekdayData,
  computeStatusData,
  computeCategoryData,
  getDaysTracked,
} from './statsUtils';

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const { t } = useTranslation();

  const periods: { label: string; value: Period }[] = [
    { label: t('statistics.week'), value: 'week' },
    { label: t('statistics.month'), value: 'month' },
    { label: t('statistics.year'), value: 'year' },
  ];

  const activeIndex = periods.findIndex((p) => p.value === value);

  return (
    <div className="relative flex bg-surface border border-default rounded-lg p-1">
      {/* sliding pill */}
      <span
        className="absolute top-1 bottom-1 rounded-md bg-accent transition-transform duration-300 ease-in-out"
        style={{
          width: `calc((100% - 8px) / ${periods.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`relative z-10 w-16 py-1.5 rounded-md text-sm font-medium text-center transition-colors duration-300 ${
            value === p.value ? 'text-on-accent' : 'text-primary'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <span
        className="text-4xl font-bold leading-none"
        style={{ color: color || 'rgb(var(--color-primary))' }}
      >
        {value}
      </span>
      <span className="text-xs text-muted mt-1 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

const cardClass =
  'bg-surface rounded-2xl border border-default p-5 shadow-card';
const chartCardClass =
  'bg-surface rounded-2xl border border-default pt-5 px-5 pb-5 shadow-card';

// Recharts contentStyle/tick props need resolved CSS strings — see §4.6.
// fontSize here stays a literal px number (Recharts' own SVG text-sizing
// convention, same integration-boundary exception as react-day-picker).
const TOOLTIP_STYLE = {
  borderRadius: '0.5rem',
  border: '1px solid rgb(var(--color-default))',
  backgroundColor: 'rgb(var(--color-surface))',
  color: 'rgb(var(--color-primary))',
  boxShadow: 'var(--shadow-menu)',
  fontSize: 12,
};
const AXIS_TICK_STYLE = { fontSize: 11, fill: 'rgb(var(--color-muted))' };

export default function StatisticsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('month');
  const { data: todoLists = [], isLoading } = useTodoListsQuery();

  const allTodos = useMemo(
    () => todoLists.flatMap((l) => l.todos),
    [todoLists]
  );
  const filteredTodos = useMemo(
    () => filterByPeriod(allTodos, period),
    [allTodos, period]
  );

  const timeSeries = useMemo(
    () => computeTimeSeries(allTodos, period),
    [allTodos, period]
  );
  const weekdayData = useMemo(
    () => computeWeekdayData(filteredTodos),
    [filteredTodos]
  );
  const statusData = useMemo(
    () => computeStatusData(filteredTodos),
    [filteredTodos]
  );
  const categoryData = useMemo(
    () => computeCategoryData(todoLists),
    [todoLists]
  );
  const daysTracked = useMemo(() => getDaysTracked(todoLists), [todoLists]);

  const totalCount = allTodos.length;
  const successfulCount = filteredTodos.filter(
    (t) => t.status === 'successful'
  ).length;
  const failedCount = filteredTodos.filter((t) => t.status === 'failed').length;
  const pendingCount = filteredTodos.filter(
    (t) => t.status === 'pending'
  ).length;
  const filteredTotal = filteredTodos.length;
  const completionRate =
    filteredTotal > 0 ? Math.round((successfulCount / filteredTotal) * 100) : 0;

  if (isLoading) {
    return (
      <Container>
        <p className="text-primary">{t('statistics.loading')}</p>
      </Container>
    );
  }

  return (
    <Container className="space-y-6">
      <div className="flex items-center justify-end flex-wrap gap-3">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Row 1: Time series + Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart – 2/3 width */}
        <div className={`${chartCardClass} lg:col-span-2`}>
          <p className="text-sm font-semibold text-primary mb-1">
            {t('statistics.numberOfTodos')}
          </p>
          <p className="text-xs text-muted mb-4">
            {t('statistics.totalDoneFailed')}
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart
              data={timeSeries}
              margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.total}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.total}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.successful}
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.successful}
                    stopOpacity={0}
                  />
                </linearGradient>
                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={CHART_COLORS.failed}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={CHART_COLORS.failed}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
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
                dataKey="total"
                stroke={CHART_COLORS.total}
                fill="url(#gradTotal)"
                strokeWidth={2}
                name={t('statistics.total')}
              />
              <Area
                type="monotone"
                dataKey="successful"
                stroke={CHART_COLORS.successful}
                fill="url(#gradDone)"
                strokeWidth={2}
                name={t('statistics.done')}
              />
              <Area
                type="monotone"
                dataKey="failed"
                stroke={CHART_COLORS.failed}
                fill="url(#gradFailed)"
                strokeWidth={2}
                name={t('statistics.failed')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie + summary numbers */}
        <div className={`${cardClass} flex flex-col`}>
          <p className="text-sm font-semibold text-primary mb-1">
            {t('statistics.statusBreakdown')}
          </p>
          <p className="text-xs text-muted mb-2">
            {t('statistics.completionRate', { rate: completionRate })}
          </p>
          <div className="flex-1 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: '1.25rem' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted text-sm">{t('statistics.noData')}</p>
            )}
          </div>
          <div className="grid grid-cols-3 divide-x divide-default border-t border-default mt-2">
            <StatCard
              label={t('statistics.done')}
              value={successfulCount}
              color={CHART_COLORS.successful}
            />
            <StatCard
              label={t('statistics.pending')}
              value={pendingCount}
              color={CHART_COLORS.pending}
            />
            <StatCard
              label={t('statistics.failed')}
              value={failedCount}
              color={CHART_COLORS.failed}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Weekday bar + Summary text + Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart per weekday */}
        <div className={chartCardClass}>
          <p className="text-sm font-semibold text-primary mb-1">
            {t('statistics.todosPerWeekday')}
          </p>
          <p className="text-xs text-muted mb-4">{t('statistics.totalDone')}</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={weekdayData}
              margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
              barCategoryGap="25%"
              barGap={2}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
              <XAxis
                dataKey="day"
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
                dataKey="total"
                fill={CHART_COLORS.total}
                radius={[3, 3, 0, 0]}
                name={t('statistics.total')}
              />
              <Bar
                dataKey="successful"
                fill={CHART_COLORS.successful}
                radius={[3, 3, 0, 0]}
                name={t('statistics.done')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary text card */}
        <div
          className={`${cardClass} flex flex-col items-center justify-center bg-sidebar text-accent`}
        >
          <p className="text-xs uppercase tracking-widest text-sidebar-muted mb-3">
            {t('statistics.todoListStats')}
          </p>
          <p className="text-6xl font-black leading-none text-accent">
            {totalCount}
          </p>
          <p className="text-sm font-semibold text-sidebar-muted mt-1 uppercase tracking-wider">
            {t('statistics.totalTodos')}
          </p>
          <div className="border-t border-sidebar-border w-16 my-4" />
          <p className="text-5xl font-black leading-none text-accent/75">
            {daysTracked}
          </p>
          <p className="text-sm font-semibold text-sidebar-muted mt-1 uppercase tracking-wider">
            {t('statistics.daysTracked')}
          </p>
          <div className="border-t border-sidebar-border w-16 my-4" />
          <p className="text-4xl font-black leading-none text-accent/55">
            {completionRate}%
          </p>
          <p className="text-sm font-semibold text-sidebar-muted mt-1 uppercase tracking-wider">
            {t('statistics.completion')}
          </p>
        </div>

        {/* Horizontal bar – by category */}
        <div className={chartCardClass}>
          <p className="text-sm font-semibold text-primary mb-1">
            {t('statistics.byCategory')}
          </p>
          <p className="text-xs text-muted mb-4">{t('statistics.totalDone')}</p>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                layout="vertical"
                data={categoryData}
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                barCategoryGap="30%"
                barGap={2}
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
                  width={65}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="total"
                  fill={CHART_COLORS.total}
                  radius={[0, 3, 3, 0]}
                  name={t('statistics.total')}
                />
                <Bar
                  dataKey="successful"
                  fill={CHART_COLORS.successful}
                  radius={[0, 3, 3, 0]}
                  name={t('statistics.done')}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm mt-6">
              {t('statistics.noCategoryData')}
            </p>
          )}
        </div>
      </div>
    </Container>
  );
}
