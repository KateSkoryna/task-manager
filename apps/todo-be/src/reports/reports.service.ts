import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import {
  DEFAULT_TIMEZONE,
  MAX_NARRATIVE_ATTEMPTS,
  PaginatedResult,
  Report,
  ReportMetrics,
  ReportPeriod,
  endOfMonthInZone,
  endOfWeekInZone,
  endOfYearInZone,
  inZone,
  startOfMonthInZone,
  startOfWeekInZone,
  startOfYearInZone,
} from '@shared/types';
import { ITodoDocument, TODO_MODEL_NAME } from '../app/models/todo.model';
import {
  ITodolistDocument,
  TODOLIST_MODEL_NAME,
} from '../app/models/todoList.model';
import {
  IReportDocument,
  IReportTaskSnapshot,
  REPORT_MODEL_NAME,
} from '../app/models/report.model';
import { IUserDocument, USER_MODEL_NAME } from '../app/models/user.model';
import { executeOperation } from '../common/utils/execute-operation';
import { AgentService } from '../agent/agent.service';

interface PeriodBounds {
  start: Date;
  end: Date;
}

/** Mirrors Step 14.1's zone-aware helpers, one branch per report period. */
const periodBounds = (
  period: ReportPeriod,
  referenceDate: Date,
  zone: string
): PeriodBounds => {
  switch (period) {
    case 'weekly':
      return {
        start: startOfWeekInZone(referenceDate, zone),
        end: endOfWeekInZone(referenceDate, zone),
      };
    case 'monthly':
      return {
        start: startOfMonthInZone(referenceDate, zone),
        end: endOfMonthInZone(referenceDate, zone),
      };
    case 'yearly':
      return {
        start: startOfYearInZone(referenceDate, zone),
        end: endOfYearInZone(referenceDate, zone),
      };
  }
};

interface DueFacetRow {
  dueCount: number;
  onTimeCompletedCount: number;
  completedAmongDueCount: number;
}

interface CountFacetRow {
  count: number;
}

interface AggregateFacets {
  due: DueFacetRow[];
  created: CountFacetRow[];
  completed: CountFacetRow[];
}

const toReport = (doc: IReportDocument): Report => ({
  id: doc._id.toString(),
  userId: doc.userId.toString(),
  name: doc.name,
  period: doc.period,
  periodStart: doc.periodStart.toISOString(),
  periodEnd: doc.periodEnd.toISOString(),
  // `doc.metrics`/`doc.taskSnapshot` are Mongoose embedded subdocuments, not
  // plain objects - rebuild them explicitly rather than let callers compare
  // against their internal document machinery.
  metrics: {
    dueCount: doc.metrics.dueCount,
    completedCount: doc.metrics.completedCount,
    createdCount: doc.metrics.createdCount,
    overdueCount: doc.metrics.overdueCount,
    completionRatio: doc.metrics.completionRatio,
    onTimeRate: doc.metrics.onTimeRate,
    proactivityScore: doc.metrics.proactivityScore,
  },
  taskSnapshot: doc.taskSnapshot.map((task) => ({
    id: task.id,
    name: task.name,
    status: task.status,
    category: task.category,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
  })),
  narrative: doc.narrative,
  narrativeAttempts: doc.narrativeAttempts,
  deliveredAt: doc.deliveredAt ? doc.deliveredAt.toISOString() : null,
  createdAt: (doc as unknown as { createdAt: Date }).createdAt.toISOString(),
});

/** e.g. "Weekly report — Mar 16 – Mar 22, 2026", matching StatisticsPage's
 * range-label formatting so the two surfaces read consistently. */
const deriveReportName = (
  period: ReportPeriod,
  start: Date,
  end: Date,
  zone: string
): string => {
  const s = inZone(start, zone);
  const e = inZone(end, zone);
  const label = {
    weekly: 'Weekly report',
    monthly: 'Monthly report',
    yearly: 'Yearly report',
  }[period];

  switch (period) {
    case 'monthly':
      return `${label} — ${s.format('MMMM YYYY')}`;
    case 'yearly':
      return `${label} — ${s.format('YYYY')}`;
    case 'weekly':
    default:
      return `${label} — ${s.format('MMM D')} – ${e.format('MMM D, YYYY')}`;
  }
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(REPORT_MODEL_NAME)
    private readonly reportModel: Model<IReportDocument>,
    @InjectModel(TODO_MODEL_NAME)
    private readonly todoModel: Model<ITodoDocument>,
    @InjectModel(TODOLIST_MODEL_NAME)
    private readonly todolistModel: Model<ITodolistDocument>,
    @InjectModel(USER_MODEL_NAME)
    private readonly userModel: Model<IUserDocument>,
    private readonly agentService: AgentService
  ) {}

  /**
   * Idempotent: a period that already has a report returns it unchanged -
   * generating "again" never recomputes or duplicates. Called both by the
   * explicit "Generate Report" action and (Step 14.10) a schedule.
   */
  async generate(
    userId: string,
    period: ReportPeriod,
    referenceDate: Date
  ): Promise<Report> {
    return executeOperation('Error generating report', async () => {
      const user = await this.userModel.findById(userId);
      const zone = user?.preferences?.timezone || DEFAULT_TIMEZONE;
      const { start, end } = periodBounds(period, referenceDate, zone);
      const ownerId = new Types.ObjectId(userId);

      const existing = await this.reportModel.findOne({
        userId: ownerId,
        period,
        periodStart: start,
      });
      if (existing) return toReport(existing);

      const [metrics, taskSnapshot] = await Promise.all([
        this.computeMetrics(ownerId, start, end),
        this.buildSnapshot(ownerId, start, end),
      ]);
      const doc = await this.reportModel.findOneAndUpdate(
        { userId: ownerId, period, periodStart: start },
        {
          $setOnInsert: {
            userId: ownerId,
            name: deriveReportName(period, start, end, zone),
            period,
            periodStart: start,
            periodEnd: end,
            metrics,
            taskSnapshot,
            narrative: null,
            narrativeAttempts: 0,
            deliveredAt: null,
          },
        },
        { upsert: true, new: true }
      );
      return toReport(doc as IReportDocument);
    });
  }

  async list(
    userId: string,
    period: ReportPeriod,
    {
      limit,
      before,
      sort = 'desc',
    }: { limit: number; before?: Date; sort?: 'asc' | 'desc' }
  ): Promise<PaginatedResult<Report>> {
    return executeOperation('Error fetching reports', async () => {
      const filter: FilterQuery<IReportDocument> = {
        userId: new Types.ObjectId(userId),
        period,
      };
      const direction = sort === 'asc' ? 1 : -1;
      if (before) {
        filter.periodStart =
          direction === -1 ? { $lt: before } : { $gt: before };
      }

      const docs = await this.reportModel
        .find(filter)
        .sort({ periodStart: direction })
        .limit(limit + 1);

      const hasMore = docs.length > limit;
      const page = hasMore ? docs.slice(0, limit) : docs;
      return {
        items: page.map(toReport),
        nextCursor: hasMore
          ? page[page.length - 1].periodStart.toISOString()
          : null,
      };
    });
  }

  async findById(userId: string, id: string): Promise<Report | null> {
    return executeOperation('Error fetching report', async () => {
      const doc = await this.reportModel.findOne({
        _id: id,
        userId: new Types.ObjectId(userId),
      });
      return doc ? toReport(doc) : null;
    });
  }

  /**
   * Writes the AI narrative onto an already-generated report. The model
   * only phrases `doc.metrics` and the taskSnapshot's category/priority
   * breakdown - both already computed at generation time - it never
   * recomputes or overrides them.
   *
   * Capped at `MAX_NARRATIVE_ATTEMPTS` calls per report, so a stuck button,
   * a double click, or a second tab can't spam Gemini indefinitely. The
   * attempt is claimed atomically (a conditional `$inc`) *before* calling
   * Gemini, and counts even if that call then fails - each attempt already
   * cost a real API call, which is the thing being capped.
   */
  async generateNarrative(
    userId: string,
    id: string
  ): Promise<Report | null | 'limit_exceeded'> {
    const ownerId = new Types.ObjectId(userId);
    const claimed = await this.reportModel.findOneAndUpdate(
      {
        _id: id,
        userId: ownerId,
        narrativeAttempts: { $lt: MAX_NARRATIVE_ATTEMPTS },
      },
      { $inc: { narrativeAttempts: 1 } },
      { new: true }
    );
    if (!claimed) {
      const existing = await this.reportModel.findOne({
        _id: id,
        userId: ownerId,
      });
      return existing ? 'limit_exceeded' : null;
    }

    return executeOperation('Error generating report narrative', async () => {
      const categoryBreakdown: Record<string, number> = {};
      const priorityBreakdown: Record<string, number> = {};
      for (const task of claimed.taskSnapshot) {
        const category = task.category ?? 'uncategorized';
        categoryBreakdown[category] = (categoryBreakdown[category] ?? 0) + 1;
        priorityBreakdown[task.priority] =
          (priorityBreakdown[task.priority] ?? 0) + 1;
      }

      const narrative = await this.agentService.generateReportNarrative({
        periodLabel: claimed.period,
        metrics: {
          dueCount: claimed.metrics.dueCount,
          completedCount: claimed.metrics.completedCount,
          createdCount: claimed.metrics.createdCount,
          overdueCount: claimed.metrics.overdueCount,
          completionRatio: claimed.metrics.completionRatio,
          onTimeRate: claimed.metrics.onTimeRate,
          proactivityScore: claimed.metrics.proactivityScore,
        },
        categoryBreakdown,
        priorityBreakdown,
      });

      claimed.narrative = narrative;
      await claimed.save();
      return toReport(claimed);
    });
  }

  private async computeMetrics(
    userId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<ReportMetrics> {
    const [facets] = await this.todoModel.aggregate<AggregateFacets>([
      { $match: { userId } },
      {
        $facet: {
          due: [
            { $match: { dueDate: { $gte: periodStart, $lte: periodEnd } } },
            {
              $group: {
                _id: null,
                dueCount: { $sum: 1 },
                onTimeCompletedCount: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ['$status', 'successful'] },
                          { $ne: ['$completedAt', null] },
                          { $lte: ['$completedAt', '$dueDate'] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                completedAmongDueCount: {
                  $sum: { $cond: [{ $eq: ['$status', 'successful'] }, 1, 0] },
                },
              },
            },
          ],
          created: [
            {
              $match: { createdAt: { $gte: periodStart, $lte: periodEnd } },
            },
            { $count: 'count' },
          ],
          completed: [
            {
              $match: { completedAt: { $gte: periodStart, $lte: periodEnd } },
            },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const due = facets.due[0] ?? {
      dueCount: 0,
      onTimeCompletedCount: 0,
      completedAmongDueCount: 0,
    };
    const dueCount = due.dueCount;
    const overdueCount = dueCount - due.onTimeCompletedCount;
    const completionRatio =
      dueCount > 0 ? due.completedAmongDueCount / dueCount : null;
    const onTimeRate =
      dueCount > 0 ? due.onTimeCompletedCount / dueCount : null;
    /**
     * Weighted blend of on-time completion (60%) and raw completion (40%):
     * finishing late is still progress, but finishing on time is the
     * stronger signal of good planning, so it counts for more. Undefined
     * (null) whenever nothing was due, matching onTimeRate/completionRatio.
     */
    const proactivityScore =
      onTimeRate !== null && completionRatio !== null
        ? Math.round(100 * (0.6 * onTimeRate + 0.4 * completionRatio))
        : null;

    return {
      dueCount,
      completedCount: facets.completed[0]?.count ?? 0,
      createdCount: facets.created[0]?.count ?? 0,
      overdueCount,
      completionRatio,
      onTimeRate,
      proactivityScore,
    };
  }

  /**
   * Freezes the fields Phase 13's chart functions read for every task due,
   * created, or completed in the period - so a report never needs to
   * re-query live `Todo`/`Todolist` data again once generated.
   */
  private async buildSnapshot(
    userId: Types.ObjectId,
    periodStart: Date,
    periodEnd: Date
  ): Promise<IReportTaskSnapshot[]> {
    const inRange = { $gte: periodStart, $lte: periodEnd };
    const todos = await this.todoModel.find({
      userId,
      $or: [
        { dueDate: inRange },
        { createdAt: inRange },
        { completedAt: inRange },
      ],
    });

    const listIds = [
      ...new Set(
        todos
          .filter((todo) => todo.todolistId)
          .map((todo) => todo.todolistId!.toString())
      ),
    ];
    const lists = listIds.length
      ? await this.todolistModel.find(
          { _id: { $in: listIds } },
          { category: 1 }
        )
      : [];
    const categoryByListId = new Map(
      lists.map((list) => [list._id.toString(), list.category ?? null])
    );

    return todos.map((todo) => ({
      id: todo._id.toString(),
      name: todo.name,
      status: todo.status,
      category: todo.todolistId
        ? categoryByListId.get(todo.todolistId.toString()) ?? null
        : null,
      priority: todo.priority,
      dueDate: todo.dueDate ?? null,
      completedAt: todo.completedAt ?? null,
      createdAt: (todo as unknown as { createdAt: Date }).createdAt,
    }));
  }
}
