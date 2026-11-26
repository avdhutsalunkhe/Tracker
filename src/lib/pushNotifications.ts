import { supabase, isSupabaseConfigured } from './supabase';
import { AllottedSlot } from '../types';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator
  );
}

export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export async function showLocalSwNotification(title: string, body: string, url = '/timer'): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      silent: false,
      vibrate: [200, 100, 200],
      renotify: true,
      tag: `tracker-${Date.now()}`,
      data: { url },
      actions: [
        { action: 'start-timer', title: 'Start Timer' },
        { action: 'snooze', title: 'Snooze 10m' },
      ],
    } as NotificationOptions);
  } catch {
    new Notification(title, { body, icon: '/pwa-192x192.png' });
  }
}

export async function updateActiveTimerNotification(params: {
  title: string;
  body: string;
  isRunning: boolean;
  silent?: boolean;
}): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(params.title, {
      body: params.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: 'tracker-active-timer',
      renotify: false,
      silent: params.silent ?? true,
      requireInteraction: params.isRunning,
      data: { url: '/timer' },
      actions: [
        { action: 'pause-timer', title: params.isRunning ? 'Pause' : 'Resume' },
        { action: 'stop-timer', title: 'Stop & Save' },
      ],
    } as NotificationOptions);
  } catch {
    // Ignore if SW unavailable
  }
}

export async function clearActiveTimerNotification(): Promise<void> {
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const notifications = await reg.getNotifications({ tag: 'tracker-active-timer' });
    notifications.forEach((n) => n.close());
  } catch {
    // Ignore
  }
}

export async function subscribeToWebPush(
  userId: string,
  preAlertMins = 5,
  eveningReminderTime = '20:30'
): Promise<{ ok: boolean; reason?: string }> {
  if (!isPushSupported()) {
    return { ok: false, reason: 'Notifications are not supported in this browser.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, reason: 'Notification permission was denied.' };
  }

  if (!VAPID_PUBLIC_KEY) {
    // Still works via local Service Worker foreground scheduler
    return { ok: true, reason: 'Local notification alerts enabled (add VITE_VAPID_PUBLIC_KEY for background push).' };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      });
    }

    const json = subscription.toJSON();
    if (userId && isSupabaseConfigured && supabase && json.endpoint && json.keys) {
      await supabase.from('push_subscriptions').upsert(
        {
          user_id: userId,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
          pre_alert_mins: preAlertMins,
          evening_reminder_time: eveningReminderTime,
        },
        { onConflict: 'endpoint' }
      );
    }
    return { ok: true };
  } catch (err: unknown) {
    const error = err as Error;
    return { ok: false, reason: error.message };
  }
}

const firedLocalNotifications = new Set<string>();

/**
 * Foreground / local fallback scheduler for upcoming allotted slots & evening habit reminder.
 */
export function checkDueLocalNotifications(
  slots: AllottedSlot[],
  preAlertMins = 5,
  eveningReminderTime = '20:30'
): void {
  if (!isPushSupported() || Notification.permission !== 'granted') return;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nowMins = now.getHours() * 60 + now.getMinutes();

  slots
    .filter((s) => s.slot_date === todayStr && !s.completed)
    .forEach((slot) => {
      const [h, m] = slot.start_time.split(':').map(Number);
      const startMins = (h || 0) * 60 + (m || 0);
      const diff = startMins - nowMins;
      const key = `${slot.id}-${todayStr}`;

      if (diff >= 0 && diff <= preAlertMins && !firedLocalNotifications.has(key)) {
        firedLocalNotifications.add(key);
        showLocalSwNotification(
          diff === 0 ? `Starting Now: ${slot.title}` : `In ${diff}m: ${slot.title}`,
          `${slot.start_time} – ${slot.end_time} (${slot.slot_type})`,
          '/timer'
        );
      }
    });

  // Evening habit/revision reminder
  const [eh, em] = eveningReminderTime.split(':').map(Number);
  const eveningMins = (eh || 20) * 60 + (em || 30);
  const evKey = `evening-${todayStr}`;
  if (Math.abs(nowMins - eveningMins) <= 1 && !firedLocalNotifications.has(evKey)) {
    firedLocalNotifications.add(evKey);
    showLocalSwNotification(
      'Evening Discipline & Revision Check',
      'Review your remaining daily habits and spaced repetition queue before wrapping up.',
      '/'
    );
  }
}
