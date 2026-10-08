import { useEffect, useState } from 'react';

const QUERY = '(max-width: 79.9375rem)'; // below the xl breakpoint (80rem) — phones and tablets

export function useIsBelowXlScreen(): boolean {
  const [isBelowXl, setIsBelowXl] = useState(
    () => window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const handleChange = () => setIsBelowXl(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isBelowXl;
}
