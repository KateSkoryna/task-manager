import { useRef, useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';
import { mergeClassNames } from '../../lib/classNames';

// react-day-picker only accepts resolved CSS values for these custom
// properties, so its sizes stay literal px at this integration boundary;
// its colors read our theme tokens via the rgb(var(--color-x)) form.
// A day is 44px, but on a phone the picker is the width of the field (the
// field is a size container there), so a day shrinks to a seventh of the
// picker's inner width instead of making the page scroll sideways. Elsewhere
// there is no container, `cqw` falls back to the viewport and 44px wins.
const DAY_SIZE = 'min(44px, calc((100cqw - 2rem) / 7))';

const DAY_PICKER_STYLE: React.CSSProperties = {
  '--rdp-selected-border': 'none',
  '--rdp-day-width': DAY_SIZE,
  '--rdp-day-height': DAY_SIZE,
  '--rdp-day_button-width': DAY_SIZE,
  '--rdp-day_button-height': DAY_SIZE,
  '--rdp-accent-color': 'rgb(var(--color-accent))',
  '--rdp-nav_button-width': '32px',
  '--rdp-nav_button-height': '32px',
  fontSize: '13px',
} as React.CSSProperties;

type DatePickerInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
};

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  id,
  placeholder = 'Select date...',
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? dayjs(value).toDate() : undefined;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div
      className={mergeClassNames(
        'relative max-sm:[container-type:inline-size]',
        className
      )}
      ref={ref}
    >
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-2 py-2 rounded-inner border border-default bg-surface-subtle text-sm text-primary focus:border-accent focus:outline-none min-w-[10rem]"
      >
        <CalendarDays className="w-4 h-4 text-muted shrink-0" />
        <span className={selected ? 'text-primary' : 'text-muted'}>
          {selected ? dayjs(selected).format('DD/MM/YYYY') : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 flex sm:right-auto flex-col items-center rounded-inner border border-default bg-surface py-3 px-4 shadow-menu">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? dayjs(date).format('YYYY-MM-DD') : '');
              setOpen(false);
            }}
            weekStartsOn={1}
            navLayout="around"
            showOutsideDays
            style={DAY_PICKER_STYLE}
            modifiersClassNames={{
              selected:
                '[&>button]:!bg-accent [&>button]:!text-on-accent [&>button]:!border-0 [&>button]:!rounded-[0.5rem]',
              today: '[&>button]:!font-bold',
            }}
          />
          {selected && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-xs text-muted underline hover:text-primary"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DatePickerInput;
