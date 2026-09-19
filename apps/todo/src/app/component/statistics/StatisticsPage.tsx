import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { detectTimezone, inZone, TodoPriority } from '@shared/types';
import Container from '../elements/Container';
import PeriodSelector from '../elements/PeriodSelector';
import { useTodoListsQuery, useInboxTodosQuery } from '../../fetchers/api';
import { usePreferences } from '../../hooks/usePreferences';
import {
  resolvePeriod,
  shiftPeriod,
  previousComparableSpan,
  Period,
  PeriodKind,
} from './lib/periods';
import { Category } from './lib/taskClassification';
import {
  completionRate,
  completedVsPlanned,
  unfinishedOverdue,
  planningLoad,
  workloadDistribution,
  plannedVsCompletedSeries,
} from './lib/planning';
import { compareValues } from './lib/comparison';
import { categoryBreakdown } from './lib/categories';
import {
  priorityDistribution,
  priorityHighShareTrend,
  priorityCompletionRates,
} from './lib/priorities';
import { agingBuckets, agingSummary } from './lib/aging';
import {
  timeToCompletion,
  timeToCompletionByCategory,
  timeToCompletionByPriority,
} from './lib/timing';
import {
  completionRateTrend,
  mostlyCompletedDaysCount,
} from './lib/consistency';
import PeriodNavigator from './components/PeriodNavigator';
import OverviewSection from './sections/OverviewSection';
import PlanningSection from './sections/PlanningSection';
import BalanceSection from './sections/BalanceSection';
import PrioritySection from './sections/PrioritySection';
import UnfinishedSection from './sections/UnfinishedSection';
import TrendsSection from './sections/TrendsSection';

export default function StatisticsPage() {
  const { t } = useTranslation();
  const [periodKind, setPeriodKind] = useState<PeriodKind>('month');
  const [anchor, setAnchor] = useState<Date>(() => new Date());
  const { data: todoLists = [], isLoading: isLoadingTodoLists } =
    useTodoListsQuery();
  const { data: inboxTodos = [], isLoading: isLoadingInboxTodos } =
    useInboxTodosQuery();
  const { preferences } = usePreferences();
  const isLoading = isLoadingTodoLists || isLoadingInboxTodos;

  const zone = preferences?.timezone ?? detectTimezone();
  const now = useMemo(() => new Date(), []);

  const allTodos = useMemo(
    () => [...todoLists.flatMap((l) => l.todos), ...inboxTodos],
    [todoLists, inboxTodos]
  );

  const categoryByListId = useMemo(() => {
    const map: Record<string, Category> = {};
    for (const list of todoLists) {
      if (list.category) map[list.id] = list.category;
    }
    return map;
  }, [todoLists]);

  const categoryLabel = (category: Category) =>
    category === 'uncategorized'
      ? t('statistics.uncategorized')
      : t(`tasks.category_${category}`);
  const priorityLabel = (priority: TodoPriority) =>
    t(`tasks.priority_${priority}`);

  const currentPeriod: Period = useMemo(
    () => resolvePeriod(periodKind, anchor, zone, now),
    [periodKind, anchor, zone, now]
  );

  const nextPeriodStart = useMemo(
    () => shiftPeriod(currentPeriod, 1, now).start,
    [currentPeriod, now]
  );
  const nextDisabled = nextPeriodStart.getTime() > now.getTime();

  const handlePeriodChange = (kind: PeriodKind) => {
    setPeriodKind(kind);
    setAnchor(new Date());
  };
  const handlePrevious = () =>
    setAnchor(shiftPeriod(currentPeriod, -1, now).start);
  const handleNext = () => setAnchor(nextPeriodStart);

  const rangeLabel = useMemo(() => {
    const start = inZone(currentPeriod.start, zone);
    const end = inZone(currentPeriod.end, zone);
    if (currentPeriod.kind === 'year') return start.format('YYYY');
    if (currentPeriod.kind === 'month') return start.format('MMMM YYYY');
    return `${start.format('MMM D')} – ${end.format('MMM D, YYYY')}`;
  }, [currentPeriod, zone]);

  // Row 1 & 2
  const rate = useMemo(
    () => completionRate(allTodos, currentPeriod, now),
    [allTodos, currentPeriod, now]
  );
  const cvp = useMemo(
    () => completedVsPlanned(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const unfOverdue = useMemo(
    () => unfinishedOverdue(allTodos, currentPeriod, now),
    [allTodos, currentPeriod, now]
  );
  const load = useMemo(
    () => planningLoad(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const series = useMemo(
    () => plannedVsCompletedSeries(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const workload = useMemo(
    () => workloadDistribution(allTodos, allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );

  // Previous period, for comparisons
  const previousSpan = useMemo(
    () => previousComparableSpan(currentPeriod),
    [currentPeriod]
  );
  const previousPeriod: Period = useMemo(
    () => ({
      kind: currentPeriod.kind,
      zone: currentPeriod.zone,
      start: previousSpan.start,
      end: previousSpan.end,
      cutoff: previousSpan.end,
    }),
    [currentPeriod, previousSpan]
  );
  const previousRate = useMemo(
    () => completionRate(allTodos, previousPeriod, previousSpan.end),
    [allTodos, previousPeriod, previousSpan]
  );
  const previousLoad = useMemo(
    () => planningLoad(allTodos, previousPeriod),
    [allTodos, previousPeriod]
  );
  const previousDistribution = useMemo(
    () => priorityDistribution(allTodos, previousPeriod),
    [allTodos, previousPeriod]
  );
  const completionRateComparison = useMemo(
    () => compareValues(rate.rate, previousRate.rate, previousRate.dueCount),
    [rate, previousRate]
  );
  const periodLabel = t(`statistics.${periodKind}`).toLowerCase();

  // Row 3 — Life / Work Balance
  const balance = useMemo(
    () => categoryBreakdown(allTodos, currentPeriod, categoryByListId),
    [allTodos, currentPeriod, categoryByListId]
  );

  // Row 4 — Priority Behavior
  const distribution = useMemo(
    () => priorityDistribution(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const highShareTrend = useMemo(
    () => priorityHighShareTrend(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const priorityRates = useMemo(
    () => priorityCompletionRates(allTodos, currentPeriod, now),
    [allTodos, currentPeriod, now]
  );

  // Row 5 — Unfinished Work (current state, not period-filtered)
  const buckets = useMemo(
    () => agingBuckets(allTodos, now, zone),
    [allTodos, now, zone]
  );
  const summary = useMemo(
    () => agingSummary(allTodos, now, zone, categoryByListId),
    [allTodos, now, zone, categoryByListId]
  );

  // Row 6 — Trends
  const trend = useMemo(
    () => completionRateTrend(allTodos, currentPeriod, now),
    [allTodos, currentPeriod, now]
  );
  const mostlyCompletedDays = useMemo(
    () => mostlyCompletedDaysCount(allTodos, currentPeriod, now),
    [allTodos, currentPeriod, now]
  );
  const timing = useMemo(
    () => timeToCompletion(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const timingByCategory = useMemo(
    () => timeToCompletionByCategory(allTodos, currentPeriod, categoryByListId),
    [allTodos, currentPeriod, categoryByListId]
  );
  const timingByPriority = useMemo(
    () => timeToCompletionByPriority(allTodos, currentPeriod),
    [allTodos, currentPeriod]
  );
  const workloadComparison = useMemo(
    () =>
      compareValues(
        load.averagePerActiveDay,
        previousLoad.averagePerActiveDay,
        previousRate.dueCount
      ),
    [load, previousLoad, previousRate]
  );
  const highShareComparison = useMemo(
    () =>
      compareValues(
        distribution.highSharePercent,
        previousDistribution.highSharePercent,
        previousRate.dueCount
      ),
    [distribution, previousDistribution, previousRate]
  );

  if (isLoading) {
    return (
      <Container>
        <p className="text-primary">{t('statistics.loading')}</p>
      </Container>
    );
  }

  return (
    <Container className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PeriodNavigator
          rangeLabel={rangeLabel}
          onPrevious={handlePrevious}
          onNext={handleNext}
          nextDisabled={nextDisabled}
          previousLabel={t('statistics.previousPeriod')}
          nextLabel={t('statistics.nextPeriod')}
        />
        <PeriodSelector
          options={[
            { label: t('statistics.week'), value: 'week' as const },
            { label: t('statistics.month'), value: 'month' as const },
            { label: t('statistics.year'), value: 'year' as const },
          ]}
          value={periodKind}
          onChange={handlePeriodChange}
        />
      </div>

      <OverviewSection
        completionRate={rate}
        completionRateComparison={completionRateComparison}
        completedVsPlanned={cvp}
        unfinishedOverdue={unfOverdue}
        planningLoad={load}
        periodLabel={periodLabel}
      />

      <PlanningSection series={series} workload={workload} />

      <UnfinishedSection
        buckets={buckets}
        summary={summary}
        categoryLabel={categoryLabel}
      />

      <BalanceSection breakdown={balance} categoryLabel={categoryLabel} />

      <PrioritySection
        distribution={distribution}
        highShareTrend={highShareTrend}
        completionRates={priorityRates}
        priorityLabel={priorityLabel}
      />

      <TrendsSection
        trend={trend}
        mostlyCompletedDays={mostlyCompletedDays}
        timing={timing}
        timingByCategory={timingByCategory}
        timingByPriority={timingByPriority}
        comparisons={{
          completionRate: completionRateComparison,
          averageDailyWorkload: workloadComparison,
          highPriorityShare: highShareComparison,
        }}
        categoryLabel={categoryLabel}
        priorityLabel={priorityLabel}
        periodLabel={periodLabel}
      />
    </Container>
  );
}
