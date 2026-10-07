import { useEffect, useState } from 'react';

export type ClockAngles = { hour: number; minute: number; second: number };

/** Hand angles, in degrees clockwise from 12 o'clock, for `date` in a zone. */
export function clockAngles(date: Date, timeZone: string): ClockAngles {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  const [hours, minutes, seconds] = [
    part('hour'),
    part('minute'),
    part('second'),
  ];
  return {
    hour: (hours % 12) * 30 + minutes * 0.5,
    minute: minutes * 6 + seconds * 0.1,
    second: seconds * 6,
  };
}

/**
 * The next angle for a hand that only ever turns clockwise. Without this a
 * hand going from 59 to 0 would spin all the way back round.
 */
export function advanceAngle(previous: number, next: number): number {
  const step = (((next - previous) % 360) + 360) % 360;
  return previous + step;
}

/** Hand angles for the current time in `timeZone`, updated every second. */
export function useClockAngles(timeZone: string): ClockAngles {
  const [angles, setAngles] = useState(() => clockAngles(new Date(), timeZone));

  useEffect(() => {
    const tick = () => {
      const next = clockAngles(new Date(), timeZone);
      setAngles((previous) => ({
        hour: advanceAngle(previous.hour, next.hour),
        minute: advanceAngle(previous.minute, next.minute),
        second: advanceAngle(previous.second, next.second),
      }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timeZone]);

  return angles;
}
