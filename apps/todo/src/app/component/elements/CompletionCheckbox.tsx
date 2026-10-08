import { Check } from 'lucide-react';
import { mergeClassNames } from '../../lib/classNames';

interface CompletionCheckboxProps {
  completed: boolean;
  /** Names the task and the action, e.g. "Mark Buy milk as completed". */
  label: string;
  onToggle: () => void;
}

/** Square check that completes a task, or undoes it, in one click. */
function CompletionCheckbox({
  completed,
  label,
  onToggle,
}: CompletionCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={completed}
      aria-label={label}
      // The control often sits inside something clickable or keyboard
      // operable, such as a task card that opens on click or Enter.
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      className={mergeClassNames(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-priority-high-bg',
        completed
          ? 'border-status-complete bg-status-complete'
          : 'border-muted hover:border-primary'
      )}
    >
      {completed && (
        <Check className="h-3.5 w-3.5 text-surface" strokeWidth={3} />
      )}
    </button>
  );
}

export default CompletionCheckbox;
