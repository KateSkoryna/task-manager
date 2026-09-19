import { useTranslation } from 'react-i18next';
import {
  CompletionRate,
  CompletedVsPlanned,
  UnfinishedOverdue,
  PlanningLoad,
} from '../lib/planning';
import { Comparison } from '../lib/comparison';
import KpiCard from '../components/KpiCard';

interface OverviewSectionProps {
  completionRate: CompletionRate;
  completionRateComparison: Comparison | null;
  completedVsPlanned: CompletedVsPlanned;
  unfinishedOverdue: UnfinishedOverdue;
  planningLoad: PlanningLoad;
  periodLabel: string;
}

export default function OverviewSection({
  completionRate,
  completionRateComparison,
  completedVsPlanned,
  unfinishedOverdue,
  planningLoad,
  periodLabel,
}: OverviewSectionProps) {
  const { t } = useTranslation();

  const comparisonLabel = completionRateComparison
    ? t('statistics.comparisonPp', {
        delta: `${completionRateComparison.delta >= 0 ? '+' : ''}${
          completionRateComparison.delta
        }`,
        period: periodLabel,
      })
    : undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <KpiCard
        label={t('statistics.completionRateLabel')}
        value={
          completionRate.rate !== null
            ? `${completionRate.rate}%`
            : t('statistics.dash')
        }
        sublabel={t('statistics.ofTasks', {
          completed: completionRate.completedCount,
          due: completionRate.dueCount,
        })}
        comparisonLabel={comparisonLabel}
      />
      <KpiCard
        label={t('statistics.completedTasksLabel')}
        value={`${completedVsPlanned.completedCount} / ${completedVsPlanned.plannedCount}`}
      />
      <KpiCard
        label={t('statistics.unfinishedOverdueLabel')}
        value={String(unfinishedOverdue.overdueCount)}
        sublabel={t('statistics.olderThanWeek', {
          count: unfinishedOverdue.staleCount,
        })}
      />
      <KpiCard
        label={t('statistics.planningLoadLabel')}
        value={t('statistics.tasksPerDay', {
          count: planningLoad.averagePerActiveDay,
        })}
        sublabel={
          planningLoad.highestLoadDay
            ? t('statistics.busiestDay', {
                label: planningLoad.highestLoadDay.label,
                count: planningLoad.highestLoadDay.count,
              })
            : undefined
        }
      />
    </div>
  );
}
