import {
  DEFAULT_USER_PREFERENCES,
  isNeutralPeriod,
  parsedTaskSchema,
  todoCreateSchema,
  todoUpdateSchema,
  userPreferencesSchema,
  userPreferencesUpdateSchema,
} from '@shared/types';

describe('user preferences', () => {
  it('defaults to UTC, no reports, and AI consent off', () => {
    expect(DEFAULT_USER_PREFERENCES).toEqual({
      timezone: 'UTC',
      locale: 'en',
      reportCadence: 'off',
      deliveryHour: 9,
      tone: 'neutral',
      aiConsent: false,
    });
  });

  it('rejects a timezone that is not an IANA identifier', () => {
    const result = userPreferencesSchema.safeParse({
      timezone: 'Europe/Atlantis',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a real IANA identifier', () => {
    const result = userPreferencesSchema.safeParse({
      timezone: 'Europe/Berlin',
    });

    expect(result.success).toBe(true);
  });

  it.each([-1, 24, 9.5])('rejects the delivery hour %p', (deliveryHour) => {
    expect(userPreferencesSchema.safeParse({ deliveryHour }).success).toBe(
      false
    );
  });

  it('rejects an empty update', () => {
    expect(userPreferencesUpdateSchema.safeParse({}).success).toBe(false);
  });
});

describe('todo priority and source', () => {
  it('accepts a priority on create', () => {
    const result = todoCreateSchema.safeParse({
      name: 'Call the bank',
      priority: 'high',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an unknown priority', () => {
    expect(
      todoCreateSchema.safeParse({ name: 'Task', priority: 'urgent' }).success
    ).toBe(false);
  });

  it('does not let a client set the source on create', () => {
    const result = todoCreateSchema.safeParse({
      name: 'Task',
      source: 'telegram',
    });

    expect(result.success).toBe(true);
    expect(result.success && 'source' in result.data).toBe(false);
  });

  it('does not let a client change the source on update', () => {
    const result = todoUpdateSchema.safeParse({ source: 'telegram' });

    expect(result.success).toBe(false);
  });
});

describe('parsed task output', () => {
  it('fills defaults for a minimal task', () => {
    const result = parsedTaskSchema.parse({ name: 'Buy milk' });

    expect(result).toEqual({
      name: 'Buy milk',
      dueDate: null,
      priority: 'medium',
      notes: null,
      ambiguous: false,
    });
  });

  it('rejects unknown fields so model output cannot smuggle data through', () => {
    const result = parsedTaskSchema.safeParse({
      name: 'Buy milk',
      userId: 'someone-else',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a due date that is not a calendar date', () => {
    expect(
      parsedTaskSchema.safeParse({ name: 'Task', dueDate: 'tomorrow' }).success
    ).toBe(false);
  });
});

describe('isNeutralPeriod', () => {
  const metrics = {
    dueCount: 0,
    completedCount: 0,
    createdCount: 0,
    overdueCount: 0,
    completionRatio: null,
    onTimeRate: null,
    proactivityScore: null,
  };

  it('treats a period with nothing due and nothing done as neutral', () => {
    expect(isNeutralPeriod(metrics)).toBe(true);
  });

  it('is not neutral once something was due', () => {
    expect(isNeutralPeriod({ ...metrics, dueCount: 3 })).toBe(false);
  });

  it('is not neutral when work happened outside the due set', () => {
    expect(isNeutralPeriod({ ...metrics, completedCount: 1 })).toBe(false);
  });
});
