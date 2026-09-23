require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) =>
      ({
        'todoForm.todoName': 'Todo name',
        'todoForm.add': 'Add',
        'todoForm.addPlaceholder': 'Add a task',
        'todoForm.moreOptions': 'More options',
        'todoForm.hideOptions': 'Hide options',
        'todoForm.location': 'Location',
        'todoForm.notes': 'Notes',
        'todoForm.locationPlaceholder': 'Location',
        'todoForm.notesPlaceholder': 'Notes',
        'todoList.addTask': 'Add task',
        'error.title': 'Something went wrong',
        'error.tryAgain': 'Try again',
      }[key] || key),
    i18n: { language: 'en', changeLanguage: () => Promise.resolve() },
  }),
}));
if (!global.ResizeObserver)
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
// jsdom implements no layout, so it has no real scrolling and doesn't
// define this at all — every test that selects a task would otherwise
// throw on the scroll-into-view effect (TasksPage/VitalTaskPage), not just
// the ones actually asserting on it.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}
if (!global.matchMedia)
  global.matchMedia = () => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
