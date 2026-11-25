import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { DayDrawer } from './DayDrawer';

export const MonthlyCalendar: React.FC = () => {
  const { habits, habitLogs, topics, revisions, sessions, selectedDate, setSelectedDate } = useData();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());
  const [inspectDate, setInspectDate] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToCurrentMonth = () => setCurrentMonth(new Date());

  // Generate calendar grid days (including boundary days from prev/next months)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  // Aggregate completion data per date
  const dateDataMap = useMemo(() => {
    const map = new Map<
      string,
      {
        totalHabits: number;
        completedHabits: number;
        habitPercent: number;
        hasGateActivity: boolean;
        studyHours: number;
      }
    >();

    const activeHabitsCount = habits.filter((h) => h.is_active).length;

    // Habit completion
    habitLogs.forEach((l) => {
      if (l.completed) {
        const curr = map.get(l.log_date) || {
          totalHabits: activeHabitsCount,
          completedHabits: 0,
          habitPercent: 0,
          hasGateActivity: false,
          studyHours: 0,
        };
        curr.completedHabits += 1;
        curr.habitPercent = activeHabitsCount > 0 ? Math.round((curr.completedHabits / activeHabitsCount) * 100) : 0;
        map.set(l.log_date, curr);
      }
    });

    // GATE Topics covered
    topics.forEach((t) => {
      if (t.covered_date) {
        const curr = map.get(t.covered_date) || {
          totalHabits: activeHabitsCount,
          completedHabits: 0,
          habitPercent: 0,
          hasGateActivity: true,
          studyHours: 0,
        };
        curr.hasGateActivity = true;
        map.set(t.covered_date, curr);
      }
    });

    // Revisions
    revisions.forEach((r) => {
      const curr = map.get(r.revised_on) || {
        totalHabits: activeHabitsCount,
        completedHabits: 0,
        habitPercent: 0,
        hasGateActivity: true,
        studyHours: 0,
      };
      curr.hasGateActivity = true;
      map.set(r.revised_on, curr);
    });

    // Sessions
    sessions.forEach((s) => {
      const curr = map.get(s.session_date) || {
        totalHabits: activeHabitsCount,
        completedHabits: 0,
        habitPercent: 0,
        hasGateActivity: true,
        studyHours: 0,
      };
      curr.hasGateActivity = true;
      curr.studyHours += (s.duration_minutes || 0) / 60;
      map.set(s.session_date, curr);
    });

    return map;
  }, [habits, habitLogs, topics, revisions, sessions]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Month Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any date to inspect details or toggle habits retroactively.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={goToCurrentMonth}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
        {daysOfWeek.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrMonth = isSameMonth(day, currentMonth);
          const isTodayDate = isToday(day);
          const isSelected = selectedDate === dateStr;
          const data = dateDataMap.get(dateStr);

          // Habit completion progress bar or ring color
          const habitPercent = data?.habitPercent || 0;
          const hasGate = Boolean(data?.hasGateActivity);

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setInspectDate(dateStr);
              }}
              className={`min-h-[64px] sm:min-h-[82px] p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative select-none ${
                !isCurrMonth
                  ? 'opacity-30 bg-slate-50/40 dark:bg-slate-900/30 border-transparent'
                  : isTodayDate
                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500/50 shadow-xs'
                  : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-500/60'
              } ${isSelected ? 'ring-2 ring-indigo-500 shadow-sm' : ''}`}
            >
              {/* Top Row: Date Number + Indicators */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                    isTodayDate
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Secondary GATE Activity Dot */}
                {hasGate && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/40"
                    title="GATE activity logged (topic studied, revised, or timed focus)"
                  />
                )}
              </div>

              {/* Bottom Row: Habit Progress Bar or Hours Badge */}
              <div className="space-y-1 mt-1">
                {data && data.studyHours > 0 && (
                  <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {data.studyHours.toFixed(1)}h
                  </div>
                )}

                {habitPercent > 0 && (
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        habitPercent === 100
                          ? 'bg-emerald-500'
                          : habitPercent >= 50
                          ? 'bg-indigo-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${habitPercent}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>GATE Study Activity Dot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-1 rounded-full bg-indigo-500" />
          <span>Habit Completion Progress Bar</span>
        </div>
      </div>

      {/* Day Drawer */}
      <DayDrawer date={inspectDate} onClose={() => setInspectDate(null)} />
    </div>
  );
};

