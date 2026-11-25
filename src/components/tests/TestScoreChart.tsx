import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export const TestScoreChart: React.FC = () => {
  const { mockTests, settings } = useData();
  const { theme } = useTheme();
  const targetBenchmark = settings?.target_gate_score ?? 65;

  const isDark = theme === 'dark';

  const chartData = useMemo(() => {
    return [...mockTests]
      .sort((a, b) => a.test_date.localeCompare(b.test_date))
      .map((test) => {
        const percentage = Math.round((test.marks_scored / test.total_marks) * 100);
        const attempted = test.correct_count + test.wrong_count;
        const accuracy = attempted > 0 ? Math.round((test.correct_count / attempted) * 100) : 0;

        return {
          title: test.title.length > 15 ? test.title.substring(0, 15) + '...' : test.title,
          date: test.test_date,
          marks: Number(test.marks_scored.toFixed(1)),
          percentage,
          accuracy,
          negative: Number(test.negative_marks.toFixed(1)),
        };
      });
  }, [mockTests]);

  if (mockTests.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder text-xs text-slate-400">
        Log at least 1 mock test to generate performance trend charts.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          Mock Test Performance & Accuracy Trends
        </h3>
        <span className="text-xs text-slate-400">{mockTests.length} Tests Logged</span>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748B' : '#94A3B8'}
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748B' : '#94A3B8'}
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
                borderRadius: '0.75rem',
                fontSize: '11px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
            <ReferenceLine
              y={targetBenchmark}
              stroke="#F59E0B"
              strokeDasharray="4 4"
              label={{
                value: `Target ${targetBenchmark}%`,
                fill: '#F59E0B',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <Line
              type="monotone"
              dataKey="percentage"
              name="Score %"
              stroke="#6366F1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366F1' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="accuracy"
              name="Accuracy %"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#10B981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

