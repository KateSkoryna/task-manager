import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  MAX_NARRATIVE_ATTEMPTS,
  Report,
  ReportPeriod,
  TodoItem,
} from '@shared/types';
import Container from '../elements/Container';
import Button from '../elements/Button';
import IconButton from '../elements/IconButton';
import {
  useReportQuery,
  useGenerateReportNarrativeMutation,
} from '../../fetchers/api';
import { useAuthStore } from '../../store/authStore';
import { usePreferences } from '../../hooks/usePreferences';
import KpiCard from '../statistics/components/KpiCard';
import ChartCard from '../statistics/components/ChartCard';
import {
  CHART_COLORS,
  TOOLTIP_STYLE,
  AXIS_TICK_STYLE,
} from '../statistics/chartColors';
import { Period, PeriodKind } from '../statistics/lib/periods';
import { Category } from '../statistics/lib/taskClassification';
import { categoryBreakdown } from '../statistics/lib/categories';
import { priorityDistribution } from '../statistics/lib/priorities';
import {
  completionRate,
  completedVsPlanned,
  unfinishedOverdue,
  planningLoad,
  workloadDistribution,
  plannedVsCompletedSeries,
} from '../statistics/lib/planning';
import { agingBuckets, agingSummary } from '../statistics/lib/aging';
import OverviewSection from '../statistics/sections/OverviewSection';
import PlanningSection from '../statistics/sections/PlanningSection';
import UnfinishedSection from '../statistics/sections/UnfinishedSection';
import BalanceSection from '../statistics/sections/BalanceSection';

const CATEGORY_BY_LIST_ID: Record<string, Category> = {
  home: 'home',
  education: 'education',
  work: 'work',
  family: 'family',
  health: 'health',
};

const PERIOD_KIND_BY_REPORT_PERIOD: Record<ReportPeriod, PeriodKind> = {
  weekly: 'week',
  monthly: 'month',
  yearly: 'year',
};

/**
 * The frozen `taskSnapshot` becomes a `TodoItem[]` so Phase 13's chart
 * functions can run against it unchanged. Each item's `todolistId` is set to
 * its own category name (identity-mapped via `CATEGORY_BY_LIST_ID`) since
 * the snapshot already resolved category at generation time and has no real
 * list to join against.
 */
const snapshotToTodoItems = (report: Report): TodoItem[] =>
  report.taskSnapshot.map((task) => ({
    id: task.id,
    name: task.name,
    status: task.status,
    todolistId: task.category,
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    priority: task.priority,
    order: 0,
    source: 'web',
  }));

const asPercent = (ratio: number | null): string =>
  ratio === null ? '—' : `${Math.round(ratio * 100)}%`;

function NarrativeList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item} className="text-sm text-primary">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reportId } = useParams<{ reportId: string }>();
  const { data: report, isLoading } = useReportQuery(reportId);
  const user = useAuthStore((s) => s.user);
  const userName =
    user?.displayName || `${user?.firstName} ${user?.lastName}`.trim();
  const { preferences } = usePreferences();
  const generateNarrative = useGenerateReportNarrativeMutation();

  const todos = useMemo(
    () => (report ? snapshotToTodoItems(report) : []),
    [report]
  );

  const period: Period | null = useMemo(() => {
    if (!report) return null;
    const end = new Date(report.periodEnd);
    return {
      kind: PERIOD_KIND_BY_REPORT_PERIOD[report.period],
      zone: 'UTC',
      start: new Date(report.periodStart),
      end,
      cutoff: end,
    };
  }, [report]);

  // The report is frozen, so "now" for every snapshot-derived stat is the
  // moment the period closed — there's no live comparison period either,
  // unlike the live Statistics page.
  const now = period?.end ?? null;

  const balance = useMemo(
    () => (period ? categoryBreakdown(todos, period, CATEGORY_BY_LIST_ID) : []),
    [todos, period]
  );
  const priorities = useMemo(
    () => (period ? priorityDistribution(todos, period) : null),
    [todos, period]
  );

  const rate = useMemo(
    () => (period && now ? completionRate(todos, period, now) : null),
    [todos, period, now]
  );
  const cvp = useMemo(
    () => (period ? completedVsPlanned(todos, period) : null),
    [todos, period]
  );
  const unfOverdue = useMemo(
    () => (period && now ? unfinishedOverdue(todos, period, now) : null),
    [todos, period, now]
  );
  const load = useMemo(
    () => (period ? planningLoad(todos, period) : null),
    [todos, period]
  );
  const series = useMemo(
    () => (period ? plannedVsCompletedSeries(todos, period) : []),
    [todos, period]
  );
  const workload = useMemo(
    () => (period ? workloadDistribution(todos, todos, period) : null),
    [todos, period]
  );
  const buckets = useMemo(
    () => (now ? agingBuckets(todos, now, 'UTC') : []),
    [todos, now]
  );
  const summary = useMemo(
    () => (now ? agingSummary(todos, now, 'UTC', CATEGORY_BY_LIST_ID) : null),
    [todos, now]
  );

  const categoryLabel = (category: Category) =>
    category === 'uncategorized'
      ? t('statistics.uncategorized')
      : t(`tasks.category_${category}`);

  if (isLoading) {
    return (
      <Container className="pt-6">
        <p className="text-primary">{t('reports.loading')}</p>
      </Container>
    );
  }

  if (!report) {
    return (
      <Container className="pt-6">
        <p className="text-sm text-muted">{t('reports.noData')}</p>
      </Container>
    );
  }

  const priorityData = priorities
    ? [
        { name: t('tasks.priority_low'), count: priorities.low },
        { name: t('tasks.priority_medium'), count: priorities.medium },
        { name: t('tasks.priority_high'), count: priorities.high },
      ]
    : [];

  const periodLabel = t(`reports.${report.period}`).toLowerCase();
  const narrativeAttemptsLeft = Math.max(
    0,
    MAX_NARRATIVE_ATTEMPTS - report.narrativeAttempts
  );
  const handleGenerateNarrative = () =>
    generateNarrative.mutate({ reportId: report.id });

  return (
    <Container className="space-y-6 pt-6 print:space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 print:block">
        <div className="flex items-center gap-3 min-w-0">
          <IconButton
            ariaLabel={t('reports.backToList')}
            onClick={() => navigate('/reports')}
            className="print:hidden"
          >
            <ArrowLeft className="size-4" />
          </IconButton>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-primary truncate">
              {report.name}
            </h1>
            {userName && (
              <p className="text-sm text-muted truncate">
                {t('reports.preparedFor', { name: userName })}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Download className="size-4" />
          {t('reports.print')}
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-4">
        <KpiCard
          label={t('reports.proactivityScore')}
          value={
            report.metrics.proactivityScore != null
              ? String(report.metrics.proactivityScore)
              : '—'
          }
        />
        <KpiCard
          label={t('reports.completionRatio')}
          value={asPercent(report.metrics.completionRatio)}
        />
        <KpiCard
          label={t('reports.onTimeRate')}
          value={asPercent(report.metrics.onTimeRate)}
        />
        <KpiCard
          label={t('reports.overdueCount')}
          value={String(report.metrics.overdueCount)}
        />
      </div>

      {(preferences?.aiConsent || report.narrative) && (
        <div className="bg-surface rounded-2xl border border-default p-5 shadow-card space-y-3 print:break-inside-avoid">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm font-semibold text-primary">
              {t('reports.aiInsightsTitle')}
            </p>
            {preferences?.aiConsent &&
              (narrativeAttemptsLeft > 0 ? (
                <Button
                  variant="secondary"
                  onClick={handleGenerateNarrative}
                  disabled={generateNarrative.isPending}
                  className={
                    generateNarrative.isPending
                      ? 'animate-border-pulse print:hidden'
                      : 'print:hidden'
                  }
                >
                  <Sparkles className="size-4" />
                  {report.narrative
                    ? t('reports.regenerateInsights')
                    : t('reports.getInsights')}
                </Button>
              ) : (
                <p className="text-xs text-muted print:hidden">
                  {t('reports.insightsLimitReached')}
                </p>
              ))}
          </div>
          {report.narrative ? (
            <div className="space-y-3">
              <p className="text-sm text-primary">{report.narrative.summary}</p>
              <NarrativeList
                title={t('reports.insightsProblems')}
                items={report.narrative.problems}
              />
              <NarrativeList
                title={t('reports.insightsReasoning')}
                items={report.narrative.reasoning}
              />
              <NarrativeList
                title={t('reports.insightsTips')}
                items={report.narrative.tips}
              />
            </div>
          ) : (
            <p className="text-sm text-muted">{t('reports.noInsightsYet')}</p>
          )}
          {generateNarrative.isError && (
            <p className="text-sm text-danger">{t('reports.insightsError')}</p>
          )}
        </div>
      )}

      <OverviewSection
        completionRate={rate!}
        completionRateComparison={null}
        completedVsPlanned={cvp!}
        unfinishedOverdue={unfOverdue!}
        planningLoad={load!}
        periodLabel={periodLabel}
      />

      <PlanningSection series={series} workload={workload!} />

      <UnfinishedSection
        buckets={buckets}
        summary={summary!}
        categoryLabel={categoryLabel}
      />

      <BalanceSection breakdown={balance} categoryLabel={categoryLabel} />

      <ChartCard title={t('statistics.priorityDistribution')}>
        {priorityData.some((d) => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              layout="vertical"
              data={priorityData}
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
                dataKey="count"
                fill={CHART_COLORS.planned}
                radius={[0, 3, 3, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-muted text-sm">{t('statistics.noData')}</p>
        )}
      </ChartCard>
    </Container>
  );
}
