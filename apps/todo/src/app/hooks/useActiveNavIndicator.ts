import {
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

export type NavIndicatorBox = {
  top: number;
  left: number;
  width: number;
  height: number;
};

/**
 * Where the active nav link sits inside `navRef`, so one highlight can slide
 * between links when the page changes. `animate` stays false for the first
 * placement so the highlight appears in place instead of sliding in.
 */
export function useActiveNavIndicator(navRef: RefObject<HTMLElement>) {
  const { pathname } = useLocation();
  const [box, setBox] = useState<NavIndicatorBox | null>(null);
  const [animate, setAnimate] = useState(false);

  const measure = useCallback(() => {
    const active = navRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]'
    );
    setBox(
      active
        ? {
            top: active.offsetTop,
            left: active.offsetLeft,
            width: active.offsetWidth,
            height: active.offsetHeight,
          }
        : null
    );
  }, [navRef]);

  useLayoutEffect(measure, [measure, pathname]);

  useEffect(() => {
    if (box) setAnimate(true);
  }, [box]);

  // The links resize when the sidebar changes width at a breakpoint.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [navRef, measure]);

  return { box, animate };
}
