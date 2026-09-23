import { Schema, model, models, Document, Model, Types } from 'mongoose';
import {
  MAX_NARRATIVE_ITEMS,
  REPORT_PERIODS,
  ReportMetrics,
  ReportNarrative,
  ReportPeriod,
  TodoListCategory,
  TodoPriority,
  TodoStatus,
} from '@shared/types';

/**
 * The embedded snapshot's dates are real `Date`s at the document layer,
 * unlike `ReportTaskSnapshot` (its `@shared/types` counterpart), whose dates
 * are ISO strings for the wire format - `ReportsService` converts between
 * the two.
 */
export interface IReportTaskSnapshot {
  id: string;
  name: string;
  status: TodoStatus;
  category: TodoListCategory | null;
  priority: TodoPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface IReportDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  period: ReportPeriod;
  periodStart: Date;
  periodEnd: Date;
  metrics: ReportMetrics;
  taskSnapshot: IReportTaskSnapshot[];
  narrative: ReportNarrative | null;
  narrativeAttempts: number;
  deliveredAt: Date | null;
}

const metricsSchema = new Schema<ReportMetrics>(
  {
    dueCount: { type: Number, required: true, min: 0 },
    completedCount: { type: Number, required: true, min: 0 },
    createdCount: { type: Number, required: true, min: 0 },
    overdueCount: { type: Number, required: true, min: 0 },
    completionRatio: { type: Number, min: 0, max: 1, default: null },
    onTimeRate: { type: Number, min: 0, max: 1, default: null },
    proactivityScore: { type: Number, min: 0, max: 100, default: null },
  },
  { _id: false }
);

const taskSnapshotSchema = new Schema<IReportTaskSnapshot>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed'],
      required: true,
    },
    category: {
      type: String,
      // `null` must be listed explicitly - Mongoose's enum validator
      // rejects it otherwise, even with `default: null`. This only ever
      // surfaced via `doc.save()` (full validation runs there), never via
      // `findOneAndUpdate`'s upsert in `generate()` (skips validators by
      // default) - so an uncategorized task in the snapshot silently
      // inserted fine but crashed the first `.save()` afterward, e.g. when
      // writing the AI narrative onto an already-generated report.
      enum: ['home', 'education', 'work', 'family', 'health', null],
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    dueDate: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const reportNarrativeSchema = new Schema<ReportNarrative>(
  {
    summary: { type: String, required: true },
    problems: {
      type: [String],
      default: [],
      validate: (v: string[]) => v.length <= MAX_NARRATIVE_ITEMS,
    },
    reasoning: {
      type: [String],
      default: [],
      validate: (v: string[]) => v.length <= MAX_NARRATIVE_ITEMS,
    },
    tips: {
      type: [String],
      default: [],
      validate: (v: string[]) => v.length <= MAX_NARRATIVE_ITEMS,
    },
  },
  { _id: false }
);

export const REPORT_MODEL_NAME = 'Report';
export const reportSchema = new Schema<IReportDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    period: {
      type: String,
      enum: REPORT_PERIODS as unknown as string[],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    metrics: { type: metricsSchema, required: true },
    taskSnapshot: { type: [taskSnapshotSchema], default: [] },
    narrative: { type: reportNarrativeSchema, default: null },
    narrativeAttempts: { type: Number, required: true, default: 0, min: 0 },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * The idempotency guarantee for report generation. A second attempt at the same
 * period fails with a duplicate-key error, which callers treat as success —
 * this is enforced by the database rather than by a check-then-write race.
 */
reportSchema.index({ userId: 1, period: 1, periodStart: 1 }, { unique: true });

/** Supports the reports list page, newest first. */
reportSchema.index({ userId: 1, periodStart: -1 });

export const Report =
  (models[REPORT_MODEL_NAME] as Model<IReportDocument>) ||
  model<IReportDocument>(REPORT_MODEL_NAME, reportSchema);
