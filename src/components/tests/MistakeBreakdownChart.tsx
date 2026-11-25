import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { MistakeCategory } from '../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle } from 'lucide-react';

export const MistakeBreakdownChart: React.FC = () => {
  const { mistakes } = useData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    const categories: MistakeCategory[] = [
      'Conceptual Gap',
      'Silly / Calculation',
      'Formula Forgotten',
      'Time Pressure',
    ];
    return categories.map((cat) => {
      const matching = mistakes.filter((m) => m.category === cat);
      const unresolved = matching.filter((m) => !m.is_resolved).length;
      return {
        category: cat.replace(' / Calculation', ''),
        total: matching.length,
        unresolved,
      };
    });
  }, [mistakes]);

  if (mistakes.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Mistake Category Breakdown
        </h3>
        <span className="text-xs text-slate-400 tabular-nums">{mistakes.length} logged</span>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
            <XAxis dataKey="category" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
            <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} allowDecimals={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '11px',
              }}
            />
            <Bar dataKey="total" name="Total Mistakes" fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unresolved" name="Unresolved" fill="#F43F5E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
