import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

export const SubjectDonutChart: React.FC = () => {
  const { subjects, sessions, topics } = useData();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    // Map sessions to subjects
    const subjMap = new Map<string, number>();

    sessions.forEach((s) => {
      let subjId = s.subject_id;
      if (!subjId && s.topic_id) {
        const top = topics.find((t) => t.id === s.topic_id);
        subjId = top?.subject_id || null;
      }
      if (subjId) {
        const current = subjMap.get(subjId) || 0;
        subjMap.set(subjId, current + (s.duration_minutes || 0) / 60);
      }
    });

    // Also include study_hours directly logged on topics
    topics.forEach((t) => {
      if (t.study_hours > 0 && !subjMap.has(t.subject_id)) {
        subjMap.set(t.subject_id, t.study_hours);
      }
    });

    const result = subjects
      .map((s) => {
        const hours = Math.round((subjMap.get(s.id) || 0) * 10) / 10;
        return {
          name: s.name,
          value: hours,
          color: s.color,
        };
      })
      .filter((s) => s.value > 0);

    return result;
  }, [subjects, sessions, topics]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 shadow-sm text-center text-xs text-slate-400">
        <PieChartIcon className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-50" />
        No subject study time recorded yet. Link your study timer sessions to subjects!
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-indigo-500" />
          Subject Time Distribution
        </h3>
        <span className="text-xs text-slate-400">Hours spent per subject</span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '11px',
              }}
              formatter={(val) => [`${val} hrs`, 'Focus Time']}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

