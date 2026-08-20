import { z } from 'zod';

import { DEFAULT_TIMEZONE, isValidTimezone } from './datetime';

export const REPORT_CADENCES = ['daily', 'weekly', 'monthly', 'off'] as const;
export const REPORT_TONES = ['neutral', 'encouraging', 'direct'] as const;
export const SUPPORTED_LOCALES = ['en', 'de', 'uk'] as const;

export type ReportCadence = (typeof REPORT_CADENCES)[number];
export type ReportTone = (typeof REPORT_TONES)[number];
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const MIN_DELIVERY_HOUR = 0;
export const MAX_DELIVERY_HOUR = 23;

export const timezoneSchema = z
  .string()
  .trim()
  .refine(isValidTimezone, 'Must be a valid IANA timezone identifier');

/**
 * Hour of the day, in the user's own timezone, at which reports are delivered.
 */
export const deliveryHourSchema = z
  .number()
  .int()
  .min(MIN_DELIVERY_HOUR)
  .max(MAX_DELIVERY_HOUR);

/**
 * Field shapes without defaults. The update schema is built from these so a
 * partial parse cannot silently materialise a full set of preferences.
 */
const preferenceFields = {
  timezone: timezoneSchema,
  locale: z.enum(SUPPORTED_LOCALES),
  reportCadence: z.enum(REPORT_CADENCES),
  deliveryHour: deliveryHourSchema,
  tone: z.enum(REPORT_TONES),
  /**
   * Explicit opt-in for sending anything to an external model. Defaults to
   * off, and every Gemini call in the agent is gated on it.
   */
  aiConsent: z.boolean(),
};

export const userPreferencesSchema = z.object({
  timezone: preferenceFields.timezone.default(DEFAULT_TIMEZONE),
  locale: preferenceFields.locale.default('en'),
  reportCadence: preferenceFields.reportCadence.default('off'),
  deliveryHour: preferenceFields.deliveryHour.default(9),
  tone: preferenceFields.tone.default('neutral'),
  aiConsent: preferenceFields.aiConsent.default(false),
});

export const userPreferencesUpdateSchema = z
  .object(preferenceFields)
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field is required'
  );

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type UserPreferencesUpdate = z.infer<typeof userPreferencesUpdateSchema>;

export const DEFAULT_USER_PREFERENCES: UserPreferences =
  userPreferencesSchema.parse({});
