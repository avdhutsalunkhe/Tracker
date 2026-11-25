import React, { useState } from 'react';
import { TimerDisplay } from '../components/timer/TimerDisplay';
import { ModeSelector } from '../components/timer/ModeSelector';
import { SessionLogHistory } from '../components/timer/SessionLogHistory';
import { GateCalculatorModal } from '../components/timer/GateCalculatorModal';
import { Timer, Calculator } from 'lucide-react';

export const TimerPage: React.FC = () => {
  const [calcOpen, setCalcOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Timer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            GATE Focus & Pomodoro Timer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deep work blocks, 3-hour exam simulation, virtual calculator, and offline soundscapes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto"
        >
          <Calculator className="w-4 h-4 text-indigo-500" />
          <span>GATE Calculator</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7">
          <TimerDisplay />
        </div>

        <div className="lg:col-span-5 space-y-5">
          <ModeSelector />
          <SessionLogHistory />
        </div>
      </div>

      <GateCalculatorModal isOpen={calcOpen} onClose={() => setCalcOpen(false)} />
    </div>
  );
};

