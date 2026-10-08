// Loaded only when a tour is about to show, so users who have already seen
// it never download the library or its stylesheet.
export async function loadDriver() {
  const [{ driver }] = await Promise.all([
    import('driver.js'),
    import('driver.js/dist/driver.css'),
  ]);
  return driver;
}
