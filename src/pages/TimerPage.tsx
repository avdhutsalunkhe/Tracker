import React from 'react';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { ModeSelector } from '../components/timer/ModeSelector';
import { SessionLogHistory } from '../components/timer/SessionLogHistory';
import { Timer, Sparkles } from 'lucide-react';

export const TimerPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          GATE Focus & Pomodoro Timer
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Deep work blocks with automatic topic linking and daily hours tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Circular Timer */}
        <div className="lg:col-span-7">
          <TimerDisplay />
        </div>

        {/* Right: Mode Configurations & Session History */}
        <div className="lg:col-span-5 space-y-5">
          <ModeSelector />
          <SessionLogHistory />
        </div>
      </div>
    </div>
  );
};

