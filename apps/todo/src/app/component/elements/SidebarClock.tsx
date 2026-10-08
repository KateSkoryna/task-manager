import { useTranslation } from 'react-i18next';
import { detectTimezone } from '@shared/types';
import { usePreferences } from '../../hooks/usePreferences';
import { useClockAngles } from '../../hooks/useClockAngles';
import { mergeClassNames } from '../../lib/classNames';

// Angles of the hour lines drawn across the face. Each line marks two hours,
// so six lines give all twelve; the 12-6 and 3-9 lines are the heavier ones.
const MARKINGS = [0, 30, 60, 90, 120, 150];

// The raised rim: a light edge on one side and a dark one on the other, built
// from the sidebar's own text colour and a plain shadow.
const RIM_SHADOW =
  'shadow-[3px_-3px_4px_0_rgb(var(--color-sidebar-text)/0.12),-3px_5px_6px_0_rgb(0_0_0/0.35),inset_-2px_3px_4px_0_rgb(0_0_0/0.35),inset_2px_-2px_1px_0_rgb(var(--color-sidebar-text)/0.08)]';

// A hand lies along the 9 o'clock line and turns about the face's centre, so
// 12 o'clock is a quarter turn on.
const handStyle = (angle: number) => ({
  transform: `translateY(-50%) rotate(${angle + 90}deg)`,
});

const HAND_CLASSES =
  'absolute right-1/2 top-1/2 origin-right rounded-full transition-transform duration-200 ease-out motion-reduce:transition-none';

type SidebarClockProps = {
  className?: string;
};

/** Analog clock showing the time in the timezone from the user's settings. */
function SidebarClock({ className }: SidebarClockProps) {
  const { t, i18n } = useTranslation();
  const { preferences } = usePreferences();
  // 'UTC' is the stored default for a user who has not picked a timezone yet,
  // so the browser's zone is the better guess, as on the Settings page.
  const timeZone =
    !preferences || preferences.timezone === 'UTC'
      ? detectTimezone()
      : preferences.timezone;
  const angles = useClockAngles(timeZone);

  const time = new Intl.DateTimeFormat(i18n.language, {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date());

  return (
    <div
      role="img"
      aria-label={t('nav.clock', { time })}
      data-testid="sidebar-clock"
      className={mergeClassNames(
        'relative mx-auto size-[min(80cqw,80cqh)] shrink-0 rounded-2xl border-2 border-sidebar p-1.5 md:border-4 md:p-2',
        RIM_SHADOW,
        className
      )}
    >
      <div className="relative size-full overflow-hidden rounded-xl">
        {MARKINGS.map((angle) => (
          <span
            key={angle}
            className={mergeClassNames(
              'absolute left-1/2 top-0 h-full',
              angle % 90 === 0
                ? 'w-0.5 bg-sidebar-muted'
                : 'w-px bg-sidebar-text/30'
            )}
            style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
          />
        ))}
      </div>
      {/* Covers the middle of the lines, leaving only the marks at the rim. */}
      <div className="absolute inset-[16%] rounded-lg bg-sidebar">
        <span
          className={mergeClassNames(
            HAND_CLASSES,
            'h-1 w-[30%] bg-sidebar-muted md:h-1.5'
          )}
          style={handStyle(angles.hour)}
        />
        <span
          className={mergeClassNames(
            HAND_CLASSES,
            'h-0.5 w-[45%] bg-sidebar-muted md:h-1'
          )}
          style={handStyle(angles.minute)}
        />
        <span
          className={mergeClassNames(
            HAND_CLASSES,
            'h-px w-[45%] bg-sidebar-text md:h-0.5'
          )}
          style={handStyle(angles.second)}
          data-testid="sidebar-clock-second-hand"
        />
        <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 md:size-3 -translate-y-1/2 rounded-full bg-sidebar-muted" />
      </div>
    </div>
  );
}

export default SidebarClock;
