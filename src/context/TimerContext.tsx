import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { TimerMode, PomodoroPhase, FocusQuality } from '../types';
import { useData } from './DataContext';
import { sound } from '../lib/sound';

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

  // Formatted helpers
  formattedTime: string;
  progressPercent: number;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, logStudySession } = useData();

  const [mode, setMode] = useState<TimerMode>('Pomodoro');
  const [phase, setPhase] = useState<PomodoroPhase>('focus');
  const [isRunning, setIsRunning] = useState(false);

  // Minutes presets
  const [focusMinutes, setFocusMinutes] = useState(settings?.pomodoro_focus_mins || 50);
  const [breakMinutes, setBreakMinutes] = useState(settings?.pomodoro_break_mins || 10);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  // Synchronize when settings change
  useEffect(() => {
    if (settings?.pomodoro_focus_mins) setFocusMinutes(settings.pomodoro_focus_mins);
    if (settings?.pomodoro_break_mins) setBreakMinutes(settings.pomodoro_break_mins);
  }, [settings?.pomodoro_focus_mins, settings?.pomodoro_break_mins]);

  // Pomodoro countdown seconds
  const getInitialSecondsForPhase = useCallback((p: PomodoroPhase) => {
    if (p === 'focus') return focusMinutes * 60;
    if (p === 'short_break') return breakMinutes * 60;
    return longBreakMinutes * 60;
  }, [focusMinutes, breakMinutes, longBreakMinutes]);

  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => focusMinutes * 60);
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(() => focusMinutes * 60);

  // Stopwatch countup seconds
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // When focus/break durations change while stopped in that phase, reset countdown
  useEffect(() => {
    if (!isRunning && mode === 'Pomodoro') {
      const sec = getInitialSecondsForPhase(phase);
      setTimeLeftSeconds(sec);
      setTotalDurationSeconds(sec);
    }
  }, [focusMinutes, breakMinutes, longBreakMinutes, phase, mode, isRunning, getInitialSecondsForPhase]);

  // Timer Tick Interval
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    if (isRunning) {
      timer = setInterval(() => {
        if (mode === 'Pomodoro') {
          setTimeLeftSeconds((prev) => {
            if (prev <= 1) {
              // Timer completed
              sound.playTimerComplete();

              if (phase === 'focus') {
                // Focus session ended, auto-log focus duration
                const focusMins = Math.round(totalDurationSeconds / 60);
                if (focusMins >= 1) {
                  logStudySession(selectedSubjectId, selectedTopicId, focusMins, 'Pomodoro');
                }
                // Transition to break
                setPhase('short_break');
                const nextSec = breakMinutes * 60;
                setTotalDurationSeconds(nextSec);
                return nextSec;
              } else {
                // Break ended, transition to focus
                setPhase('focus');
                const nextSec = focusMinutes * 60;
                setTotalDurationSeconds(nextSec);
                return nextSec;
              }
            }
            return prev - 1;
          });
        } else {
          // Stopwatch mode: increment elapsed seconds
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
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

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);

  const resetTimer = () => {
    setIsRunning(false);
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
