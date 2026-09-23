import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { ReportPeriod } from '@shared/types';
import Container from '../elements/Container';
import PeriodSelector from '../elements/PeriodSelector';
import SearchInput from '../elements/SearchInput';
import IconButton from '../elements/IconButton';
import { useReportsQuery } from '../../fetchers/api';

const PERIOD_OPTIONS: ReportPeriod[] = ['weekly', 'monthly', 'yearly'];

export default function ReportsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<ReportPeriod>('weekly');
  const [sort, setSort] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReportsQuery(period, sort);

  const reports = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return reports;
    return reports.filter((report) =>
      (report.name ?? '').toLowerCase().includes(query)
    );
  }, [reports, search]);

  return (
    <Container className="space-y-6 pt-6">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('reports.searchPlaceholder')}
          ariaLabel={t('reports.searchPlaceholder')}
          className="flex-1 max-w-md"
        />
        <IconButton
          ariaLabel={
            sort === 'desc' ? t('reports.sortOldest') : t('reports.sortNewest')
          }
          onClick={() => setSort((s) => (s === 'desc' ? 'asc' : 'desc'))}
        >
          {sort === 'desc' ? (
            <ArrowDownAZ size={18} />
          ) : (
            <ArrowUpAZ size={18} />
          )}
        </IconButton>
        <div className="ml-auto">
          <PeriodSelector
            options={PERIOD_OPTIONS.map((value) => ({
              label: t(`reports.${value}`),
              value,
            }))}
            value={period}
            onChange={setPeriod}
            ariaLabel={t('reports.title')}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-primary">{t('reports.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted">{t('reports.noData')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-default shadow-card">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 bg-surface-subtle px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
            <span>{t('reports.columnName')}</span>
            <span>{t('reports.columnDate')}</span>
            <span>{t('reports.columnPeriod')}</span>
          </div>
          <ul className="divide-y divide-default">
            {filtered.map((report) => (
              <li key={report.id}>
                <Link
                  to={`/reports/${report.id}`}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-surface px-4 py-3 hover:bg-surface-subtle transition-colors"
                >
                  <span className="text-sm font-semibold text-primary truncate">
                    {report.name || t('reports.untitled')}
                  </span>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-muted uppercase tracking-wider whitespace-nowrap">
                    {t(`reports.${report.period}`)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
        >
          {isFetchingNextPage ? t('reports.loading') : t('reports.loadMore')}
        </button>
      )}
    </Container>
  );
}
