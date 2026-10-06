import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// `border-default` and `text-muted` nearly vanish on the dark surface, more
// so when disabled, so the arrows use the stronger border and text colours.
const BUTTON_CLASSES =
  'flex items-center justify-center rounded-md border border-muted p-1 text-primary transition-colors hover:border-primary disabled:pointer-events-none disabled:opacity-50';

interface PageArrowsProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** Keep the arrows on screen, disabled, when there is only one page. */
  alwaysVisible?: boolean;
}

/** Previous/next buttons for a block that shows one page of rows at a time. */
function PageArrows({
  page,
  pageCount,
  onChange,
  alwaysVisible = false,
}: PageArrowsProps) {
  const { t } = useTranslation();
  if (pageCount <= 1 && !alwaysVisible) return null;

  return (
    <div className="ml-auto flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 0}
        aria-label={t('dashboard.previousTasks')}
        className={BUTTON_CLASSES}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label={t('dashboard.nextTasks')}
        className={BUTTON_CLASSES}
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default PageArrows;
