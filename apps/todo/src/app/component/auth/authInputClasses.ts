// Icon padding and inner radius mirror the shared Input recipe; auth forms
// use raw <input> elements (not the Input component) for the icon-inset
// layout, so this stays a plain class string shared across Login/Register.
export const AUTH_INPUT_CLASS =
  'w-full pl-9 pr-4 py-3 rounded-inner border border-default bg-surface-subtle text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';
export const AUTH_PASSWORD_INPUT_CLASS =
  'w-full pl-9 pr-9 py-3 rounded-inner border border-default bg-surface-subtle text-primary placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent';
