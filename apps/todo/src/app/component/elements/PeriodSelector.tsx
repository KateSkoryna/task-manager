export interface PeriodSelectorOption<T extends string> {
  label: string;
  value: T;
}

interface PeriodSelectorProps<T extends string> {
  options: PeriodSelectorOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export default function PeriodSelector<T extends string>({
  options,
  value,
  onChange,
}: PeriodSelectorProps<T>) {
  const activeIndex = options.findIndex((option) => option.value === value);

  return (
    <div className="relative flex bg-surface border border-default rounded-lg p-1">
      <span
        className="absolute top-1 bottom-1 rounded-md bg-accent transition-transform duration-300 ease-in-out"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`relative z-10 w-16 py-1.5 rounded-md text-sm font-medium text-center transition-colors duration-300 ${
            value === option.value ? 'text-on-accent' : 'text-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
