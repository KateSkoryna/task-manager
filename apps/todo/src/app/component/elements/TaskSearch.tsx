import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHeaderTaskSearch } from '../../hooks/useHeaderTaskSearch';
import { mergeClassNames } from '../../lib/classNames';
import { moveOptionFocus } from '../../lib/listboxKeys';
import SearchInput from './SearchInput';

type TaskSearchProps = {
  inputTestId: string;
  className?: string;
};

/**
 * Task search box with its results dropdown. Picking a result opens that
 * task on the Tasks page. Rendered in the header on desktop and at the top
 * of the dashboard on smaller screens, where the header has no room for it.
 */
function TaskSearch({ inputTestId, className }: TaskSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { query, setQuery, status, matches, clear } = useHeaderTaskSearch();
  const containerRef = useRef<HTMLDivElement>(null);
  const isOpen = query.trim().length > 0;

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        clear();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={mergeClassNames('relative', className)}
      onKeyDown={(event) => {
        moveOptionFocus(event);
        if (event.key === 'Escape') {
          clear();
          containerRef.current?.querySelector('input')?.focus();
        }
      }}
    >
      <SearchInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('header.searchPlaceholder')}
        ariaLabel={t('header.search')}
        inputTestId={inputTestId}
      />

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('header.search')}
          className="absolute z-10 mt-1 w-full list-none overflow-hidden rounded-inner border-2 border-default bg-surface p-0 shadow-menu"
        >
          {status === 'loading' && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-muted">
              <Loader2 className="size-4 animate-spin" />
              {t('header.searchLoading')}
            </li>
          )}
          {status === 'error' && (
            <li className="px-3 py-2 text-sm text-danger">
              {t('header.searchError')}
            </li>
          )}
          {status === 'success' && matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">
              {t('header.searchNoResults')}
            </li>
          )}
          {status === 'success' &&
            matches.map((match) => (
              <li key={match.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    navigate('/tasks', {
                      state: { todoId: match.id, listId: match.todolistId },
                    });
                    clear();
                  }}
                  className="w-full truncate px-3 py-2 text-left text-sm text-primary hover:bg-surface-subtle focus:bg-surface-subtle focus:outline-none"
                >
                  {match.name}
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

export default TaskSearch;
