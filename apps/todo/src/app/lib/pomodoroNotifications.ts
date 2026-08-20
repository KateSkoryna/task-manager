export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function requestNotificationPermission(): void {
  if (!isNotificationSupported() || Notification.permission !== 'default')
    return;
  void Notification.requestPermission();
}

// Returns whether an OS notification was actually shown, so callers can fall
// back to an in-app banner when it wasn't (unsupported, denied, or not yet granted).
export function showOsNotification(title: string, body: string): boolean {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }
  new Notification(title, { body });
  return true;
}
