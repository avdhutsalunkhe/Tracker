import React from 'react';
import { ConsistencyHeatmap } from '../components/calendar/ConsistencyHeatmap';
import { MonthlyCalendar } from '../components/calendar/MonthlyCalendar';

export const CalendarPage: React.FC = () => {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Calendar & Consistency Heatmap
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Track your study streaks, daily habit completion, and review historical performance.
        </p>
      </div>

      {/* 365-Day Consistency Heatmap */}
      <ConsistencyHeatmap />

      {/* Monthly Interactive Calendar */}
      <MonthlyCalendar />
    </div>
  );
};

