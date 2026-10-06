import type { KeyboardEvent } from 'react';

/**
 * Arrow-key movement for a dropdown: put it on the element that wraps both
 * the trigger (an input or a button) and the `role="option"` items. Down
 * from the trigger lands on the first option, and the ends wrap around.
 */
export function moveOptionFocus(event: KeyboardEvent<HTMLElement>): void {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  const options = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')
  );
  if (options.length === 0) return;
  event.preventDefault();
  const current = options.indexOf(document.activeElement as HTMLElement);
  const step = event.key === 'ArrowDown' ? 1 : -1;
  const next =
    current === -1 && step === -1
      ? options.length - 1
      : (current + step + options.length) % options.length;
  options[next]?.focus();
}
