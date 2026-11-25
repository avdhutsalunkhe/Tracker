import React from 'react';
import { SpacedRepetitionList } from '../components/revisions/SpacedRepetitionList';
import { RotateCcw, Brain, Sparkles } from 'lucide-react';

export const RevisionsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          GATE Spaced Repetition & Revision Queue
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Beat the forgetting curve with scientifically automated revision intervals: +1d → +3d → +7d → +15d → +30d.
        </p>
      </div>

      {/* Motivational Info Card */}
      <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-slate-900 border border-indigo-200 dark:border-indigo-500/30 text-xs text-slate-700 dark:text-slate-100 flex items-start gap-3 shadow-2xs">
        <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-bold text-indigo-700 dark:text-indigo-300">Active Recall Principle:</span> Every time you review a topic when due, the neural pathways solidify. One-tap "Mark Revised" automatically pushes the next review further out along the exponential retention curve.
        </div>
      </div>

      {/* Spaced Repetition Queue */}
      <SpacedRepetitionList />
    </div>
  );
};

