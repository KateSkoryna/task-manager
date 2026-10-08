import { useEffect, useState } from 'react';

const QUERY = '(max-width: 49.9375rem)'; // below the md breakpoint (50rem) - mobile layout

export function useIsMobileScreen(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia(QUERY).matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const handleChange = () => setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
