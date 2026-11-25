import React from 'react';
import { QuickStatsGrid } from '../components/analytics/QuickStatsGrid';
import { ConsistencyHeatmap } from '../components/calendar/ConsistencyHeatmap';
import { StudyBarChart } from '../components/analytics/StudyBarChart';
import { SubjectDonutChart } from '../components/analytics/SubjectDonutChart';
import { PriorityMatrix } from '../components/analytics/PriorityMatrix';
import { ForecastAndPeakChart } from '../components/analytics/ForecastAndPeakChart';
import { WeeklyReviewCard } from '../components/analytics/WeeklyReviewCard';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { BarChart3, Share2 } from 'lucide-react';
import { format, subDays } from 'date-fns';

export const AnalyticsPage: React.FC = () => {
  const { sessions, activeStreak, topics, settings } = useData();
  const { showToast } = useToast();

  const handleExportProgressPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark-mode background
    ctx.fillStyle = '#0B1120';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Card border
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    // Header
    ctx.fillStyle = '#F1F5F9';
    ctx.font = 'bold 34px Inter, system-ui, sans-serif';
    ctx.fillText('TRACKER · WEEKLY GATE PROGRESS', 56, 92);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '18px Inter, system-ui, sans-serif';
    ctx.fillText(`Week ending ${format(new Date(), 'MMMM d, yyyy')}`, 56, 126);

    const weekAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const weekHours = (
      sessions
        .filter((s) => s.session_date >= weekAgo)
        .reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / 60
    ).toFixed(1);
    const completedTopics = topics.filter((t) => t.status === 'Completed').length;
    const totalTopics = topics.length;
    const pct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const cards = [
      { label: '7-DAY FOCUS', value: `${weekHours}h`, color: '#6366F1' },
      { label: 'HABIT STREAK', value: `${activeStreak} Days`, color: '#F59E0B' },
      { label: 'SYLLABUS', value: `${pct}%`, color: '#10B981' },
    ];

    cards.forEach((c, idx) => {
      const x = 56 + idx * 290;
      const y = 175;
      ctx.fillStyle = '#111827';
      ctx.fillRect(x, y, 260, 150);
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 260, 150);

      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText(c.label, x + 22, y + 40);

      ctx.fillStyle = c.color;
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.fillText(c.value, x + 22, y + 106);
    });

    ctx.fillStyle = '#64748B';
    ctx.font = '16px Inter, system-ui, sans-serif';
    ctx.fillText(
      `Target Exam: ${settings?.gate_exam_date || '2027-02-06'} · Daily Goal: ${settings?.daily_study_goal_hours || 6}h/day`,
      56,
      410
    );

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracker_weekly_progress_${format(new Date(), 'yyyy-MM-dd')}.png`;
    a.click();
    showToast({ type: 'success', title: 'Progress Card Exported', message: 'Saved weekly PNG snapshot.' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Analytics & Weakness Radar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Forecasting, peak-hour focus, study habits, and subject time distribution.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportProgressPng}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 self-start sm:self-auto"
        >
          <Share2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>Share Weekly PNG</span>
        </button>
      </div>

      {/* 1. High Level Summary Metrics */}
      <QuickStatsGrid />

      {/* 2. Weekly Review & Forecast */}
      <WeeklyReviewCard />
      <ForecastAndPeakChart />

      {/* 3. Full 365-Day Contribution Grid */}
      <ConsistencyHeatmap />

      {/* 4. Charts: Study Hours vs Goal & Subject Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <StudyBarChart />
        <SubjectDonutChart />
      </div>

      {/* 5. Priority Weakness Matrix */}
      <PriorityMatrix />
    </div>
  );
};
