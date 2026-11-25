import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { HabitTimeSlot } from '../../types';
import { Plus, Sun, Sunset, Moon, Clock } from 'lucide-react';

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, time_slot: HabitTimeSlot) => Promise<void>;
}

export const AddHabitModal: React.FC<AddHabitModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [timeSlot, setTimeSlot] = useState<HabitTimeSlot>('Morning');
  const [submitting, setSubmitting] = useState(false);

  const slots: Array<{ slot: HabitTimeSlot; label: string; icon: typeof Sun }> = [
    { slot: 'Morning', label: 'Morning', icon: Sun },
    { slot: 'Afternoon', label: 'Afternoon', icon: Clock },
    { slot: 'Evening', label: 'Evening', icon: Sunset },
    { slot: 'Anytime', label: 'Anytime', icon: Moon },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onAdd(title.trim(), timeSlot);
      setTitle('');
      setTimeSlot('Morning');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Daily Routine / Habit"
      subtitle="Recurring discipline habits to track every single day."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Habit Title
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Eat 3 eggs & high protein, Solve 15 PYQs, 30m Walk"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Time of Day Slot
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {slots.map((item) => {
              const Icon = item.icon;
              const isSelected = timeSlot === item.slot;
              return (
                <button
                  type="button"
                  key={item.slot}
                  onClick={() => setTimeSlot(item.slot)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1 text-indigo-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Habit</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
