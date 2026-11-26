import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { TimerMode, PomodoroPhase, FocusQuality } from '../types';
import { useData } from './DataContext';
import { sound } from '../lib/sound';
import { updateActiveTimerNotification, clearActiveTimerNotification } from '../lib/pushNotifications';
import { startNativeFocusLock, stopNativeFocusLock } from '../lib/nativeFocus';

interface TimerContextType {
  mode: TimerMode;
  setMode: (mode: TimerMode) => void;
  phase: PomodoroPhase;
  setPhase: (phase: PomodoroPhase) => void;
  isRunning: boolean;
  timeLeftSeconds: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  selectedSubjectId: string | null;
  setSelectedSubjectId: (id: string | null) => void;
  selectedTopicId: string | null;
  setSelectedTopicId: (id: string | null) => void;

  // Durations (in minutes)
  focusMinutes: number;
  setFocusMinutes: (mins: number) => void;
  breakMinutes: number;
  setBreakMinutes: (mins: number) => void;
  longBreakMinutes: number;
  setLongBreakMinutes: (mins: number) => void;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  finishSession: (focusQuality?: FocusQuality) => void;
  skipBreak: () => void;

  // Focus Lock (Fullscreen + PIN)
  focusLockEnabled: boolean;
  setFocusLockEnabled: (enabled: boolean) => void;
  focusPin: string;
  setFocusPin: (pin: string) => void;
  isScreenLocked: boolean;
  unlockScreen: (enteredPin: string) => boolean;
  lockScreenNow: () => Promise<{ dndEnabled: boolean; needsDndPermission: boolean }>;

  // Formatted helpers
  formattedTime: string;
  progressPercent: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const TIMER_STORAGE_KEY = 'avdhut_active_timer_v1';

interface PersistedTimerState {
  mode: TimerMode;
  phase: PomodoroPhase;
  isRunning: boolean;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  timeLeftSeconds: number;
  totalDurationSeconds: number;
  elapsedSeconds: number;
  endAtMs: number | null;
  startedAtMs: number | null;
  selectedSubjectId: string | null;
  selectedTopicId: string | null;
  isScreenLocked: boolean;
}

function loadPersistedTimer(): PersistedTimerState | null {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedTimerState;
    if (!parsed || typeof parsed.mode !== 'string') return null;

    if (parsed.isRunning) {
      if (parsed.mode === 'Pomodoro' && parsed.endAtMs) {
        parsed.timeLeftSeconds = Math.max(0, Math.ceil((parsed.endAtMs - Date.now()) / 1000));
      } else if (parsed.mode === 'Stopwatch' && parsed.startedAtMs) {
        parsed.elapsedSeconds = Math.max(0, Math.floor((Date.now() - parsed.startedAtMs) / 1000));
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, logStudySession } = useData();
  const initialPersistedRef = useRef<PersistedTimerState | null>(loadPersistedTimer());
  const p = initialPersistedRef.current;

  const [mode, setMode] = useState<TimerMode>(p?.mode || 'Pomodoro');
  const [phase, setPhase] = useState<PomodoroPhase>(p?.phase || 'focus');
  const [isRunning, setIsRunning] = useState<boolean>(Boolean(p?.isRunning));

  // Minutes presets
  const [focusMinutes, setFocusMinutes] = useState<number>(p?.focusMinutes || settings?.pomodoro_focus_mins || 50);
  const [breakMinutes, setBreakMinutes] = useState<number>(p?.breakMinutes || settings?.pomodoro_break_mins || 10);
  const [longBreakMinutes, setLongBreakMinutes] = useState<number>(p?.longBreakMinutes || 15);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(p?.selectedSubjectId ?? null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(p?.selectedTopicId ?? null);

  // Synchronize when settings change (only if no active/paused session is in progress)
  useEffect(() => {
    if (isRunning || initialPersistedRef.current) return;
    if (settings?.pomodoro_focus_mins) setFocusMinutes(settings.pomodoro_focus_mins);
    if (settings?.pomodoro_break_mins) setBreakMinutes(settings.pomodoro_break_mins);
  }, [settings?.pomodoro_focus_mins, settings?.pomodoro_break_mins, isRunning]);

  // Pomodoro countdown seconds
  const getInitialSecondsForPhase = useCallback((ph: PomodoroPhase) => {
    if (ph === 'focus') return focusMinutes * 60;
    if (ph === 'short_break') return breakMinutes * 60;
    return longBreakMinutes * 60;
  }, [focusMinutes, breakMinutes, longBreakMinutes]);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() =>
    p ? p.timeLeftSeconds : focusMinutes * 60
  );
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(() =>
    p ? p.totalDurationSeconds : focusMinutes * 60
  );

  // Stopwatch countup seconds
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => p?.elapsedSeconds || 0);

  // Focus Lock + PIN state
  const [focusLockEnabled, setFocusLockEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tracker_focus_lock_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [focusPin, setFocusPinState] = useState<string>(() => {
    try {
      return localStorage.getItem('tracker_focus_pin') || '1234';
    } catch {
      return '1234';
    }
  });
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(Boolean(p?.isScreenLocked));

  const setFocusPin = (pin: string) => {
    const clean = pin.trim() || '1234';
    setFocusPinState(clean);
    try {
      localStorage.setItem('tracker_focus_pin', clean);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    try {
      localStorage.setItem('tracker_focus_lock_enabled', String(focusLockEnabled));
    } catch {
      // Ignore
    }
  }, [focusLockEnabled]);

  const unlockScreen = (enteredPin: string): boolean => {
    if (enteredPin.trim() === focusPin) {
      setIsScreenLocked(false);
      stopNativeFocusLock();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      return true;
    }
    return false;
  };

  const lockScreenNow = async (): Promise<{ dndEnabled: boolean; needsDndPermission: boolean }> => {
    setFocusLockEnabled(true);
    setIsScreenLocked(true);
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    return startNativeFocusLock();
  };

  // Timestamp refs so background browser throttling & page refreshes never lose time
  const endAtMsRef = useRef<number | null>(p?.endAtMs ?? null);
  const startedAtMsRef = useRef<number | null>(p?.startedAtMs ?? null);

  // Persist active timer state to localStorage on every change
  useEffect(() => {
    try {
      const payload: PersistedTimerState = {
        mode,
        phase,
        isRunning,
        focusMinutes,
        breakMinutes,
        longBreakMinutes,
        timeLeftSeconds,
        totalDurationSeconds,
        elapsedSeconds,
        endAtMs: endAtMsRef.current,
        startedAtMs: startedAtMsRef.current,
        selectedSubjectId,
        selectedTopicId,
        isScreenLocked,
      };
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [
    mode,
    phase,
    isRunning,
    focusMinutes,
    breakMinutes,
    longBreakMinutes,
    timeLeftSeconds,
    totalDurationSeconds,
    elapsedSeconds,
    selectedSubjectId,
    selectedTopicId,
    isScreenLocked,
  ]);

  // Screen Wake Lock while timer is running (re-acquired on screen wake)
  useEffect(() => {
    let wakeLock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };
    const requestLock = () => {
      if (isRunning && !document.hidden && nav.wakeLock) {
        nav.wakeLock.request('screen').then((wl) => {
          wakeLock = wl;
        }).catch(() => {});
      }
    };
    requestLock();
    document.addEventListener('visibilitychange', requestLock);
    return () => {
      document.removeEventListener('visibilitychange', requestLock);
      wakeLock?.release().catch(() => {});
    };
  }, [isRunning]);

  // When focus/break durations change while stopped at initial state, update countdown
  const prevDurationsRef = useRef({ focusMinutes, breakMinutes, longBreakMinutes, phase, mode });
  useEffect(() => {
    const prev = prevDurationsRef.current;
    const changed =
      prev.focusMinutes !== focusMinutes ||
      prev.breakMinutes !== breakMinutes ||
      prev.longBreakMinutes !== longBreakMinutes ||
      prev.phase !== phase ||
      prev.mode !== mode;
    prevDurationsRef.current = { focusMinutes, breakMinutes, longBreakMinutes, phase, mode };

    if (changed && !isRunning && mode === 'Pomodoro') {
      const sec = getInitialSecondsForPhase(phase);
      setTimeLeftSeconds(sec);
      setTotalDurationSeconds(sec);
    }
  }, [focusMinutes, breakMinutes, longBreakMinutes, phase, mode, isRunning, getInitialSecondsForPhase]);

  // Timer Tick Interval using wall-clock timestamps (accurate in background!)
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      if (mode === 'Pomodoro' && !endAtMsRef.current) {
        endAtMsRef.current = Date.now() + timeLeftSeconds * 1000;
      }
      if (mode === 'Stopwatch' && !startedAtMsRef.current) {
        startedAtMsRef.current = Date.now() - elapsedSeconds * 1000;
      }

      const syncFromClock = () => {
        if (mode === 'Pomodoro' && endAtMsRef.current) {
          const remaining = Math.max(0, Math.ceil((endAtMsRef.current - Date.now()) / 1000));
          if (remaining <= 0) {
            sound.playTimerComplete();
            if (phase === 'focus') {
              const focusMins = Math.round(totalDurationSeconds / 60);
              if (focusMins >= 1) {
                logStudySession(selectedSubjectId, selectedTopicId, focusMins, 'Pomodoro');
              }
              setPhase('short_break');
              const nextSec = breakMinutes * 60;
              setTotalDurationSeconds(nextSec);
              setTimeLeftSeconds(nextSec);
              endAtMsRef.current = Date.now() + nextSec * 1000;
            } else {
              setPhase('focus');
              const nextSec = focusMinutes * 60;
              setTotalDurationSeconds(nextSec);
              setTimeLeftSeconds(nextSec);
              endAtMsRef.current = Date.now() + nextSec * 1000;
            }
          } else {
            setTimeLeftSeconds(remaining);
          }
        } else if (mode === 'Stopwatch' && startedAtMsRef.current) {
          setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMsRef.current) / 1000)));
        }
      };

      syncFromClock();
      timer = setInterval(syncFromClock, 1000);
      document.addEventListener('visibilitychange', syncFromClock);
      window.addEventListener('focus', syncFromClock);
      window.addEventListener('pageshow', syncFromClock);

      return () => {
        if (timer) clearInterval(timer);
        document.removeEventListener('visibilitychange', syncFromClock);
        window.removeEventListener('focus', syncFromClock);
        window.removeEventListener('pageshow', syncFromClock);
      };
    } else {
      endAtMsRef.current = null;
      startedAtMsRef.current = null;
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [
    isRunning,
    mode,
    phase,
    totalDurationSeconds,
    breakMinutes,
    focusMinutes,
    selectedSubjectId,
    selectedTopicId,
    logStudySession,
  ]);

  const startTimer = () => {
    if (mode === 'Pomodoro') {
      endAtMsRef.current = Date.now() + timeLeftSeconds * 1000;
    } else {
      startedAtMsRef.current = Date.now() - elapsedSeconds * 1000;
    }
    setIsRunning(true);
    if (focusLockEnabled) {
      setIsScreenLocked(true);
      startNativeFocusLock();
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  };
  const pauseTimer = () => {
    if (mode === 'Pomodoro' && endAtMsRef.current) {
      setTimeLeftSeconds(Math.max(0, Math.ceil((endAtMsRef.current - Date.now()) / 1000)));
    } else if (mode === 'Stopwatch' && startedAtMsRef.current) {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMsRef.current) / 1000)));
    }
    endAtMsRef.current = null;
    startedAtMsRef.current = null;
    setIsRunning(false);
  };

  const resetTimer = () => {
    endAtMsRef.current = null;
    startedAtMsRef.current = null;
    setIsRunning(false);
    setIsScreenLocked(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    clearActiveTimerNotification();
    if (mode === 'Pomodoro') {
      const sec = getInitialSecondsForPhase(phase);
      setTimeLeftSeconds(sec);
      setTotalDurationSeconds(sec);
    } else {
      setElapsedSeconds(0);
    }
  };

  const finishSession = (focusQuality: FocusQuality = 'Deep') => {
    setIsRunning(false);
    clearActiveTimerNotification();
    if (mode === 'Pomodoro') {
      if (phase === 'focus') {
        const secondsSpent = totalDurationSeconds - timeLeftSeconds;
        const minutes = Math.floor(secondsSpent / 60);
        if (minutes >= 1) {
          logStudySession(selectedSubjectId, selectedTopicId, minutes, 'Pomodoro', focusQuality);
        }
      }
      resetTimer();
    } else {
      // Stopwatch mode
      const minutes = Math.floor(elapsedSeconds / 60);
      if (minutes >= 1) {
        logStudySession(selectedSubjectId, selectedTopicId, minutes, 'Stopwatch', focusQuality);
      }
      setElapsedSeconds(0);
    }
  };

  const skipBreak = () => {
    setIsRunning(false);
    setPhase('focus');
    const sec = focusMinutes * 60;
    setTimeLeftSeconds(sec);
    setTotalDurationSeconds(sec);
  };

  // Formatted display: mm:ss or hh:mm:ss
  const currentSeconds = mode === 'Pomodoro' ? timeLeftSeconds : elapsedSeconds;
  const hours = Math.floor(currentSeconds / 3600);
  const mins = Math.floor((currentSeconds % 3600) / 60);
  const secs = currentSeconds % 60;

  const formattedTime =
    hours > 0
      ? `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPercent =
    mode === 'Pomodoro'
      ? totalDurationSeconds > 0
        ? Math.min(100, Math.max(0, Math.round(((totalDurationSeconds - timeLeftSeconds) / totalDurationSeconds) * 100)))
        : 0
      : Math.min(100, Math.round((elapsedSeconds % 3600) / 36));

  // Sync active timer notification in Android/Desktop notification shade
  useEffect(() => {
    if (!isRunning) return;
    updateActiveTimerNotification({
      title: `Avdhut · ${mode === 'Pomodoro' ? (phase === 'focus' ? 'Focus Running' : 'Break') : 'Deep Stopwatch'}`,
      body: `${formattedTime} ${mode === 'Pomodoro' ? 'remaining' : 'elapsed'}`,
      isRunning: true,
      silent: true,
    });
  }, [isRunning, mode, phase, Math.floor(currentSeconds / 5)]);

  // Listen to notification shade action buttons (Pause / Stop & Save)
  useEffect(() => {
    const handleAction = (action: string) => {
      if (action === 'pause-timer') {
        setIsRunning((prev) => !prev);
      } else if (action === 'stop-timer') {
        finishSession('Deep');
      }
    };

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('tracker-timer-actions');
      bc.onmessage = (e) => {
        if (e.data?.action) handleAction(e.data.action);
      };
    }

    const swListener = (e: MessageEvent) => {
      if (e.data?.type === 'TRACKER_TIMER_ACTION' && e.data?.action) {
        handleAction(e.data.action);
      }
    };
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', swListener);
    }

    return () => {
      bc?.close();
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', swListener);
      }
    };
  }, []);

  return (
    <TimerContext.Provider
      value={{
        mode,
        setMode,
        phase,
        setPhase,
        isRunning,
        timeLeftSeconds,
        elapsedSeconds,
        totalDurationSeconds,
        selectedSubjectId,
        setSelectedSubjectId,
        selectedTopicId,
        setSelectedTopicId,
        focusMinutes,
        setFocusMinutes,
        breakMinutes,
        setBreakMinutes,
        longBreakMinutes,
        setLongBreakMinutes,
        startTimer,
        pauseTimer,
        resetTimer,
        finishSession,
        skipBreak,
        focusLockEnabled,
        setFocusLockEnabled,
        focusPin,
        setFocusPin,
        isScreenLocked,
        unlockScreen,
        lockScreenNow,
        formattedTime,
        progressPercent,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
