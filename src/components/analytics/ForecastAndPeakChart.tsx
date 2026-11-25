import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { addDays, format, parseISO, differenceInCalendarDays } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

export const ForecastAndPeakChart: React.FC = () => {
  const { topics, sessions, settings } = useData();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Syllabus completion forecast based on recent 14-day topic completion pace
  const forecast = useMemo(() => {
    const total = topics.length;
    const completed = topics.filter((t) => t.status === 'Completed').length;
    const remaining = Math.max(0, total - completed);
    if (total === 0) return { label: 'Add syllabus topics to forecast completion.', onTrack: true };
    if (remaining === 0) return { label: '100% Syllabus Completed! Focus on full-length mocks & revisions.', onTrack: true };

    const twoWeeksAgo = format(addDays(new Date(), -14), 'yyyy-MM-dd');
    const recentCompleted = topics.filter(
      (t) => t.status === 'Completed' && t.covered_date && t.covered_date >= twoWeeksAgo
    ).length;

    const topicsPerDay = recentCompleted > 0 ? recentCompleted / 14 : 0.25;
    const estDays = Math.ceil(remaining / topicsPerDay);
    const estDate = addDays(new Date(), estDays);
    const estDateStr = format(estDate, 'MMM d, yyyy');

    const examDate = settings?.gate_exam_date || '2027-02-06';
    const daysToExam = differenceInCalendarDays(parseISO(examDate), new Date());
    const onTrack = estDays <= Math.max(0, daysToExam - 30);

    return {
      label: `At your recent pace (${(topicsPerDay * 7).toFixed(1)} topics/week), remaining ${remaining} topics finish around ${estDateStr}.`,
      onTrack,
    };
  }, [topics, settings?.gate_exam_date]);

  // Peak-Hour Focus Chart (sessions grouped by hour-of-day)
  const peakHoursData = useMemo(() => {
    const buckets = new Map<number, { deepMins: number; otherMins: number }>();
    sessions.forEach((s) => {
      const dt = s.created_at ? new Date(s.created_at) : null;
      const hour = dt && !Number.isNaN(dt.getTime()) ? dt.getHours() : 10;
      const curr = buckets.get(hour) || { deepMins: 0, otherMins: 0 };
      if ((s.focus_quality || 'Deep') === 'Deep') {
        curr.deepMins += s.duration_minutes || 0;
      } else {
        curr.otherMins += s.duration_minutes || 0;
      }
      buckets.set(hour, curr);
    });

    const rows: Array<{ hour: string; deepHours: number; otherHours: number }> = [];
    for (let h = 5; h <= 23; h++) {
      const val = buckets.get(h);
      if (val && (val.deepMins > 0 || val.otherMins > 0)) {
        rows.push({
          hour: `${String(h).padStart(2, '0')}:00`,
          deepHours: Math.round((val.deepMins / 60) * 10) / 10,
          otherHours: Math.round((val.otherMins / 60) * 10) / 10,
        });
      }
    }
    return rows;
  }, [sessions]);

  return (
    <div className="space-y-4">
      {/* Syllabus Forecast Banner */}
      <div
        className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
          forecast.onTrack
            ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'
            : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200'
        }`}
      >
        <TrendingUp className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Syllabus Completion Forecast: </span>
          <span>{forecast.label}</span>
        </div>
      </div>

      {/* Peak-Hour Focus Chart */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Peak-Hour Focus Distribution
          </h3>
          <span className="text-xs text-slate-400">Deep vs Average/Distracted hours</span>
        </div>

        {peakHoursData.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Log focus sessions via the Study Timer to reveal your peak productivity hours.
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1E293B' : '#E2E8F0'} />
                <XAxis dataKey="hour" stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
                <YAxis stroke={isDark ? '#64748B' : '#94A3B8'} fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    borderRadius: '0.75rem',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="deepHours" name="Deep Focus (h)" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="otherHours" name="Other Focus (h)" stackId="a" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
