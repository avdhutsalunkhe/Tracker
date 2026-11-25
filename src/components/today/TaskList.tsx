import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { DailyTask, PriorityLevel } from '../../types';
import { AddTaskModal } from './AddTaskModal';
import { Check, Plus, Trash2, CheckCircle2, ListTodo } from 'lucide-react';

export const TaskList: React.FC = () => {
  const { selectedDateTasks, selectedDate, toggleTask, addTask, deleteTask } = useData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const getPriorityBadge = (p: PriorityLevel) => {
    if (p === 'High') {
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
    }
    if (p === 'Medium') {
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
    }
    return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30';
  };

  const completedCount = selectedDateTasks.filter((t) => t.completed).length;

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <ListTodo className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                One-Off Daily Tasks
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {completedCount}/{selectedDateTasks.length} Done
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tasks specific to {selectedDate}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Add Task</span>
        </button>
      </div>

      {/* Tasks List */}
      {selectedDateTasks.length === 0 ? (
        <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
          No one-off tasks for this date. Click "+ Add Task" to schedule something specific.
        </div>
      ) : (
        <div className="space-y-2">
          {selectedDateTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${task.completed
                  ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800/60 opacity-80'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-indigo-400/60'
                }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${task.completed
                      ? 'bg-emerald-500 text-white'
                      : 'border-2 border-slate-300 dark:border-slate-600 group-hover:border-indigo-500'
                    }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <span
                  className={`text-xs font-medium truncate ${task.completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                    }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityBadge(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-500 transition-all"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={(title, priority) => addTask(title, priority, selectedDate)}
      />
    </div>
  );
};

