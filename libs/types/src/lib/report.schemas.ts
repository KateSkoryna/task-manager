import { z } from 'zod';

export const REPORT_PERIODS = ['weekly', 'monthly', 'yearly'] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export const MAX_NARRATIVE_SUMMARY_LENGTH = 300;
export const MAX_NARRATIVE_ITEM_LENGTH = 200;
export const MAX_NARRATIVE_ITEMS = 5;

/** How many times "Get/Regenerate AI insights" may call Gemini for one report. */
export const MAX_NARRATIVE_ATTEMPTS = 2;

/**
 * A lightweight, frozen copy of one task as it existed at report generation
 * time - only the fields the Statistics charts (Phase 13) actually read.
 * Editing or deleting the source task afterward never changes this.
 */
export const reportTaskSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['pending', 'successful', 'failed']),
  category: z
    .enum(['home', 'education', 'work', 'family', 'health'])
    .nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type ReportTaskSnapshot = z.infer<typeof reportTaskSnapshotSchema>;

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

/**
 * The AI narrative for one report, broken into sections instead of one
 * paragraph so the UI can render it as headed bullet lists. Every number
 * referenced inside it was computed deterministically before the model ever
 * saw it - the model only phrases and groups them.
 */
export const reportNarrativeSchema = z.object({
  summary: z.string().trim().min(1).max(MAX_NARRATIVE_SUMMARY_LENGTH),
  problems: z
    .array(z.string().trim().min(1).max(MAX_NARRATIVE_ITEM_LENGTH))
    .max(MAX_NARRATIVE_ITEMS),
  reasoning: z
    .array(z.string().trim().min(1).max(MAX_NARRATIVE_ITEM_LENGTH))
    .max(MAX_NARRATIVE_ITEMS),
  tips: z
    .array(z.string().trim().min(1).max(MAX_NARRATIVE_ITEM_LENGTH))
    .max(MAX_NARRATIVE_ITEMS),
});
export type ReportNarrative = z.infer<typeof reportNarrativeSchema>;

export const reportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  period: z.enum(REPORT_PERIODS),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  metrics: reportMetricsSchema,
  taskSnapshot: z.array(reportTaskSnapshotSchema),
  narrative: reportNarrativeSchema.nullable(),
  /** Number of times AI-insight generation has been attempted; capped at `MAX_NARRATIVE_ATTEMPTS`. */
  narrativeAttempts: z.number().int().min(0),
  deliveredAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export type ReportMetrics = z.infer<typeof reportMetricsSchema>;
export type Report = z.infer<typeof reportSchema>;

export const generateReportSchema = z.object({
  period: z.enum(REPORT_PERIODS),
  /** Defaults to now on the server when omitted. */
  referenceDate: z.string().datetime().optional(),
});
export type GenerateReportInput = z.infer<typeof generateReportSchema>;

/**
 * A period with nothing due is neutral, never a failure. Callers use this to
 * decide between a score and an explicit "nothing was scheduled" outcome.
 */
export const isNeutralPeriod = (metrics: ReportMetrics): boolean =>
  metrics.dueCount === 0 && metrics.completedCount === 0;

/**
 * The AI narrative endpoint's structured Gemini output. Same shape as
 * `reportNarrativeSchema` - kept as a separate alias so the endpoint
 * contract can be read independently of the storage schema.
 */
export const reportNarrativeResponseSchema = reportNarrativeSchema;
export type ReportNarrativeResponse = ReportNarrative;
