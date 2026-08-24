import React from 'react';
import { mergeClassNames } from '../../lib/classNames';

type InputProps = {
  type?: string;
  name?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  id?: string;
  inputTestId?: string;
  labelTestId?: string;
  checked?: boolean;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  invalid?: boolean;
  ariaLabel?: string;
};

// Used only when a caller omits className; callers supplying their own
// className keep full control, unchanged from before.
const DEFAULT_INPUT_CLASSES =
  'w-full rounded-inner border border-default bg-surface-subtle px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-60';
const INVALID_INPUT_CLASSES =
  'border-danger focus:border-danger focus:ring-danger';

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      name,
      value,
      onChange,
      className,
      placeholder = '',
      label,
      id,
      inputTestId,
      labelTestId,
      checked,
      onBlur,
      onKeyDown,
      invalid = false,
      ariaLabel,
    },
    ref
  ) => {
    const resolvedClassName = mergeClassNames(
      className || DEFAULT_INPUT_CLASSES,
      invalid && INVALID_INPUT_CLASSES
    );
    return (
      <>
        {label && (
          <label
            className="block text-sm font-medium text-primary mb-1"
            data-testid={labelTestId}
            htmlFor={id}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={resolvedClassName}
          placeholder={placeholder}
          data-testid={inputTestId}
          checked={checked}
          onKeyDown={onKeyDown}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
        />
      </>
    );
  }
);

Input.displayName = 'Input';

export default Input;
