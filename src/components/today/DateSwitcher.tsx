import React from 'react';
import { useData } from '../../context/DataContext';
import { format, parseISO, isToday, isYesterday, isTomorrow } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw } from 'lucide-react';

export const DateSwitcher: React.FC = () => {
  const { selectedDate, setSelectedDate, goToToday, goToPrevDay, goToNextDay } = useData();

  const dateObj = parseISO(selectedDate);
  const isCurrentDay = isToday(dateObj);

  let dateLabel = format(dateObj, 'EEEE, MMMM d, yyyy');
  let tagText: string | null = null;

  if (isCurrentDay) {
    tagText = 'Today';
  } else if (isYesterday(dateObj)) {
    tagText = 'Yesterday';
  } else if (isTomorrow(dateObj)) {
    tagText = 'Tomorrow';
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder shadow-sm">
      {/* Date Title & Badge */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {dateLabel}
            </h1>
            {tagText && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isCurrentDay
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                }`}
              >
                {tagText}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log habits, tasks, and GATE syllabus coverage for this date.
          </p>
        </div>
      </div>

      {/* Date Navigation Controls */}
      <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-between sm:justify-end">
        <button
          onClick={goToPrevDay}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
          title="Previous Day"
          aria-label="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {!isCurrentDay && (
          <button
            onClick={goToToday}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>
        )}

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
        />

        <button
          onClick={goToNextDay}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-xs"
          title="Next Day"
          aria-label="Next Day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
