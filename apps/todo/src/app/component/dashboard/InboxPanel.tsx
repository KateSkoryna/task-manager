import { Inbox as InboxIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TodoItem } from '@shared/types';
import { usePagedItems } from '../../hooks/usePagedItems';
import PageArrows from './PageArrows';
import TaskCard from './TaskCard';

const PAGE_SIZE = 3;

interface InboxPanelProps {
  items: TodoItem[];
  onOpen: (item: TodoItem) => void;
}

// Inbox tasks have no list, so no other block on the page says where they
// went. Read-only: adding and editing happen on the Tasks page.
function InboxPanel({ items, onOpen }: InboxPanelProps) {
  const { t } = useTranslation();
  const { page, pageCount, pageItems, setPage } = usePagedItems(
    items,
    PAGE_SIZE
  );

  return (
    <section
      className="rounded-xl border border-default bg-surface p-4"
      data-testid="dashboard-inbox-section"
    >
      <div className="flex items-center gap-2 text-primary">
        <InboxIcon className="h-5 w-5" />
        <div className="flex items-baseline gap-2">
          <h3 className="text-lg font-bold leading-none">
            {t('dashboard.inboxTitle')}
          </h3>
          <span className="text-xs font-semibold text-notification-dot">
            {items.length}
          </span>
        </div>
        <PageArrows
          page={page}
          pageCount={pageCount}
          onChange={setPage}
          alwaysVisible
        />
      </div>
      <p className="mb-3 mt-1 text-xs text-muted">{t('dashboard.inboxHint')}</p>
      {pageItems.length === 0 ? (
        <p className="text-sm text-muted/60">{t('dashboard.inboxEmpty')}</p>
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

export default InboxPanel;
