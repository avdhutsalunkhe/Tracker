import React from 'react';
import { useData } from '../../context/DataContext';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { format, parseISO } from 'date-fns';
import {
  X,
  Calendar,
  Check,
  CheckSquare,
  BookOpen,
  RotateCcw,
  Clock,
  Plus,
  Flame,
  Award
} from 'lucide-react';

interface DayDrawerProps {
  date: string | null;
  onClose: () => void;
  onOpenAddTopic?: () => void;
}

export const DayDrawer: React.FC<DayDrawerProps> = ({ date, onClose, onOpenAddTopic }) => {
  const { getDayDetailData, toggleHabit, toggleTask } = useData();

  if (!date) return null;

  const detail = getDayDetailData(date);
  const formattedHeader = format(parseISO(date), 'EEEE, MMMM d, yyyy');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white dark:bg-darkCard border-l border-lightBorder dark:border-darkBorder shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              Day Detail Inspector
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {formattedHeader}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                {detail.totalStudyHours}h Focus Logged
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Habits on this date (Retroactive toggle!) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                Daily Habits ({detail.habits.filter((h) => h.completed).length}/{detail.habits.length})
              </h3>
              <span className="text-[10px] text-slate-400">Click to toggle retroactively</span>
            </div>

            {detail.habits.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No habits configured.</p>
            ) : (
              <div className="space-y-1.5">
                {detail.habits.map(({ habit, completed }) => (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id, date)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                      completed
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`font-medium truncate ${
                        completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {habit.title}
                    </span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        completed ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Tasks for this date */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
              One-Off Tasks ({detail.tasks.filter((t) => t.completed).length}/{detail.tasks.length})
            </h3>

            {detail.tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No one-off tasks logged for this date.</p>
            ) : (
              <div className="space-y-1.5">
                {detail.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs cursor-pointer"
                  >
                    <span
                      className={`font-medium truncate ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {task.title}
                    </span>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        task.completed ? 'bg-emerald-500 text-white' : 'border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: GATE Topics Covered on this date */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
              GATE Topics Studied / Covered ({detail.topicsCovered.length})
            </h3>

            {detail.topicsCovered.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No topics marked as covered on this date.</p>
            ) : (
              <div className="space-y-2">
                {detail.topicsCovered.map((topic) => (
                  <div
                    key={topic.id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{topic.topic_name}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                        {topic.status}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex gap-3">
                      <span>Confidence: {topic.confidence}/5</span>
                      <span>PYQs: {topic.pyqs_solved}</span>
                      <span>Study Hours: {topic.study_hours}h</span>
                    </div>
                    {topic.notes && (
                      <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 max-h-64 overflow-y-auto overflow-x-auto">
                        <MarkdownRenderer text={topic.notes} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Revisions Completed on this date */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              Spaced Revisions Logged ({detail.revisions.length})
            </h3>

            {detail.revisions.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No spaced revisions checked off on this date.</p>
            ) : (
              <div className="space-y-2">
                {detail.revisions.map(({ revision, topicName, subjectName, subjectColor }) => (
                  <div
                    key={revision.id}
                    className="p-3 rounded-xl border border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/15 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{topicName}</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                        Revision #{revision.revision_number}
                      </span>
                    </div>
                    {subjectName && (
                      <span
                        className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
                      >
                        {subjectName}
                      </span>
                    )}
                    {revision.remarks && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Remarks: {revision.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 5: Study Sessions on this date */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Study & Pomodoro Sessions ({detail.studySessions.length})
            </h3>

            {detail.studySessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-1">No timed study sessions recorded for this day.</p>
            ) : (
              <div className="space-y-1.5">
                {detail.studySessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {session.mode} Session
                    </span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {session.duration_minutes} mins
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

