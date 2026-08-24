/** Joins truthy class strings with a space, dropping falsy/empty ones. */
export function mergeClassNames(
  ...classes: Array<string | false | undefined | null>
) {
  return classes.filter(Boolean).join(' ');
}
