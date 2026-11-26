import { Capacitor, registerPlugin } from '@capacitor/core';

interface FocusNativePlugin {
  startAppPinning(): Promise<void>;
  stopAppPinning(): Promise<void>;
  enableDnd(): Promise<{ enabled: boolean; needsPermission: boolean }>;
  disableDnd(): Promise<void>;
  openDndPolicySettings(): Promise<void>;
  updateTimerNotification(options: {
    title: string;
    body: string;
    isRunning: boolean;
  }): Promise<void>;
  clearTimerNotification(): Promise<void>;
}

const FocusNative = Capacitor.isNativePlatform()
  ? registerPlugin<FocusNativePlugin>('FocusNative')
  : null;

export const isNativeAndroid = (): boolean =>
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function startNativeFocusLock(): Promise<{
  dndEnabled: boolean;
  needsDndPermission: boolean;
}> {
  if (!FocusNative) {
    return { dndEnabled: false, needsDndPermission: false };
  }
  try {
    await FocusNative.startAppPinning();
  } catch {
    // Ignore if user declined screen pinning prompt
  }
  try {
    const res = await FocusNative.enableDnd();
    return {
      dndEnabled: Boolean(res?.enabled),
      needsDndPermission: Boolean(res?.needsPermission),
    };
  } catch {
    return { dndEnabled: false, needsDndPermission: false };
  }
}

export async function stopNativeFocusLock(): Promise<void> {
  if (!FocusNative) return;
  try {
    await FocusNative.stopAppPinning();
  } catch {
    // Ignore
  }
  try {
    await FocusNative.disableDnd();
  } catch {
    // Ignore
  }
}

export async function openNativeDndSettings(): Promise<void> {
  if (!FocusNative) return;
  try {
    await FocusNative.openDndPolicySettings();
  } catch {
    // Ignore
  }
}

export async function showNativeTimerNotification(
  title: string,
  body: string,
  isRunning: boolean
): Promise<boolean> {
  if (!FocusNative) return false;
  try {
    await FocusNative.updateTimerNotification({ title, body, isRunning });
    return true;
  } catch {
    return false;
  }
}

export async function clearNativeTimerNotification(): Promise<boolean> {
  if (!FocusNative) return false;
  try {
    await FocusNative.clearTimerNotification();
    return true;
  } catch {
    return false;
  }
}
