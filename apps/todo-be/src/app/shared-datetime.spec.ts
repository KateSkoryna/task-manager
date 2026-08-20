import {
  DEFAULT_TIMEZONE,
  dayKeyInZone,
  endOfDayInZone,
  hourInZone,
  isSameDayInZone,
  isValidTimezone,
  startOfDayInZone,
} from '@shared/types';

describe('isValidTimezone', () => {
  it.each(['UTC', 'Europe/Berlin', 'Pacific/Kiritimati'])(
    'accepts the IANA zone %s',
    (zone) => {
      expect(isValidTimezone(zone)).toBe(true);
    }
  );

  it.each(['', 'Europe/Atlantis', 'CEST', 'not a zone'])(
    'rejects %p',
    (zone) => {
      expect(isValidTimezone(zone)).toBe(false);
    }
  );
});

describe('day boundaries', () => {
  it('resolves midnight in the requested zone, not the host zone', () => {
    // 22:30 UTC on 1 March is already 2 March in Tokyo.
    const instant = '2026-03-01T22:30:00.000Z';

    expect(startOfDayInZone(instant, 'Asia/Tokyo').toISOString()).toBe(
      '2026-03-01T15:00:00.000Z'
    );
    expect(startOfDayInZone(instant, 'UTC').toISOString()).toBe(
      '2026-03-01T00:00:00.000Z'
    );
  });

  it('ends the day one millisecond before the next starts', () => {
    const end = endOfDayInZone('2026-03-01T12:00:00.000Z', 'Europe/Berlin');
    const nextStart = startOfDayInZone(
      '2026-03-02T12:00:00.000Z',
      'Europe/Berlin'
    );

    expect(nextStart.getTime() - end.getTime()).toBe(1);
  });

  it('keeps a 23-hour day across the spring DST transition', () => {
    // Central European clocks jump 02:00 -> 03:00 on 29 March 2026.
    const start = startOfDayInZone('2026-03-29T10:00:00.000Z', 'Europe/Berlin');
    const end = endOfDayInZone('2026-03-29T10:00:00.000Z', 'Europe/Berlin');
    const hours = (end.getTime() - start.getTime() + 1) / 3_600_000;

    expect(hours).toBe(23);
  });

  it('keeps a 25-hour day across the autumn DST transition', () => {
    const start = startOfDayInZone('2026-10-25T10:00:00.000Z', 'Europe/Berlin');
    const end = endOfDayInZone('2026-10-25T10:00:00.000Z', 'Europe/Berlin');
    const hours = (end.getTime() - start.getTime() + 1) / 3_600_000;

    expect(hours).toBe(25);
  });

  it('falls back to UTC for an unknown zone rather than throwing', () => {
    expect(
      startOfDayInZone('2026-03-01T22:30:00.000Z', 'Europe/Atlantis')
    ).toEqual(startOfDayInZone('2026-03-01T22:30:00.000Z', DEFAULT_TIMEZONE));
  });
});

describe('hourInZone', () => {
  it('reports the local hour used to trigger report delivery', () => {
    const instant = '2026-06-01T05:00:00.000Z';

    expect(hourInZone(instant, 'UTC')).toBe(5);
    expect(hourInZone(instant, 'Europe/Berlin')).toBe(7);
    expect(hourInZone(instant, 'America/New_York')).toBe(1);
  });
});

describe('calendar day comparison', () => {
  it('treats one instant as different days in different zones', () => {
    const instant = '2026-03-01T22:30:00.000Z';

    expect(dayKeyInZone(instant, 'UTC')).toBe('2026-03-01');
    expect(dayKeyInZone(instant, 'Asia/Tokyo')).toBe('2026-03-02');
  });

  it('matches two instants inside the same local day', () => {
    expect(
      isSameDayInZone(
        '2026-03-01T23:00:00.000Z',
        '2026-03-02T05:00:00.000Z',
        'Asia/Tokyo'
      )
    ).toBe(true);
  });
});
