import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AgentService } from '../../agent/agent.service';
import { Report } from '../models/report.model';
import { UserModel } from '../models/user.model';
import { createNestTestApplication } from '../nest-test-app';

const auth = (token = 'token-a') => ({ Authorization: `Bearer ${token}` });

const testMetrics = {
  dueCount: 4,
  completedCount: 3,
  createdCount: 5,
  overdueCount: 1,
  completionRatio: 0.75,
  onTimeRate: 0.5,
  proactivityScore: 65,
};

describe('Report narrative endpoint', () => {
  let app: INestApplication;
  let generateReportNarrativeMock: jest.Mock;
  let userId: string;
  let reportId: string;

  beforeAll(async () => {
    generateReportNarrativeMock = jest.fn();
    app = await createNestTestApplication((builder) =>
      builder
        .overrideProvider(AgentService)
        .useValue({ generateReportNarrative: generateReportNarrativeMock })
    );
  });

  afterAll(async () => app.close());

  beforeEach(async () => {
    generateReportNarrativeMock.mockClear();
    const user = await UserModel.create({
      firebaseUid: 'firebase-a',
      email: 'a@example.com',
      displayName: 'User A',
      firstName: 'User',
      lastName: 'A',
      preferences: { aiConsent: true },
    });
    userId = user._id.toString();

    const report = await Report.create({
      userId: user._id,
      name: 'Weekly report — Mar 16 – Mar 22, 2026',
      period: 'weekly',
      periodStart: new Date('2026-03-16T00:00:00.000Z'),
      periodEnd: new Date('2026-03-22T23:59:59.999Z'),
      metrics: testMetrics,
      taskSnapshot: [
        {
          id: 't1',
          name: 'Buy groceries',
          status: 'successful',
          category: 'home',
          priority: 'high',
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
        },
        // Uncategorized (inbox) task - a real-world shape the fix for
        // `taskSnapshotSchema.category`'s enum must keep accepting on save.
        {
          id: 't2',
          name: 'Inbox task',
          status: 'pending',
          category: null,
          priority: 'medium',
          createdAt: new Date('2026-03-16T00:00:00.000Z'),
        },
      ],
    });
    reportId = report._id.toString();
  });

  it('writes the AI narrative onto the report and returns it', async () => {
    const narrative = {
      summary: 'You completed 3 of 4 due tasks this week.',
      problems: ['1 task overdue in Home'],
      reasoning: ['Home tasks are due earlier in the week than others'],
      tips: ['Tackle Home tasks earlier in the week'],
    };
    generateReportNarrativeMock.mockResolvedValue(narrative);

    const response = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/${reportId}/narrative`)
      .set(auth());

    expect(response.status).toBe(201);
    expect(response.body.narrative).toEqual(narrative);
    expect(generateReportNarrativeMock).toHaveBeenCalledWith({
      periodLabel: 'weekly',
      metrics: testMetrics,
      categoryBreakdown: { home: 1, uncategorized: 1 },
      priorityBreakdown: { high: 1, medium: 1 },
    });

    const stored = await Report.findById(reportId);
    expect(stored?.narrative?.summary).toBe(narrative.summary);
    expect(stored?.narrativeAttempts).toBe(1);
  });

  it('caps generation at 2 attempts per report, even mixing a failed call', async () => {
    generateReportNarrativeMock
      .mockRejectedValueOnce(new Error('upstream unavailable'))
      .mockResolvedValueOnce({
        summary: 'Second attempt succeeded.',
        problems: [],
        reasoning: [],
        tips: ['Keep it up'],
      });

    const first = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/${reportId}/narrative`)
      .set(auth());
    expect(first.status).toBe(500);

    const second = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/${reportId}/narrative`)
      .set(auth());
    expect(second.status).toBe(201);
    expect(second.body.narrative.summary).toBe('Second attempt succeeded.');

    const third = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/${reportId}/narrative`)
      .set(auth());
    expect(third.status).toBe(429);
    expect(third.body.code).toBe('narrative_limit_exceeded');
    // The failed first call already claimed its attempt - only 2 Gemini
    // calls happen total, never a 3rd.
    expect(generateReportNarrativeMock).toHaveBeenCalledTimes(2);

    const stored = await Report.findById(reportId);
    expect(stored?.narrativeAttempts).toBe(2);
  });

  it('rejects with 403 when the user has not enabled AI consent', async () => {
    await UserModel.updateOne(
      { _id: userId },
      { 'preferences.aiConsent': false }
    );

    const response = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/${reportId}/narrative`)
      .set(auth());

    expect(response.status).toBe(403);
    expect(generateReportNarrativeMock).not.toHaveBeenCalled();
  });

  it('returns 404 for a nonexistent report', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/000000000000000000000000/narrative`)
      .set(auth());

    expect(response.status).toBe(404);
  });

  it("rejects a request for another user's report", async () => {
    await UserModel.create({
      firebaseUid: 'firebase-b',
      email: 'b@example.com',
      displayName: 'User B',
      firstName: 'User',
      lastName: 'B',
      preferences: { aiConsent: true },
    });

    const response = await request(app.getHttpServer())
      .post(`/api/users/${userId}/reports/${reportId}/narrative`)
      .set(auth('token-b'));

    expect(response.status).toBe(403);
    expect(generateReportNarrativeMock).not.toHaveBeenCalled();
  });
});
