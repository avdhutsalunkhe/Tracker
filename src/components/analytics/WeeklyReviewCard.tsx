import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { format, subDays } from 'date-fns';
import { ClipboardCheck, TrendingUp, AlertCircle } from 'lucide-react';
import { getEffectiveConfidence } from '../../utils/topicIntelligence';

export const WeeklyReviewCard: React.FC = () => {
  const { sessions, settings, revisions, mockTests, topics } = useData();

  const summary = useMemo(() => {
    const today = new Date();
    const weekAgoStr = format(subDays(today, 6), 'yyyy-MM-dd');

    const weeklySessions = sessions.filter((s) => s.session_date >= weekAgoStr);
    const actualHours = Math.round(
      (weeklySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) / 60) * 10
    ) / 10;
    const targetHours = Math.round((settings?.daily_study_goal_hours || 6) * 7 * 10) / 10;

    const weeklyRevisions = revisions.filter((r) => r.revised_on >= weekAgoStr).length;

    const sortedTests = [...mockTests].sort((a, b) => a.test_date.localeCompare(b.test_date));
    let scoreDelta = 'No tests yet';
    if (sortedTests.length >= 2) {
      const prev = sortedTests[sortedTests.length - 2];
      const latest = sortedTests[sortedTests.length - 1];
      const prevPct = Math.round((prev.marks_scored / prev.total_marks) * 100);
      const latestPct = Math.round((latest.marks_scored / latest.total_marks) * 100);
      const diff = latestPct - prevPct;
      scoreDelta = `${diff >= 0 ? '+' : ''}${diff}% vs prev`;
    } else if (sortedTests.length === 1) {
      const only = sortedTests[0];
      scoreDelta = `${Math.round((only.marks_scored / only.total_marks) * 100)}% latest`;
    }

    const weakestTopics = [...topics]
      .sort((a, b) => getEffectiveConfidence(a) - getEffectiveConfidence(b))
      .slice(0, 3);

    return { actualHours, targetHours, weeklyRevisions, scoreDelta, weakestTopics };
  }, [sessions, settings?.daily_study_goal_hours, revisions, mockTests, topics]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-indigo-500" />
            Weekly Review Summary (Last 7 Days)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Target vs. actual study hours, revisions cleared, test delta, and weak-topic focus.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Study Hours</div>
          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
            {summary.actualHours}h <span className="text-xs font-normal text-slate-400">/ {summary.targetHours}h</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Revisions Cleared</div>
          <div className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
            {summary.weeklyRevisions}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mock Test Delta</div>
          <div className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{summary.scoreDelta}</span>
          </div>
        </div>
      </div>

      {summary.weakestTopics.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            Top 3 Weakest Topics for Next Week
          </div>
          <div className="flex flex-wrap gap-1.5">
            {summary.weakestTopics.map((t) => (
              <span
                key={t.id}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 tabular-nums"
              >
                {t.topic_name} ({getEffectiveConfidence(t)}/5)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
