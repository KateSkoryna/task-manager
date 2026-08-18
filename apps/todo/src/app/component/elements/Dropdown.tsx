import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

type AccessibleName =
  | { ariaLabel: string; ariaLabelledby?: never }
  | { ariaLabel?: never; ariaLabelledby: string };

type DropdownProps<T extends string> = AccessibleName & {
  id?: string;
  value: T | null;
  onChange: (value: T | null) => void;
  options: DropdownOption<T>[];
  placeholder: string;
  nullOption?: { label: string; icon?: React.ReactNode };
  className?: string;
  menuClassName?: string;
  optionClassName?: string;
  fixedPosition?: boolean;
  'data-testid'?: string;
};

function Dropdown<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  ariaLabelledby,
  nullOption,
  className,
  menuClassName,
  optionClassName,
  fixedPosition = false,
  'data-testid': dataTestId,
}: DropdownProps<T>) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const generatedId = useId();
  const summaryId = id ?? `dropdown-${generatedId}`;
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const entries: Array<{
    value: T | null;
    label: string;
    icon?: React.ReactNode;
  }> = nullOption ? [{ value: null, ...nullOption }, ...options] : options;
  const selected = entries.find((entry) => entry.value === value);

  const updateMenuPosition = () => {
    if (!fixedPosition || !summaryRef.current) return;
    const rect = summaryRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  const close = (restoreFocus = false) => {
    if (detailsRef.current) detailsRef.current.open = false;
    setOpen(false);
    setMenuPosition(null);
    if (restoreFocus) summaryRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!detailsRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  return (
    <details
      ref={detailsRef}
      className="group relative"
      onToggle={(event) => {
        const isOpen = event.currentTarget.open;
        setOpen(isOpen);
        if (isOpen) updateMenuPosition();
        else setMenuPosition(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && event.currentTarget.open) {
          event.preventDefault();
          close(true);
        }
      }}
    >
      <summary
        ref={summaryRef}
        id={summaryId}
        data-testid={dataTestId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={
          className ??
          'flex w-full cursor-pointer list-none items-center justify-between rounded-lg border-2 border-secondary-bg bg-base-bg px-3 py-2 text-dark-bg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent [&::-webkit-details-marker]:hidden'
        }
      >
        <span
          className={`flex min-w-0 items-center gap-1.5 truncate ${
            selected ? 'text-dark-bg' : 'text-secondary-dark-bg'
          }`}
        >
          {selected?.icon}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-secondary-dark-bg transition-transform group-open:rotate-180" />
      </summary>

      {open && (
        <ul
          style={
            fixedPosition && menuPosition
              ? {
                  position: 'fixed',
                  top: menuPosition.top,
                  left: menuPosition.left,
                  minWidth: menuPosition.width,
                }
              : undefined
          }
          className={
            menuClassName ??
            `${
              fixedPosition
                ? 'z-50 w-max max-w-[220px]'
                : 'absolute z-10 mt-1 w-full'
            } list-none overflow-hidden rounded-lg border-2 border-secondary-bg bg-base-bg p-0 shadow-lg`
          }
        >
          {entries.map((entry) => {
            const isSelected = entry.value === value;
            return (
              <li key={entry.value ?? '__null__'}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => {
                    onChange(entry.value);
                    close(true);
                  }}
                  className={`flex w-full items-center gap-1.5 text-left transition-colors ${
                    optionClassName ?? 'px-3 py-2 text-sm'
                  } ${
                    isSelected
                      ? 'bg-secondary-bg font-medium text-dark-bg'
                      : 'text-dark-bg hover:bg-secondary-bg focus:bg-secondary-bg focus:outline-none'
                  }`}
                >
                  {entry.icon}
                  <span className="truncate">{entry.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}

export default Dropdown;
