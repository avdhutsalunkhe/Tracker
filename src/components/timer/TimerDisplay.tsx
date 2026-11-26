import React, { useState } from 'react';
import { useTimer } from '../../context/TimerContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { isNativeAndroid, openNativeDndSettings } from '../../lib/nativeFocus';
import { FocusQuality } from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  SkipForward,
  BellOff,
  Lock,
  ExternalLink,
  X,
  ShieldCheck,
} from 'lucide-react';

export const TimerDisplay: React.FC = () => {
  const {
    mode,
    phase,
    isRunning,
    formattedTime,
    progressPercent,
    startTimer,
    pauseTimer,
    resetTimer,
    finishSession,
    skipBreak,
    selectedSubjectId,
    selectedTopicId,
    focusLockEnabled,
    setFocusLockEnabled,
    focusPin,
    setFocusPin,
    lockScreenNow,
  } = useTimer();

  const { subjects, topics } = useData();
  const { showToast } = useToast();
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [showDndModal, setShowDndModal] = useState(false);
  const [needsDndPerm, setNeedsDndPerm] = useState(false);

  const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);
  const nativeAndroid = isNativeAndroid();

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);

  // SVG Circular progress dimensions
  const size = 280;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const isBreak = mode === 'Pomodoro' && (phase === 'short_break' || phase === 'long_break');

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder shadow-sm relative overflow-hidden">
      {/* Background ambient glow when active */}
      {isRunning && (
        <div
          className={`absolute inset-0 opacity-10 pointer-events-none blur-3xl transition-all duration-700 ${isBreak ? 'bg-emerald-500' : 'bg-indigo-600'
            }`}
        />
      )}

      {/* Target Topic Pill */}
      <div className="mb-4 text-center">
        {selectedTopic ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedSubject?.color || '#6366F1' }}
            />
            <span className="truncate max-w-[220px]">{selectedTopic.topic_name}</span>
          </div>
        ) : selectedSubject ? (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
            <span>{selectedSubject.name}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500">
            <span>General Focus Session</span>
          </div>
        )}
      </div>

      {/* Main SVG Circular Timer */}
      <div className="relative inline-flex items-center justify-center my-2 w-[230px] h-[230px] sm:w-[280px] sm:h-[280px]">
        <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            className="text-slate-100 dark:text-slate-800/80"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress Arc */}
          <circle
            className={`transition-all duration-700 ease-out ${isBreak
                ? 'text-emerald-500'
                : isRunning
                  ? 'text-indigo-600 dark:text-indigo-500'
                  : 'text-indigo-400 dark:text-indigo-600'
              }`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>

        {/* Inner Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {formattedTime}
          </span>
          <span
            className={`text-xs font-bold uppercase tracking-wider mt-1 px-2.5 py-0.5 rounded-full ${isBreak
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
              }`}
          >
            {mode === 'Pomodoro'
              ? phase === 'focus'
                ? 'Focus Time'
                : 'Break Time'
              : 'Deep Stopwatch'}
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={resetTimer}
          className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shadow-2xs"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          onClick={isRunning ? pauseTimer : startTimer}
          className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition-all transform hover:scale-105 active:scale-95 ${isBreak
              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
            }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current ml-0.5" />
              <span>Start Focus</span>
            </>
          )}
        </button>

        {isBreak ? (
          <button
            onClick={skipBreak}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors shadow-2xs"
            title="Skip Break and start focus"
            aria-label="Skip Break"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setShowQualityPicker(true)}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors shadow-2xs"
            title="Finish & Log Study Session"
            aria-label="Finish Session"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Big Silent / DND & Focus Lock Button */}
      <button
        type="button"
        onClick={() => {
          if (!focusLockEnabled) setFocusLockEnabled(true);
          setShowDndModal(true);
        }}
        className={`mt-4 w-full max-w-sm flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl border text-sm font-bold transition-all shadow-xs ${
          focusLockEnabled
            ? 'border-rose-500/50 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        <BellOff className="w-5 h-5 shrink-0" />
        <span>{focusLockEnabled ? 'Silent / DND & Focus Lock On' : 'Silent / DND & Block Notifications'}</span>
      </button>

      {/* 1-Tap Post-Session Focus Quality Rating */}
      {showQualityPicker && (
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 w-full max-w-xs text-center space-y-2 animate-in fade-in duration-150">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Rate Focus Quality & Log Session
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['Deep', 'Average', 'Distracted'] as FocusQuality[]).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => {
                  finishSession(q);
                  setShowQualityPicker(false);
                }}
                className="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                {q}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowQualityPicker(false)}
            className="text-[11px] text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Silent / DND & Focus Lock Modal */}
      {showDndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 shadow-xl space-y-4 text-left animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <BellOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Silent / Do Not Disturb & Focus Lock
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Silence WhatsApp, Instagram & keep screen locked
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDndModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              {nativeAndroid
                ? 'Starting Focus Lock & DND needs NO password. Once locked, switching apps is blocked by Android Screen Pinning and your PIN is required to stop & unlock.'
                : 'Starting Focus Lock needs NO password. Your PIN is only required to unlock. On Android APK, Screen Pinning & automatic DND block switching apps and silence WhatsApp/Instagram.'}
            </div>

            {nativeAndroid ? (
              <button
                type="button"
                onClick={() => openNativeDndSettings()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>
                  {needsDndPerm
                    ? 'Grant Do Not Disturb Access to Avdhut'
                    : 'Phone Do Not Disturb Access Settings'}
                </span>
              </button>
            ) : isAndroid ? (
              <a
                href="intent:#Intent;action=android.settings.ZEN_MODE_SETTINGS;end"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Phone Do Not Disturb Settings</span>
              </a>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Quick Tip:</span>{' '}
                Swipe down your phone&apos;s Quick Settings / Control Center and tap <span className="font-semibold">Do Not Disturb</span> to block WhatsApp, Instagram, and calls.
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Strict Focus Lock (Fullscreen + Wake Lock)</span>
                </label>
                <input
                  type="checkbox"
                  checked={focusLockEnabled}
                  onChange={(e) => setFocusLockEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </div>

              {focusLockEnabled && (
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500 dark:text-slate-400">PIN to Stop / Unlock:</span>
                  <input
                    type="password"
                    value={focusPin}
                    onChange={(e) => setFocusPin(e.target.value)}
                    placeholder="PIN (e.g. 1234)"
                    className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDndModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await lockScreenNow();
                  if (!isRunning) {
                    startTimer();
                  }
                  if (res.needsDndPermission) {
                    setNeedsDndPerm(true);
                    showToast({
                      type: 'info',
                      title: 'Allow DND Access',
                      message: 'Enable Do Not Disturb access for Avdhut so it can silence other apps automatically.',
                    });
                  } else {
                    setShowDndModal(false);
                    showToast({
                      type: 'success',
                      title: 'Focus Lock Active',
                      message: res.dndEnabled
                        ? 'Screen locked and Do Not Disturb enabled. PIN required to unlock.'
                        : 'Screen locked. Enter your PIN to stop & unlock.',
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isRunning ? 'Lock Screen & DND Now' : 'Start Locked Focus & DND'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

