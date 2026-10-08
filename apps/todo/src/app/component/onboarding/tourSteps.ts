import type { DriveStep } from 'driver.js';

type Translate = (key: string) => string;

/** Router state that asks the Today page to run the tour again. */
export const REPLAY_TOUR_STATE = { replayTour: true };

type TourStop = {
  key: string;
  /** Tried in order; the first one that is on screen is pointed at. */
  selector: string;
};

// "Add task" stays last, so the tour ends on the first thing to do.
const TOUR_STOPS: TourStop[] = [
  { key: 'today', selector: '[data-testid="today-header"]' },
  { key: 'tasks', selector: '[data-tour="my-tasks-link"]' },
  { key: 'statistics', selector: '[data-tour="statistics-link"]' },
  { key: 'settings', selector: '[data-tour="settings-link"]' },
  {
    key: 'search',
    selector: '[data-testid="header-search"], [data-testid="dashboard-search"]',
  },
  { key: 'add', selector: '[data-testid="today-add-task-button"]' },
];

// The sidebar is hidden on phones, and a hidden element has no box to point
// at. Returning nothing makes the popover appear in the middle of the screen.
function findVisible(selector: string): Element | undefined {
  return Array.from(document.querySelectorAll(selector)).find(
    (element) => element.getClientRects().length > 0
  );
}

export function buildTourSteps(t: Translate): DriveStep[] {
  return TOUR_STOPS.map(({ key, selector }) => ({
    element: () => findVisible(selector) as Element,
    popover: {
      title: t(`onboarding.${key}Title`),
      description: t(`onboarding.${key}Description`),
    },
  }));
}
