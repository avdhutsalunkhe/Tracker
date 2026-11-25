import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { TopicStatus, GateTopic } from '../../types';
import { Plus, Star } from 'lucide-react';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
  topicToEdit?: GateTopic | null;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  defaultSubjectId,
  topicToEdit,
}) => {
  const { subjects, addTopic, updateTopic, selectedDate } = useData();

  const [subjectId, setSubjectId] = useState(
    topicToEdit ? topicToEdit.subject_id : defaultSubjectId || (subjects[0]?.id || '')
  );
  const [topicName, setTopicName] = useState(topicToEdit ? topicToEdit.topic_name : '');
  const [subtopic, setSubtopic] = useState(topicToEdit?.subtopic || '');
  const [status, setStatus] = useState<TopicStatus>(topicToEdit ? topicToEdit.status : 'In Progress');
  const [confidence, setConfidence] = useState<number>(topicToEdit ? topicToEdit.confidence : 3);
  const [pyqsSolved, setPyqsSolved] = useState<number>(topicToEdit ? topicToEdit.pyqs_solved : 10);
  const [studyHours, setStudyHours] = useState<number>(topicToEdit ? topicToEdit.study_hours : 1.5);
  const [notes, setNotes] = useState(topicToEdit?.notes || '');
  const [coveredDate, setCoveredDate] = useState(
    topicToEdit ? topicToEdit.covered_date || selectedDate : selectedDate
  );
  const [submitting, setSubmitting] = useState(false);

  // Sync form state whenever modal opens or target subject/topic changes
  useEffect(() => {
    if (!isOpen) return;
    if (topicToEdit) {
      setSubjectId(topicToEdit.subject_id);
      setTopicName(topicToEdit.topic_name);
      setSubtopic(topicToEdit.subtopic || '');
      setStatus(topicToEdit.status);
      setConfidence(topicToEdit.confidence);
      setPyqsSolved(topicToEdit.pyqs_solved);
      setStudyHours(topicToEdit.study_hours);
      setNotes(topicToEdit.notes || '');
      setCoveredDate(topicToEdit.covered_date || selectedDate);
    } else {
      setSubjectId(defaultSubjectId || subjects[0]?.id || '');
      setTopicName('');
      setSubtopic('');
      setStatus('In Progress');
      setConfidence(3);
      setPyqsSolved(10);
      setStudyHours(1.5);
      setNotes('');
      setCoveredDate(selectedDate);
    }
  }, [isOpen, topicToEdit, defaultSubjectId, subjects, selectedDate]);

  const statuses: TopicStatus[] = ['Not Started', 'In Progress', 'Completed'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedSubjectId = subjectId || subjects[0]?.id || '';
    if (!topicName.trim() || !resolvedSubjectId) return;

    setSubmitting(true);
    try {
      if (topicToEdit) {
        await updateTopic(topicToEdit.id, {
          subject_id: resolvedSubjectId,
          topic_name: topicName.trim(),
          subtopic: subtopic.trim() || null,
          status,
          confidence,
          pyqs_solved: Number(pyqsSolved) || 0,
          study_hours: Number(studyHours) || 0,
          notes: notes.trim() || null,
          covered_date: status === 'Completed' || status === 'In Progress' ? coveredDate : null,
        });
      } else {
        await addTopic({
          subject_id: resolvedSubjectId,
          topic_name: topicName.trim(),
          subtopic: subtopic.trim() || null,
          status,
          confidence,
          pyqs_solved: Number(pyqsSolved) || 0,
          study_hours: Number(studyHours) || 0,
          notes: notes.trim() || null,
          covered_date: status === 'Completed' || status === 'In Progress' ? coveredDate : null,
        });
      }
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={topicToEdit ? 'Edit GATE Topic' : 'Log GATE Topic Coverage'}
      subtitle="Track your mastery, PYQs solved, and schedule spaced repetition."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Subject select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            GATE Subject
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Topic / Chapter Name
          </label>
          <input
            type="text"
            required
            autoFocus
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="e.g. Asymptotic Notation, Paging & Segmentation, Cache Mapping"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Subtopic (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Subtopic <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <input
            type="text"
            value={subtopic}
            onChange={(e) => setSubtopic(e.target.value)}
            placeholder="e.g. 2D Arrays, Pointer Arithmetic, KMP Pattern Matching"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Status Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Coverage Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            {statuses.map((s) => {
              const isSelected = status === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${isSelected
                      ? s === 'Completed'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                        : 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confidence 1 to 5 Star Rating */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Confidence Rating (1 to 5)
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setConfidence(star)}
                className="p-1 rounded-lg hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-6 h-6 ${star <= confidence
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                    }`}
                />
              </button>
            ))}
            <span className="text-xs font-bold text-slate-500 ml-2">
              {confidence === 5
                ? 'Mastered'
                : confidence === 4
                  ? 'Strong'
                  : confidence === 3
                    ? 'Moderate'
                    : confidence === 2
                      ? 'Shaky'
                      : 'Need Basics'}
            </span>
          </div>
        </div>

        {/* PYQs Solved & Study Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              PYQs Solved
            </label>
            <input
              type="number"
              min="0"
              value={pyqsSolved}
              onChange={(e) => setPyqsSolved(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Study Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={studyHours}
              onChange={(e) => setStudyHours(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Covered Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Date Studied / Covered
          </label>
          <input
            type="date"
            value={coveredDate || ''}
            onChange={(e) => setCoveredDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />
        </div>

        {/* Short Notes & Formula Reminders */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Short Notes / Formula Reminders
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key formulas, edge-case conditions, or trap points for quick revision..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
            disabled={submitting || !topicName.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{topicToEdit ? 'Save Changes' : 'Save Topic'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

