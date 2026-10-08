import type { DriveStep, DriverHook } from 'driver.js';

type Translate = (key: string) => string;

/** Opens or closes the phone navigation drawer, and has rendered it on return. */
export type SetMenuOpen = (isOpen: boolean) => void;

/** Router state that asks the Today page to run the tour again. */
export const REPLAY_TOUR_STATE = { replayTour: true };

type TourStop = {
  key: string;
  /** Tried in order; the first one that is on screen is pointed at. */
  selector: string;
  /** Only shown with the sidebar ('sidebar') or without it ('phone'). */
  layout?: 'sidebar' | 'phone';
  /** On phones this link sits inside the drawer, which has to be open. */
  inMenu?: boolean;
};

const MENU_BUTTON = '[data-testid="menu-button"]';

// "Add task" stays last, so the tour ends on the first thing to do.
const TOUR_STOPS: TourStop[] = [
  { key: 'today', selector: '[data-testid="today-header"]' },
  // Phones hide the sidebar behind this button; Next opens the drawer.
  { key: 'menu', selector: MENU_BUTTON, layout: 'phone' },
  { key: 'tasks', selector: '[data-tour="my-tasks-link"]', inMenu: true },
  {
    key: 'statistics',
    selector: '[data-tour="statistics-link"]',
    inMenu: true,
  },
  { key: 'settings', selector: '[data-tour="settings-link"]', inMenu: true },
  {
    key: 'search',
    selector: '[data-testid="header-search"], [data-testid="dashboard-search"]',
  },
  { key: 'add', selector: '[data-testid="today-add-task-button"]' },
];

// A hidden element has no box to point at. Returning nothing makes the
// popover appear in the middle of the screen.
function findVisible(selector: string): Element | undefined {
  return Array.from(document.querySelectorAll(selector)).find(
    (element) => element.getClientRects().length > 0
  );
}

/** Switches the drawer first, so the next stop's target is on screen. */
const moveWithMenu =
  (
    setMenuOpen: SetMenuOpen,
    isOpen: boolean,
    direction: 'moveNext' | 'movePrevious'
  ): DriverHook =>
  (_element, _step, { driver }) => {
    setMenuOpen(isOpen);
    driver[direction]();
  };

export function buildTourSteps(
  t: Translate,
  setMenuOpen: SetMenuOpen
): DriveStep[] {
  // The menu button only exists below the tablet breakpoint.
  const isPhone = Boolean(findVisible(MENU_BUTTON));
  const stops = TOUR_STOPS.filter(
    (stop) => !stop.layout || (stop.layout === 'phone') === isPhone
  );
  const needsMenu = (stop?: TourStop) => isPhone && Boolean(stop?.inMenu);

  return stops.map((stop, index) => {
    const previous = stops[index - 1];
    const next = stops[index + 1];
    const open = needsMenu(stop);

    return {
      element: () => findVisible(stop.selector) as Element,
      popover: {
        title: t(`onboarding.${stop.key}Title`),
        description: t(`onboarding.${stop.key}Description`),
        ...(next &&
          needsMenu(next) !== open && {
            onNextClick: moveWithMenu(setMenuOpen, needsMenu(next), 'moveNext'),
          }),
        ...(previous &&
          needsMenu(previous) !== open && {
            onPrevClick: moveWithMenu(
              setMenuOpen,
              needsMenu(previous),
              'movePrevious'
            ),
          }),
      },
    };
  });
}
