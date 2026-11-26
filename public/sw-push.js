// Service Worker Push & Notification Action Handlers for Tracker GATE PWA

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Tracker GATE Reminder',
    body: 'Time to start your scheduled study block.',
    tag: 'tracker-study-slot',
    url: '/timer',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    silent: false,
    vibrate: [200, 100, 200],
    renotify: true,
    tag: payload.tag,
    data: { url: payload.url || '/timer' },
    actions: [
      { action: 'start-timer', title: 'Start Timer' },
      { action: 'snooze', title: 'Snooze 10m' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'pause-timer' || action === 'stop-timer') {
    if (action === 'stop-timer') {
      notification.close();
    }
    try {
      const bc = new BroadcastChannel('tracker-timer-actions');
      bc.postMessage({ action });
      bc.close();
    } catch {
      // Ignore if BroadcastChannel unsupported
    }
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        clients.forEach((c) => c.postMessage({ type: 'TRACKER_TIMER_ACTION', action }));
      })
    );
    return;
  }

  notification.close();

  if (action === 'snooze') {
    const snoozeTitle = notification.title || 'Tracker Snoozed Reminder';
    const snoozeBody = notification.body || 'Your 10-minute snoozed study block is ready.';
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration
            .showNotification(snoozeTitle, {
              body: snoozeBody,
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              silent: false,
              vibrate: [200, 100, 200],
              renotify: true,
              tag: 'tracker-snooze',
              data: { url: '/timer' },
              actions: [
                { action: 'start-timer', title: 'Start Timer' },
                { action: 'snooze', title: 'Snooze 10m' },
              ],
            })
            .then(resolve);
        }, 10 * 60 * 1000);
      })
    );
    return;
  }

  const targetUrl = (notification.data && notification.data.url) || '/timer';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
