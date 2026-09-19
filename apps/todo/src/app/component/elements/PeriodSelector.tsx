import { ReactNode, useLayoutEffect, useRef, useState } from 'react';

export interface PeriodSelectorOption<T extends string> {
  label: string;
  value: T;
  icon?: ReactNode;
}

interface PeriodSelectorProps<T extends string> {
  options: PeriodSelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export default function PeriodSelector<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: PeriodSelectorProps<T>) {
  const activeIndex = options.findIndex((option) => option.value === value);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [highlight, setHighlight] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  useLayoutEffect(() => {
    const activeButton = buttonRefs.current[activeIndex];
    if (activeButton) {
      setHighlight({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      });
    }
  }, [activeIndex, options]);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="relative flex bg-surface border border-default rounded-lg p-1"
    >
      <span
        className="absolute top-1 bottom-1 rounded-md bg-accent transition-all duration-300 ease-in-out"
        style={{ left: highlight.left, width: highlight.width }}
      />
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(el) => (buttonRefs.current[index] = el)}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`relative z-10 flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md text-sm font-medium text-center whitespace-nowrap transition-colors duration-300 ${
            value === option.value ? 'text-on-accent' : 'text-primary'
          }`}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
