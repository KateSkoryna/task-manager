import { ReactNode, Ref } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem } from '@shared/types';
import Badge from '../elements/Badge';
import { mergeClassNames } from '../../lib/classNames';
import { isCompleted } from '../../lib/todayTasks';
import { useFittingItemCount } from '../../hooks/useFittingItemCount';
import { useIsCompactScreen } from '../../hooks/useIsCompactScreen';
import { usePagedItems } from '../../hooks/usePagedItems';
import PageArrows from './PageArrows';
import { PRIORITY_BORDER } from './TaskCard';

type Tone = 'neutral' | 'danger';

interface TodayTaskBlockProps<T extends TodoItem> {
  title: string;
  icon: ReactNode;
  items: T[];
  tone?: Tone;
  emptyMessage?: string;
  onToggle: (item: T) => void;
  onOpen: (item: T) => void;
  renderMeta?: (item: T) => ReactNode;
  /**
   * Rows shown at a time, with previous/next arrows. `'fit'` shows as many
   * as the block's height allows; the block must then be given a height.
   */
  pageSize?: number | 'fit';
  className?: string;
  dataTestId: string;
}

const BLOCK_CLASSES: Record<Tone, string> = {
  neutral: 'border-default bg-surface',
  danger: 'border-danger/30 border-l-4 border-l-danger bg-danger/10',
};

const TITLE_CLASSES: Record<Tone, string> = {
  neutral: 'text-primary',
  danger: 'text-danger',
};

// Ceiling for `pageSize="fit"`: the most rows ever rendered to be measured.
const MAX_FIT_PAGE_SIZE = 12;

function TodayTaskRow<T extends TodoItem>({
  item,
  onToggle,
  onOpen,
  meta,
  rowRef,
}: {
  item: T;
  onToggle: (item: T) => void;
  onOpen: (item: T) => void;
  meta?: ReactNode;
  rowRef?: Ref<HTMLLIElement>;
}) {
  const { t } = useTranslation();
  const completed = isCompleted(item);

  return (
    <li
      ref={rowRef}
      className={mergeClassNames(
        'flex items-center gap-3 rounded-inner border border-l-4 border-transparent bg-surface-subtle px-3 py-2 transition hover:border-priority-high-bg motion-safe:hover:scale-[1.01]',
        PRIORITY_BORDER[item.priority]
      )}
      data-testid={`today-task-${item.id}`}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={t(
          completed ? 'dashboard.markNotCompleted' : 'dashboard.markCompleted',
          { name: item.name }
        )}
        onClick={() => onToggle(item)}
        className={mergeClassNames(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          completed
            ? 'border-status-complete bg-status-complete'
            : 'border-muted hover:border-primary'
        )}
      >
        {completed && (
          <Check className="h-3.5 w-3.5 text-surface" strokeWidth={3} />
        )}
      </button>
      <button
        type="button"
        onClick={() => onOpen(item)}
        className={mergeClassNames(
          'min-w-0 flex-1 truncate text-left text-sm font-semibold hover:underline',
          completed ? 'text-muted line-through' : 'text-primary'
        )}
      >
        {item.name}
      </button>
      {meta}
      <Badge tone={`priority-${item.priority}`} className="shrink-0">
        {t(`tasks.priority_${item.priority}`)}
      </Badge>
    </li>
  );
}

function TodayTaskBlock<T extends TodoItem>({
  title,
  icon,
  items,
  tone = 'neutral',
  emptyMessage,
  onToggle,
  onOpen,
  renderMeta,
  pageSize,
  className,
  dataTestId,
}: TodayTaskBlockProps<T>) {
  const isCompact = useIsCompactScreen();
  const {
    containerRef,
    itemRef,
    count: fittingCount,
  } = useFittingItemCount<HTMLDivElement, HTMLLIElement>(MAX_FIT_PAGE_SIZE);
  // On mobile and tablet the page scrolls anyway, so a fitted block shows
  // every row instead of paging.
  const fits = pageSize === 'fit' && !isCompact;
  const allRows = Math.max(items.length, 1);
  const fixedSize = typeof pageSize === 'number' ? pageSize : allRows;
  const size = fits ? fittingCount : fixedSize;
  const { page, pageCount, pageItems, setPage } = usePagedItems(items, size);

  return (
    <section
      className={mergeClassNames(
        'flex flex-col rounded-xl border p-4',
        BLOCK_CLASSES[tone],
        className
      )}
      data-testid={dataTestId}
    >
      <div
        className={mergeClassNames(
          'mb-3 flex items-center gap-2',
          TITLE_CLASSES[tone]
        )}
      >
        {icon}
        <h3 className="text-lg font-bold leading-none">{title}</h3>
        <span className="text-xs text-muted">{items.length}</span>
        <PageArrows page={page} pageCount={pageCount} onChange={setPage} />
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted/60">{emptyMessage}</p>
      ) : (
        // Side padding leaves room for the hover scale. There is none top or
        // bottom, so the measured height is exactly the space rows can use;
        // the negative margin borrows a little of the block's own padding.
        <div
          ref={containerRef}
          className={
            fits ? '-m-1.5 min-h-0 flex-1 overflow-hidden px-1.5' : undefined
          }
        >
          <ul className="flex flex-col gap-2">
            {pageItems.map((item, index) => (
              <TodayTaskRow
                key={item.id}
                item={item}
                onToggle={onToggle}
                onOpen={onOpen}
                meta={renderMeta?.(item)}
                rowRef={index === 0 ? itemRef : undefined}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export default TodayTaskBlock;
