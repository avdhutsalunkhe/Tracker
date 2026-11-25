import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useTimer } from '../../context/TimerContext';
import { CalendarClock, Play, Sparkles, ArrowRight, Check } from 'lucide-react';

export const TodayScheduleWidget: React.FC = () => {
  const navigate = useNavigate();
  const { selectedDate, allottedSlots, autoPlanDay, toggleSlotCompleted } = useData();
  const { setSelectedSubjectId, setSelectedTopicId, startTimer } = useTimer();

  const todaySlots = allottedSlots
    .filter((s) => s.slot_date === selectedDate)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Today's Study Schedule
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {todaySlots.length === 0 && (
            <button
              type="button"
              onClick={() => autoPlanDay(selectedDate)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Plan</span>
            </button>
          )}
          <Link
            to="/timetable"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Timetable</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {todaySlots.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No study blocks planned for {selectedDate}. Click Auto-Plan or open Timetable to generate slots from your free windows.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {todaySlots.slice(0, 6).map((slot) => (
            <div
              key={slot.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                slot.completed
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500/30 opacity-75'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleSlotCompleted(slot.id)}
                  className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                    slot.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border border-slate-300 dark:border-slate-600'
                  }`}
                >
                  {slot.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {slot.start_time}–{slot.end_time}
                  </div>
                  <div className={`font-semibold truncate ${slot.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {slot.title}
                  </div>
                </div>
              </div>

              {!slot.completed && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(slot.subject_id || null);
                    setSelectedTopicId(slot.topic_id || null);
                    startTimer();
                    navigate('/timer');
                  }}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  title="Start Focus Timer"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
