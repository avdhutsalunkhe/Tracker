import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { TopicStatus } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  ArrowLeft,
  Save,
  Trash2,
  Star,
  RotateCcw,
  Calendar,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const { topics, subjects, revisions, updateTopic, deleteTopic, markTopicRevised } = useData();
  const { showToast } = useToast();

  const topic = useMemo(() => topics.find((t) => t.id === topicId), [topics, topicId]);

  const [subjectId, setSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [status, setStatus] = useState<TopicStatus>('Not Started');
  const [confidence, setConfidence] = useState(3);
  const [pyqsSolved, setPyqsSolved] = useState(0);
  const [studyHours, setStudyHours] = useState(0);
  const [coveredDate, setCoveredDate] = useState('');
  const [nextRevisionDate, setNextRevisionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!topic) return;
    setSubjectId(topic.subject_id);
    setTopicName(topic.topic_name);
    setSubtopic(topic.subtopic || '');
    setStatus(topic.status);
    setConfidence(topic.confidence);
    setPyqsSolved(topic.pyqs_solved || 0);
    setStudyHours(topic.study_hours || 0);
    setCoveredDate(topic.covered_date || '');
    setNextRevisionDate(topic.next_revision_date || '');
    setNotes(topic.notes || '');
  }, [topic]);

  const topicRevisions = useMemo(() => {
    if (!topic) return [];
    return revisions
      .filter((r) => r.topic_id === topic.id)
      .sort((a, b) => b.revision_number - a.revision_number);
  }, [revisions, topic]);

  if (!topic) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder text-center space-y-4">
        <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Topic Not Found</h2>
        <p className="text-xs text-slate-500">This topic may have been deleted or not yet loaded.</p>
        <button
          onClick={() => navigate('/gate')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Back to GATE Study
        </button>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    setSaving(true);
    try {
      await updateTopic(topic.id, {
        subject_id: subjectId,
        topic_name: topicName.trim(),
        subtopic: subtopic.trim() || null,
        status,
        confidence,
        pyqs_solved: Math.max(0, Number(pyqsSolved) || 0),
        study_hours: Math.max(0, Number(studyHours) || 0),
        covered_date: coveredDate || null,
        next_revision_date: nextRevisionDate || null,
        notes: notes.trim() || null,
      });
      showToast({
        type: 'success',
        title: 'Topic Updated',
        message: `"${topicName.trim()}" saved successfully.`,
      });
      navigate('/gate');
    } finally {
      setSaving(false);
    }
  };

  const statuses: TopicStatus[] = ['Not Started', 'In Progress', 'Completed'];

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/gate')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to GATE Study</span>
        </button>

        <button
          type="button"
          onClick={() => setConfirmDeleteOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Topic</span>
        </button>
      </div>

      {/* Main Edit Form */}
      <form
        onSubmit={handleSave}
        className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-5"
      >
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            Update Topic Details
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Edit status, confidence, PYQs solved, study hours, and revision schedule.
          </p>
        </div>

        {/* Subject + Topic + Subtopic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Topic / Chapter Name
            </label>
            <input
              type="text"
              required
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subtopic <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g. Pointer Arithmetic, 2D Arrays"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status */}
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
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
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

        {/* Confidence */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Confidence Rating
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
                  className={`w-6 h-6 ${
                    star <= confidence
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            ))}
            <span className="text-xs font-bold text-slate-500 ml-2 tabular-nums">
              {confidence}/5
            </span>
          </div>
        </div>

        {/* PYQs & Hours with quick increment buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              PYQs Solved
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={pyqsSolved}
                onChange={(e) => setPyqsSolved(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setPyqsSolved((p) => p + 5)}
                className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 tabular-nums"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => setPyqsSolved((p) => p + 10)}
                className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 tabular-nums"
              >
                +10
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Study Hours
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.5"
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setStudyHours((h) => Math.round((h + 0.5) * 10) / 10)}
                className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 tabular-nums"
              >
                +0.5h
              </button>
              <button
                type="button"
                onClick={() => setStudyHours((h) => Math.round((h + 1) * 10) / 10)}
                className="px-2.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0 tabular-nums"
              >
                +1h
              </button>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Covered Date
            </label>
            <input
              type="date"
              value={coveredDate}
              onChange={(e) => setCoveredDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Next Revision Date
            </label>
            <input
              type="date"
              value={nextRevisionDate}
              onChange={(e) => setNextRevisionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Short Notes / Formula Reminders
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key formulas, edge-case conditions, or trap points..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/gate')}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !topicName.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>

      {/* Revision History & Quick Mark Revised */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              Revisions ({topic.revision_count || 0})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {topic.next_revision_date
                ? `Next scheduled: ${topic.next_revision_date}`
                : 'Mark Completed to auto-schedule spaced repetition.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => markTopicRevised(topic.id, 'Revised from topic detail page')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Revised Now</span>
          </button>
        </div>

        {topicRevisions.length > 0 && (
          <div className="space-y-2">
            {topicRevisions.map((rev) => (
              <div
                key={rev.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    Revision #{rev.revision_number}
                  </span>
                  {rev.remarks && (
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">{rev.remarks}</p>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1 tabular-nums">
                  <Calendar className="w-3 h-3" />
                  {rev.revised_on}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={async () => {
          await deleteTopic(topic.id);
          navigate('/gate');
        }}
        title="Delete Topic"
        message={`Are you sure you want to delete "${topic.topic_name}"?`}
        confirmLabel="Delete Topic"
      />
    </div>
  );
};
