import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { REPORT_PERIODS, ReportMetrics, ReportPeriod } from '@shared/types';

export interface IReportDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  period: ReportPeriod;
  periodStart: Date;
  periodEnd: Date;
  metrics: ReportMetrics;
  narrative: string;
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

export const REPORT_MODEL_NAME = 'Report';
export const reportSchema = new Schema<IReportDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: {
      type: String,
      enum: REPORT_PERIODS as unknown as string[],
      required: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    metrics: { type: metricsSchema, required: true },
    narrative: { type: String, default: '' },
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
