import React, { useState } from 'react';
import { useTimer } from '../../context/TimerContext';
import { useData } from '../../context/DataContext';
import { FocusQuality } from '../../types';
import { Play, Pause, RotateCcw, Check, SkipForward } from 'lucide-react';

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
  } = useTimer();

  const { subjects, topics } = useData();
  const [showQualityPicker, setShowQualityPicker] = useState(false);

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
    </div>
  );
};

