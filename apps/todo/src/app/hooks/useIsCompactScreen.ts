import { useEffect, useState } from 'react';

const QUERY = '(max-width: 63.9375rem)'; // below the lg breakpoint (64rem) — mobile + tablet

export function useIsCompactScreen(): boolean {
  const [isCompact, setIsCompact] = useState(
    () => window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const handleChange = () => setIsCompact(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isCompact;
}
