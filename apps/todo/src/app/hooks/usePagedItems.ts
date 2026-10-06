import { useState } from 'react';

interface PagedItems<T> {
  page: number;
  pageCount: number;
  pageItems: T[];
  setPage: (page: number) => void;
}

/**
 * Slices a list into pages for a block with previous/next arrows. The page
 * is clamped, so a list that shrinks (a task completed on the last page)
 * falls back to the new last page instead of showing an empty one.
 */
export function usePagedItems<T>(items: T[], pageSize: number): PagedItems<T> {
  const [requestedPage, setPage] = useState(0);
  const pageCount = Math.ceil(items.length / pageSize);
  const page = Math.min(requestedPage, Math.max(pageCount - 1, 0));
  const pageItems = items.slice(page * pageSize, (page + 1) * pageSize);
  return { page, pageCount, pageItems, setPage };
}
