import React from 'react';
import { QuickStatsGrid } from '../components/analytics/QuickStatsGrid';
import { ConsistencyHeatmap } from '../components/calendar/ConsistencyHeatmap';
import { StudyBarChart } from '../components/analytics/StudyBarChart';
import { SubjectDonutChart } from '../components/analytics/SubjectDonutChart';
import { PriorityMatrix } from '../components/analytics/PriorityMatrix';
import { BarChart3 } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Analytics & Weakness Radar
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Comprehensive insights into your study habits, syllabus mastery, and subject time distribution.
        </p>
      </div>

      {/* 1. High Level Summary Metrics */}
      <QuickStatsGrid />

      {/* 2. Full 365-Day Contribution Grid */}
      <ConsistencyHeatmap />

      {/* 3. Charts: Study Hours vs Goal & Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <StudyBarChart />
        <SubjectDonutChart />
      </div>

      {/* 4. Priority Weakness Matrix */}
      <PriorityMatrix />
    </div>
  );
};
