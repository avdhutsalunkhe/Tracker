import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO } from 'date-fns';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { MistakeCategory, TopicStatus } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { MathText } from '../components/common/MathText';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { parseSubtopics, serializeSubtopics, SubtopicItem } from '../utils/subtopics';
import {
  getStoredTopicStartDate,
  parseMarkdownFormulas,
} from '../utils/markdownFormulas';
import {
  ArrowLeft,
  Save,
  Trash2,
  Star,
  RotateCcw,
  Calendar,
  CheckCircle2,
  BookOpen,
  Plus,
  Check,
  AlertTriangle,
  FileText,
  Upload,
  Sparkles,
  Eye,
  Edit3,
} from 'lucide-react';

export const TopicDetailPage: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const {
    topics,
    subjects,
    revisions,
    mistakes,
    flashcards,
    updateTopic,
    deleteTopic,
    markTopicRevised,
    addMistake,
    toggleMistakeResolved,
    deleteMistake,
    addFlashcard,
    deleteFlashcard,
    clearAllFlashcards,
  } = useData();
  const { showToast } = useToast();

  const topic = useMemo(() => topics.find((t) => t.id === topicId), [topics, topicId]);

  const [subjectId, setSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [subtopics, setSubtopics] = useState<SubtopicItem[]>([]);
  const [newSubtopicTitle, setNewSubtopicTitle] = useState('');
  const [status, setStatus] = useState<TopicStatus>('Not Started');
  const [confidence, setConfidence] = useState(3);
  const [pyqsSolved, setPyqsSolved] = useState(0);
  const [studyHours, setStudyHours] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [coveredDate, setCoveredDate] = useState('');
  const [nextRevisionDate, setNextRevisionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [notesTab, setNotesTab] = useState<'edit' | 'preview'>('edit');
  const notesMdInputRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmClearFormulasOpen, setConfirmClearFormulasOpen] = useState(false);

  // Mistake section state
  const [mistakeTitle, setMistakeTitle] = useState('');
  const [mistakeCategory, setMistakeCategory] = useState<MistakeCategory>('Conceptual Gap');
  const [mistakeSubtopic, setMistakeSubtopic] = useState('');
  const [mistakeFixNote, setMistakeFixNote] = useState('');

  // Formula Vault & .md upload state
  const [formulaTarget, setFormulaTarget] = useState('__topic__');
  const [formulaTitle, setFormulaTitle] = useState('');
  const [formulaBody, setFormulaBody] = useState('');
  const [formulaFilter, setFormulaFilter] = useState('all');
  const mdInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!topic) return;
    setSubjectId(topic.subject_id);
    setTopicName(topic.topic_name);
    setSubtopics(parseSubtopics(topic.subtopic));
    setStatus(topic.status);
    setConfidence(topic.confidence);
    setPyqsSolved(topic.pyqs_solved || 0);
    setStudyHours(topic.study_hours || 0);
    setStartDate(topic.start_date || getStoredTopicStartDate(topic.id));
    setCoveredDate(topic.covered_date || '');
    setNextRevisionDate(topic.next_revision_date || '');
    setNotes(topic.notes || '');
    setNotesTab(topic.notes?.trim() ? 'preview' : 'edit');
  }, [topic]);

  const topicRevisions = useMemo(() => {
    if (!topic) return [];
    return revisions
      .filter((r) => r.topic_id === topic.id)
      .sort((a, b) => b.revision_number - a.revision_number);
  }, [revisions, topic]);

  const topicMistakes = useMemo(() => {
    if (!topic) return [];
    const nameLower = topic.topic_name.toLowerCase();
    return mistakes.filter(
      (m) =>
        m.subject_id === topic.subject_id &&
        (m.title.toLowerCase().includes(nameLower) ||
          (m.fix_note || '').toLowerCase().includes(nameLower))
    );
  }, [mistakes, topic]);

  const topicFormulas = useMemo(() => {
    if (!topic) return [];
    const prefix = `[${topic.topic_name}`;
    return flashcards.filter(
      (c) =>
        c.subject_id === topic.subject_id &&
        c.front_prompt.startsWith(prefix)
    );
  }, [flashcards, topic]);

  const filteredFormulas = useMemo(() => {
    if (!topic) return [];
    if (formulaFilter === 'all') return topicFormulas;
    if (formulaFilter === '__topic__') {
      return topicFormulas.filter((c) => c.front_prompt.startsWith(`[${topic.topic_name}]`));
    }
    return topicFormulas.filter((c) =>
      c.front_prompt.startsWith(`[${topic.topic_name} · ${formulaFilter}]`)
    );
  }, [topicFormulas, formulaFilter, topic]);

  const durationDays = useMemo(() => {
    if (!startDate || !coveredDate) return null;
    try {
      const diff = differenceInDays(parseISO(coveredDate), parseISO(startDate));
      return diff >= 0 ? diff + 1 : null;
    } catch {
      return null;
    }
  }, [startDate, coveredDate]);

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
        subtopic: serializeSubtopics(subtopics),
        status,
        confidence,
        pyqs_solved: Math.max(0, Number(pyqsSolved) || 0),
        study_hours: Math.max(0, Number(studyHours) || 0),
        start_date: startDate || null,
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

  const handleStatusChange = (nextStatus: TopicStatus) => {
    setStatus(nextStatus);
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (nextStatus === 'In Progress' && !startDate) {
      setStartDate(todayStr);
    } else if (nextStatus === 'Completed') {
      if (!startDate) setStartDate(todayStr);
      if (!coveredDate) setCoveredDate(todayStr);
    }
  };

  const handleAddSubtopic = () => {
    const clean = newSubtopicTitle.trim();
    if (!clean) return;
    setSubtopics((prev) => [
      ...prev,
      {
        id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: clean,
        done: false,
        covered_date: null,
      },
    ]);
    setNewSubtopicTitle('');
  };

  const toggleSubtopicDone = (id: string) => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setSubtopics((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextDone = !s.done;
        return {
          ...s,
          done: nextDone,
          covered_date: nextDone ? s.covered_date || todayStr : s.covered_date,
        };
      })
    );
  };

  const updateSubtopicDate = (id: string, dateValue: string) => {
    setSubtopics((prev) =>
      prev.map((s) => (s.id === id ? { ...s, covered_date: dateValue || null } : s))
    );
  };

  const removeSubtopic = (id: string) => {
    setSubtopics((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeTitle.trim()) return;
    const tag = mistakeSubtopic
      ? `[Topic: ${topic.topic_name} · ${mistakeSubtopic}]`
      : `[Topic: ${topic.topic_name}]`;
    const combinedNote = mistakeFixNote.trim() ? `${tag} ${mistakeFixNote.trim()}` : tag;

    await addMistake({
      subject_id: topic.subject_id,
      mock_test_id: null,
      title: mistakeTitle.trim(),
      category: mistakeCategory,
      fix_note: combinedNote,
      image_url: null,
    });
    setMistakeTitle('');
    setMistakeFixNote('');
    setMistakeSubtopic('');
  };

  const getFormulaPrefix = () => {
    if (formulaTarget === '__topic__') return `[${topic.topic_name}]`;
    return `[${topic.topic_name} · ${formulaTarget}]`;
  };

  const handleAddFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulaTitle.trim() || !formulaBody.trim()) return;
    const prompt = `${getFormulaPrefix()} ${formulaTitle.trim()}`;
    await addFlashcard(topic.subject_id, prompt, formulaBody.trim());
    setFormulaTitle('');
    setFormulaBody('');
  };

  const handleMdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseMarkdownFormulas(text, file.name);
      if (parsed.length === 0) {
        showToast({
          type: 'error',
          title: 'Empty Markdown File',
          message: 'No formulas or notes found in the selected .md file.',
        });
        return;
      }
      const prefix = getFormulaPrefix();
      for (const item of parsed) {
        await addFlashcard(topic.subject_id, `${prefix} ${item.title}`, item.body);
      }
      showToast({
        type: 'success',
        title: 'Markdown Imported',
        message: `Added ${parsed.length} formula card${parsed.length === 1 ? '' : 's'} to ${
          formulaTarget === '__topic__' ? topic.topic_name : formulaTarget
        }.`,
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Could not read the selected .md file.',
      });
    } finally {
      e.target.value = '';
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

          <div className="sm:col-span-2">
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
        </div>

        {/* Subtopics Covered Checklist */}
        <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Subtopics Covered ({subtopics.filter((s) => s.done).length}/{subtopics.length})
            </label>
            <span className="text-[11px] text-slate-400">Optional checklist</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtopicTitle}
              onChange={(e) => setNewSubtopicTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtopic();
                }
              }}
              placeholder="Add subtopic (e.g. Pointer Arithmetic, 2D Arrays)..."
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={handleAddSubtopic}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {subtopics.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {subtopics.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleSubtopicDone(sub.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        sub.done
                          ? 'bg-emerald-500 text-white'
                          : 'border border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {sub.done && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className={`truncate font-medium ${sub.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {sub.title}
                    </span>
                  </button>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pl-6 sm:pl-0 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Covered:</span>
                      <input
                        type="date"
                        value={sub.covered_date || ''}
                        onChange={(e) => updateSubtopicDate(sub.id, e.target.value)}
                        aria-label={`Covered date for ${sub.title}`}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSubtopic(sub.id)}
                      className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                      title="Remove subtopic"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  onClick={() => handleStatusChange(s)}
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Study Timeline & Revision
            </span>
            {durationDays !== null && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 tabular-nums">
                {durationDays} {durationDays === 1 ? 'day' : 'days'} span
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                End / Covered Date
              </label>
              <input
                type="date"
                value={coveredDate}
                onChange={(e) => setCoveredDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Next Revision Date
              </label>
              <input
                type="date"
                value={nextRevisionDate}
                onChange={(e) => setNextRevisionDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs tabular-nums outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
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

      {/* Mistakes Section */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Mistakes & Trap Points ({topicMistakes.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Log mistakes made while solving questions on this topic or its subtopics. Synced with Mistake Notebook.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddMistake} className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={mistakeTitle}
              onChange={(e) => setMistakeTitle(e.target.value)}
              placeholder="Mistake / question summary..."
              className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={mistakeCategory}
              onChange={(e) => setMistakeCategory(e.target.value as MistakeCategory)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Conceptual Gap">Conceptual Gap</option>
              <option value="Silly / Calculation">Silly / Calculation</option>
              <option value="Formula Forgotten">Formula Forgotten</option>
              <option value="Time Pressure">Time Pressure</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {subtopics.length > 0 && (
              <select
                value={mistakeSubtopic}
                onChange={(e) => setMistakeSubtopic(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">General Topic</option>
                {subtopics.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
              </select>
            )}
            <input
              type="text"
              value={mistakeFixNote}
              onChange={(e) => setMistakeFixNote(e.target.value)}
              placeholder="Fix rule / correct approach (LaTeX $...$ supported)..."
              className={`${subtopics.length > 0 ? 'sm:col-span-2' : 'sm:col-span-3'} px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!mistakeTitle.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Mistake</span>
            </button>
          </div>
        </form>

        {topicMistakes.length > 0 ? (
          <div className="space-y-2">
            {topicMistakes.map((m) => (
              <div
                key={m.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleMistakeResolved(m.id)}
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                      m.is_resolved
                        ? 'bg-emerald-500 text-white'
                        : 'border border-slate-300 dark:border-slate-600'
                    }`}
                    title={m.is_resolved ? 'Mark unresolved' : 'Mark resolved'}
                  >
                    {m.is_resolved && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${m.is_resolved ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                        {m.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300">
                        {m.category}
                      </span>
                    </div>
                    {m.fix_note && (
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        <MathText text={m.fix_note} />
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMistake(m.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                  title="Delete mistake"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No mistakes logged for this topic yet.</p>
        )}
      </div>

      {/* Notes Section (GitHub Markdown + .md Upload) */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Notes &amp; Markdown (.md) Reader
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload a <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code> file or write notes — rendered like GitHub with code blocks, tables, and LaTeX.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={notesMdInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const text = await file.text();
                  const nextNotes = notes.trim()
                    ? `${notes.trim()}\n\n---\n\n${text.trim()}`
                    : text.trim();
                  setNotes(nextNotes);
                  setNotesTab('preview');
                  await updateTopic(topic.id, { notes: nextNotes || null });
                  showToast({
                    type: 'success',
                    title: 'Markdown Notes Saved',
                    message: `Imported "${file.name}" and rendered in GitHub style.`,
                  });
                } catch {
                  showToast({
                    type: 'error',
                    title: 'Upload Failed',
                    message: 'Could not read the selected .md file.',
                  });
                } finally {
                  e.target.value = '';
                }
              }}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => notesMdInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .md File</span>
            </button>

            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-0.5">
              <button
                type="button"
                onClick={() => setNotesTab('preview')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                  notesTab === 'preview'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>GitHub View</span>
              </button>
              <button
                type="button"
                onClick={() => setNotesTab('edit')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                  notesTab === 'edit'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>

        {notesTab === 'edit' ? (
          <div className="space-y-2.5">
            <textarea
              rows={8}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write GitHub Markdown notes (# Headings, ```python code```, **bold**, tables, or $LaTeX$) or upload a .md file..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              {notes.trim() && (
                <button
                  type="button"
                  onClick={async () => {
                    setNotes('');
                    await updateTopic(topic.id, { notes: null });
                    showToast({ type: 'info', title: 'Notes Cleared' });
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  Clear Notes
                </button>
              )}
              <button
                type="button"
                onClick={async () => {
                  await updateTopic(topic.id, { notes: notes.trim() || null });
                  setNotesTab('preview');
                  showToast({ type: 'success', title: 'Notes Saved' });
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Notes</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/70 min-h-[120px] overflow-x-auto">
            {notes.trim() ? (
              <MarkdownRenderer text={notes} />
            ) : (
              <p className="text-xs text-slate-400">
                No notes yet. Click <span className="font-semibold">Upload .md File</span> or switch to <span className="font-semibold">Edit</span>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Formula Vault & .md Upload Section */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Formula Vault & Markdown (.md) Notes ({topicFormulas.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Add formulas or upload a <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code> file for this topic or any subtopic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {flashcards.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmClearFormulasOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Formulas</span>
              </button>
            )}
            <input
              ref={mdInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleMdFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => mdInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .md File</span>
            </button>
          </div>
        </div>

        {/* Add Formula / Target Selector */}
        <form onSubmit={handleAddFormula} className="space-y-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <select
              value={formulaTarget}
              onChange={(e) => setFormulaTarget(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="__topic__">For Topic: {topic.topic_name}</option>
              {subtopics.map((s) => (
                <option key={s.id} value={s.title}>
                  Subtopic: {s.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={formulaTitle}
              onChange={(e) => setFormulaTitle(e.target.value)}
              placeholder="Formula title / prompt..."
              className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <textarea
            rows={2}
            value={formulaBody}
            onChange={(e) => setFormulaBody(e.target.value)}
            placeholder="Formula or derivation (supports LaTeX $E = mc^2$ or $$...$$)..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!formulaTitle.trim() || !formulaBody.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Formula</span>
            </button>
          </div>
        </form>

        {/* Filter pills */}
        {topicFormulas.length > 0 && subtopics.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFormulaFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                formulaFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({topicFormulas.length})
            </button>
            <button
              type="button"
              onClick={() => setFormulaFilter('__topic__')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                formulaFilter === '__topic__'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Topic
            </button>
            {subtopics.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFormulaFilter(s.title)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  formulaFilter === s.title
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>
        )}

        {filteredFormulas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredFormulas.map((card) => (
              <div
                key={card.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-1.5 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 break-words">
                      <MathText text={card.front_prompt} />
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteFlashcard(card.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 shrink-0"
                    title="Delete formula"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/70 dark:border-slate-800 overflow-x-auto">
                  <MarkdownRenderer text={card.back_answer} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            No formulas saved for this topic yet. Add one above or upload a <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code> file.
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmClearFormulasOpen}
        onClose={() => setConfirmClearFormulasOpen(false)}
        onConfirm={() => clearAllFlashcards()}
        title="Clear All Formulas"
        message={`Delete all ${flashcards.length} formula cards from your Formula Vault?`}
        confirmLabel="Clear All"
      />

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
