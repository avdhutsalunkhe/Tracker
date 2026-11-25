import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PriorityLevel } from '../../types';
import { Plus, Flag } from 'lucide-react';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, priority: PriorityLevel) => Promise<void>;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [submitting, setSubmitting] = useState(false);

  const priorities: Array<{ level: PriorityLevel; label: string; color: string }> = [
    { level: 'Low', label: 'Low', color: 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300' },
    { level: 'Medium', label: 'Medium', color: 'border-amber-400 text-amber-600 dark:border-amber-500/50 dark:text-amber-400' },
    { level: 'High', label: 'High Priority', color: 'border-rose-400 text-rose-600 dark:border-rose-500/50 dark:text-rose-400' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onAdd(title.trim(), priority);
      setTitle('');
      setPriority('Medium');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add One-Off Daily Task"
      subtitle="A task specific to the selected date."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Task Description
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete Discrete Maths PYQ Set 2, Watch 2 DBMS Lectures"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Priority Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {priorities.map((item) => {
              const isSelected = priority === item.level;
              return (
                <button
                  type="button"
                  key={item.level}
                  onClick={() => setPriority(item.level)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }`}
                >
                  <Flag className="w-3.5 h-3.5" />
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
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

