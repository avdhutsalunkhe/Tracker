import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { DailyHabit, HabitTimeSlot } from '../../types';
import { CircularProgress } from '../common/CircularProgress';
import { AddHabitModal } from './AddHabitModal';
import {
  Check,
  Plus,
  Flame,
  Sun,
  Sunset,
  Moon,
  Clock,
  Trash2,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';

export const HabitList: React.FC = () => {
  const {
    selectedDateHabits,
    selectedDateProgress,
    activeStreak,
    toggleHabit,
    addHabit,
    deleteHabit,
  } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeMenuHabitId, setActiveMenuHabitId] = useState<string | null>(null);

  const timeSlots: Array<{ slot: HabitTimeSlot; label: string; icon: typeof Sun }> = [
    { slot: 'Morning', label: 'Morning Routine', icon: Sun },
    { slot: 'Afternoon', label: 'Afternoon Focus', icon: Clock },
    { slot: 'Evening', label: 'Evening Review', icon: Sunset },
    { slot: 'Anytime', label: 'Daily Discipline', icon: Moon },
  ];

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header Summary */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <CircularProgress
            size={52}
            strokeWidth={5}
            percent={selectedDateProgress.percent}
            colorClass={selectedDateProgress.percent === 100 ? 'text-emerald-500' : 'text-indigo-600 dark:text-indigo-500'}
          >
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">
              {selectedDateProgress.percent}%
            </span>
          </CircularProgress>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daily Routine & Habits
              </h2>
              {activeStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Flame className="w-3 h-3 fill-current" />
                  {activeStreak}d Streak
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDateProgress.completed} of {selectedDateProgress.total} habits completed
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Habit</span>
        </button>
      </div>

      {/* Habit Items by Time Slot */}
      {selectedDateHabits.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
          <p>No habits added yet. Click "+ Add Habit" to kickstart your daily routine!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {timeSlots.map(({ slot, label, icon: SlotIcon }) => {
            const items = selectedDateHabits.filter((h) => h.habit.time_slot === slot);
            if (items.length === 0) return null;

            return (
              <div key={slot} className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-1">
                  <SlotIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{label}</span>
                  <span className="text-[10px] font-normal lowercase">({items.filter(i => i.completed).length}/{items.length})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map(({ habit, completed }) => (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`group relative flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        completed
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-400/50 dark:hover:border-indigo-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {/* Checkbox button */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                            completed
                              ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105'
                              : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500'
                          }`}
                        >
                          {completed && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>

                        <span
                          className={`text-xs font-medium truncate transition-all ${
                            completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                          }`}
                        >
                          {habit.title}
                        </span>
                      </div>

                      {/* Delete icon */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHabit(habit.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-500 transition-all shrink-0"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Habit Modal */}
      <AddHabitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={addHabit}
      />
    </div>
  );
};
