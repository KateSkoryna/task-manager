import { useId, useMemo, useRef, useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { ALL_TIMEZONES } from '@shared/types';
import { mergeClassNames } from '../../lib/classNames';

const MAX_VISIBLE_OPTIONS = 50;

type Props = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  invalid?: boolean;
  'data-testid'?: string;
};

/**
 * A searchable timezone combobox. Typing only filters the ~400 IANA zone
 * names shown below — it never commits directly, so the field can only ever
 * hold one of the listed zones, picked by clicking an option or pressing
 * Enter on the highlighted one. Built as a real combobox (not `<input
 * list>`) because the native datalist arrow this used to render isn't
 * stylable in current Chrome — hiding it via `::-webkit-list-button`/
 * `-webkit-appearance` has no effect there.
 */
function TimezoneField({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  invalid = false,
  'data-testid': dataTestId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listboxId = `${id || generatedId}-listbox`;
  const optionId = (index: number) => `${listboxId}-option-${index}`;

  const filteredOptions = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matches = search
      ? ALL_TIMEZONES.filter((zone) => zone.toLowerCase().includes(search))
      : ALL_TIMEZONES;
    return matches.slice(0, MAX_VISIBLE_OPTIONS);
  }, [query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(value);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open, value]);

  const openList = () => {
    setQuery(value);
    setOpen(true);
  };

  const closeWithoutSelecting = () => {
    setOpen(false);
    setQuery(value);
  };

  const selectOption = (zone: string) => {
    onChange(zone);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && filteredOptions.length > 0
            ? optionId(highlightedIndex)
            : undefined
        }
        aria-invalid={invalid}
        value={open ? query : value}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={openList}
        onBlur={() => {
          closeWithoutSelecting();
          onBlur?.();
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (!open) openList();
            else
              setHighlightedIndex((index) =>
                Math.min(index + 1, filteredOptions.length - 1)
              );
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (!open) openList();
            else setHighlightedIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter') {
            if (open && filteredOptions[highlightedIndex]) {
              event.preventDefault();
              selectOption(filteredOptions[highlightedIndex]);
            }
          } else if (event.key === 'Escape' && open) {
            event.preventDefault();
            closeWithoutSelecting();
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        data-testid={dataTestId}
        className={mergeClassNames(
          'w-full rounded-inner border-2 bg-surface-subtle px-3 py-2 pr-8 text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent',
          invalid ? 'border-danger' : 'border-default focus:border-accent'
        )}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => {
          if (open) closeWithoutSelecting();
          else openList();
          inputRef.current?.focus();
        }}
        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-muted"
      >
        <ChevronDown
          className={mergeClassNames(
            'h-4 w-4 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-inner border-2 border-default bg-surface p-0 shadow-menu"
        >
          {filteredOptions.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">No matches</li>
          )}
          {filteredOptions.map((zone, index) => (
            <li key={zone}>
              <button
                type="button"
                id={optionId(index)}
                role="option"
                aria-selected={index === highlightedIndex}
                onMouseEnter={() => setHighlightedIndex(index)}
                onMouseDown={(event) => {
                  // Prevent the input's blur (which would close the list
                  // before the click registers) from firing first.
                  event.preventDefault();
                }}
                onClick={() => selectOption(zone)}
                className={mergeClassNames(
                  'block w-full truncate px-3 py-2 text-left text-sm transition-colors',
                  index === highlightedIndex
                    ? 'bg-accent font-medium text-on-accent'
                    : 'text-primary hover:bg-surface-subtle'
                )}
              >
                {zone}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TimezoneField;
