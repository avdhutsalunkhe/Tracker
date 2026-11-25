import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { format, subDays, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Flame, Info } from 'lucide-react';

interface ConsistencyHeatmapProps {
  onSelectDate?: (date: string) => void;
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ onSelectDate }) => {
  const { habitLogs, sessions, setSelectedDate } = useData();

  // Generate 365 days leading up to today
  const days = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, 364);
    return eachDayOfInterval({ start: startDate, end: today });
  }, []);

  // Compute stats per date
  const statsMap = useMemo(() => {
    const map = new Map<string, { habitsCount: number; hours: number; intensity: number }>();

    // Accumulate habit counts
    habitLogs.forEach((l) => {
      if (l.completed) {
        const curr = map.get(l.log_date) || { habitsCount: 0, hours: 0, intensity: 0 };
        curr.habitsCount += 1;
        map.set(l.log_date, curr);
      }
    });

    // Accumulate study hours
    sessions.forEach((s) => {
      const curr = map.get(s.session_date) || { habitsCount: 0, hours: 0, intensity: 0 };
      curr.hours += (s.duration_minutes || 0) / 60;
      map.set(s.session_date, curr);
    });

    // Calculate intensity 0 to 4
    map.forEach((val) => {
      let score = 0;
      if (val.habitsCount > 0) score += Math.min(2, val.habitsCount);
      if (val.hours > 0) score += val.hours >= 4 ? 2 : 1;
      val.intensity = Math.min(4, score);
    });

    return map;
  }, [habitLogs, sessions]);

  // Group days by columns of weeks (7 days per column)
  const weeks = useMemo(() => {
    const cols: Array<Date[]> = [];
    let currentWeek: Date[] = [];

    days.forEach((day, index) => {
      currentWeek.push(day);
      if (currentWeek.length === 7 || index === days.length - 1) {
        cols.push(currentWeek);
        currentWeek = [];
      }
    });
    return cols;
  }, [days]);

  const getCellColor = (intensity: number) => {
    switch (intensity) {
      case 1:
        return 'bg-indigo-300 dark:bg-indigo-900/60 hover:ring-1 hover:ring-indigo-400';
      case 2:
        return 'bg-indigo-400 dark:bg-indigo-700 hover:ring-1 hover:ring-indigo-300';
      case 3:
        return 'bg-indigo-500 dark:bg-indigo-600 hover:ring-1 hover:ring-indigo-300';
      case 4:
        return 'bg-emerald-500 dark:bg-emerald-500 shadow-xs shadow-emerald-500/30 hover:ring-1 hover:ring-emerald-300';
      default:
        return 'bg-slate-200 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700';
    }
  };

  const handleCellClick = (dateStr: string) => {
    if (onSelectDate) onSelectDate(dateStr);
    else setSelectedDate(dateStr);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-500" />
            365-Day Study & Routine Consistency Grid
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            (Habits completed + Study Hours logged)
          </span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium self-end sm:self-auto">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[2px] bg-slate-200 dark:bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-300 dark:bg-indigo-900/60" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-400 dark:bg-indigo-700" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-indigo-500 dark:bg-indigo-600" />
          <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
          <span>More</span>
        </div>
      </div>

      {/* Grid container with horizontal scroll */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="flex gap-[3.5px] min-w-max">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-[3.5px]">
              {week.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const stat = statsMap.get(dateStr) || { habitsCount: 0, hours: 0, intensity: 0 };
                const formattedTooltip = `${format(day, 'MMM d, yyyy')}: ${stat.habitsCount} habits, ${stat.hours.toFixed(1)}h focus`;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleCellClick(dateStr)}
                    title={formattedTooltip}
                    className={`w-[11px] h-[11px] rounded-[2.5px] transition-all cursor-pointer ${getCellColor(
                      stat.intensity
                    )}`}
                    aria-label={formattedTooltip}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

