import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { BarChart3 } from 'lucide-react';

export const StudyBarChart: React.FC = () => {
  const { sessions, settings } = useData();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const goalHours = settings?.daily_study_goal_hours || 6.0;

  // Generate data for the last 14 days
  const chartData = useMemo(() => {
    const today = new Date();
    const result: Array<{ date: string; shortDate: string; hours: number }> = [];

    // Map sessions to dates
    const dateMap = new Map<string, number>();
    sessions.forEach((s) => {
      const current = dateMap.get(s.session_date) || 0;
      dateMap.set(s.session_date, current + (s.duration_minutes || 0) / 60);
    });

    for (let i = 13; i >= 0; i--) {
      const day = subDays(today, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const shortDate = format(day, 'MMM d');
      const hours = Math.round((dateMap.get(dateStr) || 0) * 10) / 10;
      result.push({ date: dateStr, shortDate, hours });
    }

    return result;
  }, [sessions]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            14-Day Study Hours vs Daily Goal
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Target goal: {goalHours} hours/day
          </p>
        </div>
      </div>

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
            <XAxis
              dataKey="shortDate"
              stroke={isDark ? '#64748B' : '#94A3B8'}
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748B' : '#94A3B8'}
              fontSize={10}
              domain={[0, Math.max(goalHours + 2, 8)]}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '11px',
              }}
              formatter={(val) => [`${val} hrs`, 'Study Hours']}
            />
            <ReferenceLine
              y={goalHours}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{
                value: `Goal ${goalHours}h`,
                fill: '#F59E0B',
                fontSize: 10,
                position: 'top',
              }}
            />
            <Bar dataKey="hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

