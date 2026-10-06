import { mergeClassNames } from '../../lib/classNames';

/**
 * The app's tick mark, the same shape as `favicon.ico`: a short bar and a
 * long bar. Drawn in the accent colour on the dark sidebar colour so it
 * reads in both themes.
 */
function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={mergeClassNames(
        'shrink-0 rounded-control bg-sidebar fill-accent p-1.5',
        className
      )}
    >
      <rect
        x="-3.75"
        y="-3.75"
        width="7.5"
        height="7.5"
        rx="1.6"
        transform="translate(7.3 15.3) rotate(45)"
      />
      <rect
        x="-12.8"
        y="-4.1"
        width="25.6"
        height="8.2"
        rx="1.6"
        transform="translate(18.9 16.2) rotate(-45)"
      />
    </svg>
  );
}

export default AppLogo;
