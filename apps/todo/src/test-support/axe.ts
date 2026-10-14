import { configureAxe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// `region` wants every element inside a landmark, which only holds for a
// whole page, not for one page component rendered on its own.
const axe = configureAxe({ rules: { region: { enabled: false } } });

export async function expectNoAxeViolations(container: HTMLElement) {
  expect(await axe(container)).toHaveNoViolations();
}
