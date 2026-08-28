import { useRef, useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { CalendarDays } from 'lucide-react';
import dayjs from 'dayjs';

// react-day-picker only accepts resolved CSS values for these custom
// properties, so its sizes stay literal px at this integration boundary;
// its colors read our theme tokens via the rgb(var(--color-x)) form.
const DAY_PICKER_STYLE: React.CSSProperties = {
  '--rdp-selected-border': 'none',
  '--rdp-day-width': '44px',
  '--rdp-day-height': '44px',
  '--rdp-day_button-width': '44px',
  '--rdp-day_button-height': '44px',
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
};

const DatePickerInput: React.FC<DatePickerInputProps> = ({
  value,
  onChange,
  id,
  placeholder = 'Select date...',
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
    <div className="relative" ref={ref}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-2 py-2 rounded-inner border border-default bg-surface-subtle text-sm text-primary focus:border-accent focus:outline-none min-w-[10rem]"
      >
        <CalendarDays className="w-4 h-4 text-muted shrink-0" />
        <span className={selected ? 'text-primary' : 'text-muted'}>
          {selected ? dayjs(selected).format('DD/MM/YYYY') : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 flex flex-col items-center rounded-inner border border-default bg-surface py-3 px-4 shadow-menu">
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
