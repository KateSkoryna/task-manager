import { useMemo } from 'react';

// The workspace TS lib target predates ES2022.Intl; `Intl.supportedValuesOf`
// is a real, widely-supported runtime API (Node 18+, all evergreen browsers).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    function supportedValuesOf(key: string): string[];
  }
}

const TIMEZONE_OPTIONS = Intl.supportedValuesOf('timeZone');
export const TIMEZONE_DATALIST_ID = 'settings-timezone-options';

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
 * A searchable timezone picker backed by a native `<datalist>` rather than a
 * free-text box — typing filters the list, but the browser still exposes it
 * as a standard, fully keyboard-operable text input.
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
  const options = useMemo(() => TIMEZONE_OPTIONS, []);

  return (
    <>
      <input
        id={id}
        type="text"
        list={TIMEZONE_DATALIST_ID}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete="off"
        aria-invalid={invalid}
        data-testid={dataTestId}
        className={`flex-1 px-3 py-2 rounded-lg border-2 bg-white text-dark-bg placeholder-secondary-dark-bg focus:outline-none focus:ring-2 focus:ring-accent ${
          invalid ? 'border-red-500' : 'border-secondary-bg focus:border-accent'
        }`}
      />
      <datalist id={TIMEZONE_DATALIST_ID}>
        {options.map((zone) => (
          <option key={zone} value={zone} />
        ))}
      </datalist>
    </>
  );
}

export default TimezoneField;
