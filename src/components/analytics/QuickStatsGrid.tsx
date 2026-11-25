import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Clock, Flame, BookOpen, Award, CheckCircle2, TrendingUp } from 'lucide-react';

export const QuickStatsGrid: React.FC = () => {
  const { sessions, activeStreak, topics, mockTests, habits, habitLogs } = useData();

  const totalStudyHours = useMemo(() => {
    const totalMinutes = sessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [sessions]);

  const syllabusProgress = useMemo(() => {
    const total = topics.length;
    const completed = topics.filter((t) => t.status === 'Completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [topics]);

  const testAverage = useMemo(() => {
    if (mockTests.length === 0) return { avgMarks: 0, avgPercent: 0 };
    const totalMarksScored = mockTests.reduce((acc, t) => acc + t.marks_scored, 0);
    const totalMarksPossible = mockTests.reduce((acc, t) => acc + t.total_marks, 0);
    const avgPercent = totalMarksPossible > 0 ? Math.round((totalMarksScored / totalMarksPossible) * 100) : 0;
    return {
      avgMarks: (totalMarksScored / mockTests.length).toFixed(1),
      avgPercent,
    };
  }, [mockTests]);

  const stats = [
    {
      label: 'Total Focus Hours',
      value: `${totalStudyHours}h`,
      subtext: `${sessions.length} study sessions logged`,
      icon: Clock,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      label: 'Habit Consistency Streak',
      value: `${activeStreak} Days`,
      subtext: 'Consecutive daily discipline',
      icon: Flame,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      label: 'GATE Syllabus Covered',
      value: `${syllabusProgress.percent}%`,
      subtext: `${syllabusProgress.completed} / ${syllabusProgress.total} topics completed`,
      icon: BookOpen,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      label: 'Mock Test Average',
      value: `${testAverage.avgPercent}%`,
      subtext: `${mockTests.length} tests evaluated`,
      icon: Award,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className="p-4 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder shadow-2xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {item.label}
              </span>
              <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{item.subtext}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
