import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { GateSubject } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';
import { BookOpen, CheckCircle2, Clock, RotateCcw, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';

interface SubjectCardsProps {
  selectedSubjectId: string | null;
  onSelectSubject: (id: string | null) => void;
  onOpenAddSubject: () => void;
  onOpenSeedModal: () => void;
  onEditSubject: (subject: GateSubject) => void;
}

export const SubjectCards: React.FC<SubjectCardsProps> = ({
  selectedSubjectId,
  onSelectSubject,
  onOpenAddSubject,
  onOpenSeedModal,
  onEditSubject,
}) => {
  const { subjects, topics, revisions, sessions, deleteSubject } = useData();
  const [subjectToDelete, setSubjectToDelete] = useState<GateSubject | null>(null);

  // Compute metrics per subject
  const subjectMetrics = subjects.map((subj) => {
    const subjTopics = topics.filter((t) => t.subject_id === subj.id);
    const totalTopics = subjTopics.length;
    const completedTopics = subjTopics.filter((t) => t.status === 'Completed').length;
    const inProgressTopics = subjTopics.filter((t) => t.status === 'In Progress').length;
    const percent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    const totalHours = subjTopics.reduce((acc, t) => acc + (t.study_hours || 0), 0);
    const totalPyqs = subjTopics.reduce((acc, t) => acc + (t.pyqs_solved || 0), 0);

    const topicIds = new Set(subjTopics.map((t) => t.id));
    const totalRevisions = revisions.filter((r) => topicIds.has(r.topic_id)).length;

    return {
      subject: subj,
      totalTopics,
      completedTopics,
      inProgressTopics,
      percent,
      totalHours: Math.round(totalHours * 10) / 10,
      totalPyqs,
      totalRevisions,
    };
  });

  return (
    <div className="space-y-3">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            GATE Subjects Overview
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click a card to filter syllabus topics below.
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => onSelectSubject(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${selectedSubjectId === null
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
          >
            All Subjects ({topics.length})
          </button>

          <button
            onClick={onOpenAddSubject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subject</span>
          </button>

          <button
            onClick={onOpenSeedModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
            title="Load default GATE branch topics"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Seed Syllabus</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {subjects.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder">
          <BookOpen className="w-8 h-8 text-indigo-500 mx-auto mb-2 opacity-60" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No GATE Subjects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Get started immediately by loading standard syllabus subjects for your engineering branch.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={onOpenSeedModal}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Seed Sample Subjects
            </button>
            <button
              onClick={onOpenAddSubject}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
            >
              Add Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {subjectMetrics.map((item) => {
            const isSelected = selectedSubjectId === item.subject.id;

            return (
              <div
                key={item.subject.id}
                onClick={() => onSelectSubject(isSelected ? null : item.subject.id)}
                className={`group p-4 rounded-2xl border transition-all cursor-pointer relative select-none flex flex-col justify-between ${isSelected
                    ? 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-darkCard border-lightBorder dark:border-darkBorder hover:border-indigo-400/60 dark:hover:border-indigo-500/60'
                  }`}
              >
                <div>
                  {/* Subject Name & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs mt-1"
                        style={{ backgroundColor: item.subject.color }}
                      />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 break-words line-clamp-2">
                        {item.subject.name}
                      </h3>
                    </div>

                    <div className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditSubject(item.subject);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubjectToDelete(item.subject);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-500"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Syllabus Covered</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.percent === 100 ? '#10B981' : item.subject.color,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Topics</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.completedTopics}/{item.totalTopics}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Hours</div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {item.totalHours}h
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Revisions</div>
                    <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {item.totalRevisions}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(subjectToDelete)}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) return deleteSubject(subjectToDelete.id);
        }}
        title="Delete GATE Subject"
        message={`Are you sure you want to delete "${subjectToDelete?.name}" and all of its topics?`}
        confirmLabel="Delete Subject"
      />
    </div>
  );
};

