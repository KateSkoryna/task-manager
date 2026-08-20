import {
  isNotificationSupported,
  requestNotificationPermission,
  showOsNotification,
} from './pomodoroNotifications';

class MockNotification {
  static permission: NotificationPermission = 'default';
  static requestPermission = jest.fn().mockResolvedValue('granted');
  static instances: { title: string; body?: string }[] = [];

  constructor(title: string, options?: { body?: string }) {
    MockNotification.instances.push({ title, body: options?.body });
  }
}

describe('pomodoroNotifications', () => {
  afterEach(() => {
    jest.clearAllMocks();
    MockNotification.permission = 'default';
    MockNotification.instances = [];
    delete (global as { Notification?: unknown }).Notification;
  });

  test('isNotificationSupported is false when the Notification API is unavailable', () => {
    expect(isNotificationSupported()).toBe(false);
  });

  test('isNotificationSupported is true when the Notification API exists', () => {
    (global as { Notification?: unknown }).Notification = MockNotification;
    expect(isNotificationSupported()).toBe(true);
  });

  test('requestNotificationPermission does nothing when unsupported', () => {
    expect(() => requestNotificationPermission()).not.toThrow();
  });

  test('requestNotificationPermission asks only when permission is still default', () => {
    (global as { Notification?: unknown }).Notification = MockNotification;
    requestNotificationPermission();
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);

    MockNotification.permission = 'granted';
    requestNotificationPermission();
    expect(MockNotification.requestPermission).toHaveBeenCalledTimes(1);
  });

  test('showOsNotification returns false when unsupported', () => {
    expect(showOsNotification('title', 'body')).toBe(false);
  });

  test('showOsNotification returns false when permission is not granted', () => {
    (global as { Notification?: unknown }).Notification = MockNotification;
    MockNotification.permission = 'denied';
    expect(showOsNotification('title', 'body')).toBe(false);
    expect(MockNotification.instances).toHaveLength(0);
  });

  test('showOsNotification creates a notification and returns true when granted', () => {
    (global as { Notification?: unknown }).Notification = MockNotification;
    MockNotification.permission = 'granted';
    expect(showOsNotification('title', 'body')).toBe(true);
    expect(MockNotification.instances).toEqual([
      { title: 'title', body: 'body' },
    ]);
  });
});
