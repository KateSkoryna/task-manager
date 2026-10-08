import { ReactNode, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { TodoItem } from '@shared/types';
import Badge from '../elements/Badge';
import CompletionCheckbox from '../elements/CompletionCheckbox';
import { mergeClassNames } from '../../lib/classNames';
import { isCompleted } from '../../lib/todayTasks';
import { useFittingItemCount } from '../../hooks/useFittingItemCount';
import { useIsCompactScreen } from '../../hooks/useIsCompactScreen';
import { usePagedItems } from '../../hooks/usePagedItems';
import PageArrows from './PageArrows';
import { PRIORITY_BORDER } from './TaskCard';

interface TodayTaskBlockProps<T extends TodoItem> {
  title: string;
  icon: ReactNode;
  items: T[];
  emptyMessage?: string;
  /** Without it the rows have no completion checkbox. */
  onToggle?: (item: T) => void;
  onOpen: (item: T) => void;
  renderMeta?: (item: T) => ReactNode;
  /** Hide each row's priority badge; the row's left border still shows it. */
  hidePriority?: boolean;
  /**
   * Rows shown at a time, with previous/next arrows. `'fit'` shows as many
   * as the block's height allows; the block must then be given a height.
   */
  pageSize?: number | 'fit';
  className?: string;
  dataTestId: string;
}

// Ceiling for `pageSize="fit"`: the most rows ever rendered to be measured.
const MAX_FIT_PAGE_SIZE = 12;

function TodayTaskRow<T extends TodoItem>({
  item,
  onToggle,
  onOpen,
  meta,
  hidePriority,
  rowRef,
}: {
  item: T;
  onToggle?: (item: T) => void;
  onOpen: (item: T) => void;
  meta?: ReactNode;
  hidePriority?: boolean;
  rowRef?: Ref<HTMLLIElement>;
}) {
  const { t } = useTranslation();
  const completed = isCompleted(item);

  return (
    <li
      ref={rowRef}
      // A row has two controls. Focus on the name lights up the whole row,
      // like hover; focus on the checkbox shows only the checkbox's own ring,
      // so a keyboard user can tell which of the two Enter will act on.
      className={mergeClassNames(
        'flex items-center gap-3 rounded-inner border border-l-4 border-transparent bg-surface-subtle px-3 py-2 transition hover:border-priority-high-bg has-[[data-row-open]:focus-visible]:border-priority-high-bg motion-safe:hover:scale-[1.01] motion-safe:has-[[data-row-open]:focus-visible]:scale-[1.01]',
        PRIORITY_BORDER[item.priority]
      )}
      data-testid={`today-task-${item.id}`}
    >
      {onToggle && (
        <CompletionCheckbox
          completed={completed}
          label={t(
            completed
              ? 'dashboard.markNotCompleted'
              : 'dashboard.markCompleted',
            { name: item.name }
          )}
          onToggle={() => onToggle(item)}
        />
      )}
      <button
        type="button"
        data-row-open
        onClick={() => onOpen(item)}
        className={mergeClassNames(
          'min-w-0 flex-1 truncate text-left text-sm font-semibold focus-visible:outline-none',
          completed ? 'text-muted line-through' : 'text-primary'
        )}
      >
        {item.name}
      </button>
      {meta}
      {!hidePriority && (
        <Badge tone={`priority-${item.priority}`} className="shrink-0">
          {t(`tasks.priority_${item.priority}`)}
        </Badge>
      )}
    </li>
  );
}

function TodayTaskBlock<T extends TodoItem>({
  title,
  icon,
  items,
  emptyMessage,
  onToggle,
  onOpen,
  renderMeta,
  hidePriority,
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
        'flex flex-col rounded-xl border border-default bg-surface p-4',
        className
      )}
      data-testid={dataTestId}
    >
      <div
        className={mergeClassNames(
          'flex items-center gap-2 text-primary',
          // The fitted rows' container pulls up by 6px (-m-1.5), so the
          // title needs 6px more to keep the same gap as the other blocks.
          fits ? 'mb-[18px]' : 'mb-3'
        )}
      >
        {icon}
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-bold leading-none">{title}</h3>
          <span className="text-xs text-muted">{items.length}</span>
        </div>
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
                hidePriority={hidePriority}
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
