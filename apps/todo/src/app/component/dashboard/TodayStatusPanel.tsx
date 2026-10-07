import { useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mergeClassNames } from '../../lib/classNames';

// The donuts draw themselves in once per session. The page remounts every
// time the user comes back to it, and replaying the animation on each visit
// makes cached data look as if it were loading again.
let donutsHaveAnimated = false;

function DonutChart({
  value,
  total,
  color,
  label,
  animate,
}: {
  value: number;
  total: number;
  color: string;
  label: string;
  animate: boolean;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  const data = [{ value: pct }, { value: 100 - pct }];

  return (
    <div className="flex flex-col items-center gap-2">
      {/* The chart is one Tab stop: the library would otherwise make both
          its surface and the ring inside it focusable. The remaining focus
          outline is drawn round, in the palette's highlight colour. */}
      <div className="relative h-28 w-28 [&_svg:focus-visible]:outline [&_svg:focus-visible]:outline-2 [&_svg:focus-visible]:outline-priority-high-bg [&_svg]:rounded-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="64%"
              outerRadius="89%"
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
              isAnimationActive={animate}
              rootTabIndex={-1}
            >
              <Cell fill={color} />
              <Cell fill="rgb(var(--color-default))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <span className="absolute inset-0 flex items-center justify-center text-base font-bold text-primary">
          {pct}%
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: color }}
        />
        <span className="text-xs text-muted">{label}</span>
      </div>
    </div>
  );
}

interface TodayStatusPanelProps {
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
  className?: string;
}

function TodayStatusPanel({
  completed,
  inProgress,
  notStarted,
  total,
  className,
}: TodayStatusPanelProps) {
  const { t } = useTranslation();
  const animate = useRef(!donutsHaveAnimated).current;
  useEffect(() => {
    donutsHaveAnimated = true;
  }, []);

  return (
    <section
      className={mergeClassNames(
        'rounded-xl border border-default bg-surface p-4',
        className
      )}
      data-testid="today-status"
    >
      <div className="mb-3 flex items-center gap-2 text-primary">
        <ClipboardList className="h-5 w-5" />
        <h3 className="text-lg font-bold leading-none">
          {t('dashboard.todayStatus')}
        </h3>
      </div>
      <div className="flex flex-wrap items-center justify-around gap-4">
        <DonutChart
          value={completed}
          total={total}
          color="rgb(var(--color-status-complete))"
          animate={animate}
          label={t('dashboard.completed')}
        />
        <DonutChart
          value={inProgress}
          total={total}
          color="rgb(var(--color-status-progress))"
          animate={animate}
          label={t('dashboard.inProgress')}
        />
        <DonutChart
          value={notStarted}
          total={total}
          color="rgb(var(--color-status-open))"
          animate={animate}
          label={t('dashboard.notStarted')}
        />
      </div>
    </section>
  );
}

export default TodayStatusPanel;
