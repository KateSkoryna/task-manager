import { buildTourSteps } from './tourSteps';

const setMenuOpen = jest.fn();
const build = () => buildTourSteps((key) => key, setMenuOpen);
const titles = () => build().map((step) => step.popover?.title);

function showOnScreen(html: string) {
  document.body.innerHTML = html;
  // jsdom has no layout, so pretend every element has a box on screen.
  jest
    .spyOn(Element.prototype, 'getClientRects')
    .mockReturnValue([{}] as unknown as DOMRectList);
}

afterEach(() => {
  document.body.innerHTML = '';
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('buildTourSteps', () => {
  it('points at each sidebar link when the sidebar is shown', () => {
    showOnScreen('<a data-tour="my-tasks-link"></a>');

    expect(titles()).toEqual([
      'onboarding.todayTitle',
      'onboarding.tasksTitle',
      'onboarding.statisticsTitle',
      'onboarding.settingsTitle',
      'onboarding.searchTitle',
      'onboarding.addTitle',
    ]);
  });

  it('adds a menu stop on phones, which have a menu button', () => {
    showOnScreen('<button data-testid="menu-button"></button>');

    expect(titles()).toEqual([
      'onboarding.todayTitle',
      'onboarding.menuTitle',
      'onboarding.tasksTitle',
      'onboarding.statisticsTitle',
      'onboarding.settingsTitle',
      'onboarding.searchTitle',
      'onboarding.addTitle',
    ]);
  });

  it('opens the menu leaving the menu stop and closes it after Settings', () => {
    showOnScreen('<button data-testid="menu-button"></button>');
    const steps = build();
    const driver = { moveNext: jest.fn(), movePrevious: jest.fn() };
    const opts = { driver } as never;
    const [, menu, tasks, , settings, search] = steps.map((s) => s.popover);

    menu?.onNextClick?.(undefined, steps[1], opts);
    expect(setMenuOpen).toHaveBeenLastCalledWith(true);
    expect(driver.moveNext).toHaveBeenCalledTimes(1);

    tasks?.onPrevClick?.(undefined, steps[2], opts);
    expect(setMenuOpen).toHaveBeenLastCalledWith(false);
    expect(driver.movePrevious).toHaveBeenCalledTimes(1);

    settings?.onNextClick?.(undefined, steps[4], opts);
    expect(setMenuOpen).toHaveBeenLastCalledWith(false);

    search?.onPrevClick?.(undefined, steps[5], opts);
    expect(setMenuOpen).toHaveBeenLastCalledWith(true);
  });

  it('never touches the menu between stops that do not need it', () => {
    showOnScreen('<a data-tour="my-tasks-link"></a>');
    const steps = build();

    expect(steps.every((s) => !s.popover?.onNextClick)).toBe(true);
    expect(steps.every((s) => !s.popover?.onPrevClick)).toBe(true);
  });
});
