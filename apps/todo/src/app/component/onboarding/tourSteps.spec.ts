import { buildTourSteps } from './tourSteps';

const build = () => buildTourSteps((key) => key);

afterEach(() => {
  document.body.innerHTML = '';
  jest.restoreAllMocks();
});

describe('buildTourSteps', () => {
  it('has the same stops on every screen size', () => {
    expect(build().map((step) => step.popover?.title)).toEqual([
      'onboarding.todayTitle',
      'onboarding.tasksTitle',
      'onboarding.statisticsTitle',
      'onboarding.settingsTitle',
      'onboarding.searchTitle',
      'onboarding.addTitle',
    ]);
  });

  it('points at the first visible match for a stop', () => {
    document.body.innerHTML =
      '<a id="hidden" data-tour="my-tasks-link"></a><a id="shown" data-tour="my-tasks-link"></a>';
    jest
      .spyOn(Element.prototype, 'getClientRects')
      .mockImplementation(function (this: Element) {
        return (this.id === 'shown' ? [{}] : []) as unknown as DOMRectList;
      });

    const element = build()[1].element as () => Element;
    expect(element().id).toBe('shown');
  });
});
