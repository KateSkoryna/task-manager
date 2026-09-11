import { useLayoutEffect, useRef, useState } from 'react';

interface FittingItemCount {
  containerRef: React.RefObject<HTMLDivElement>;
  itemRef: React.RefObject<HTMLDivElement>;
  count: number;
}

/**
 * Measures how many uniform-height items actually fit in a container's
 * available height, so a fixed-height panel shows as many rows as the
 * screen allows instead of a hardcoded number that clips on short screens
 * or wastes space on tall ones. Recomputes on resize via `ResizeObserver`.
 *
 * The caller renders up to `maxItems`, attaches `containerRef` to the
 * scrolling wrapper and `itemRef` to the first rendered item (so there's
 * always something to measure), then slices its list down to `count`.
 */
export const useFittingItemCount = (
  maxItems: number,
  gapPx = 8
): FittingItemCount => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(maxItems);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const recompute = () => {
      const itemHeight = itemRef.current?.offsetHeight;
      if (!itemHeight) return;
      const available = container.clientHeight;
      const fitting = Math.floor((available + gapPx) / (itemHeight + gapPx));
      setCount(Math.max(1, Math.min(maxItems, fitting)));
    };

    recompute();
    const observer = new ResizeObserver(recompute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [maxItems, gapPx]);

  return { containerRef, itemRef, count };
};
