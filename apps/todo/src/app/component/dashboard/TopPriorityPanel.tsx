import { Flame } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem } from '@shared/types';
import { usePagedItems } from '../../hooks/usePagedItems';
import PageArrows from './PageArrows';
import TaskCard from './TaskCard';

const PAGE_SIZE = 3;

interface TopPriorityPanelProps {
  items: TodoItem[];
  onOpen: (item: TodoItem) => void;
}

/** High-priority tasks due today, three at a time. */
function TopPriorityPanel({ items, onOpen }: TopPriorityPanelProps) {
  const { t } = useTranslation();
  const { page, pageCount, pageItems, setPage } = usePagedItems(
    items.filter((item) => item.priority === 'high'),
    PAGE_SIZE
  );

  return (
    <section
      className="rounded-xl border border-default bg-surface p-4"
      data-testid="today-top-priority"
    >
      <div className="mb-3 flex items-center gap-2 text-primary">
        <Flame className="h-5 w-5" />
        <h3 className="text-lg font-bold leading-none">
          {t('dashboard.topPriority')}
        </h3>
        <PageArrows
          page={page}
          pageCount={pageCount}
          onChange={setPage}
          alwaysVisible
        />
      </div>
      {pageItems.length === 0 ? (
        <p className="text-sm text-muted/60">{t('dashboard.noTopPriority')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {pageItems.map((item) => (
            <TaskCard key={item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}
    </section>
  );
}

export default TopPriorityPanel;
