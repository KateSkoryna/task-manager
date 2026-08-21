import { z } from 'zod';

export const REPORT_PERIODS = ['daily', 'weekly', 'monthly'] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const MAX_NARRATIVE_LENGTH = 2000;

/**
 * Every number in a report is computed deterministically from the database.
 * The model only phrases these; it never produces them.
 */
export const reportMetricsSchema = z.object({
  dueCount: z.number().int().min(0),
  completedCount: z.number().int().min(0),
  createdCount: z.number().int().min(0),
  overdueCount: z.number().int().min(0),
  /** Ratio of tasks completed to tasks due, or null when nothing was due. */
  completionRatio: z.number().min(0).max(1).nullable(),
  onTimeRate: z.number().min(0).max(1).nullable(),
  proactivityScore: z.number().min(0).max(100).nullable(),
});

export const reportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  period: z.enum(REPORT_PERIODS),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  metrics: reportMetricsSchema,
  narrative: z.string().trim().max(MAX_NARRATIVE_LENGTH),
  deliveredAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type ReportMetrics = z.infer<typeof reportMetricsSchema>;
export type Report = z.infer<typeof reportSchema>;

/**
 * A period with nothing due is neutral, never a failure. Callers use this to
 * decide between a score and an explicit "nothing was scheduled" outcome.
 */
export const isNeutralPeriod = (metrics: ReportMetrics): boolean =>
  metrics.dueCount === 0 && metrics.completedCount === 0;
