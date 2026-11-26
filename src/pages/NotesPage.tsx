import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { GATE_SYLLABUS_PAPERS } from '../lib/syllabusData';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import {
  FileText,
  Upload,
  Search,
  ExternalLink,
  BookOpen,
  Edit3,
  Eye,
  Save,
  Trash2,
} from 'lucide-react';

const SUBJECT_PAPER_MAP_KEY = 'avdhut_subject_paper_map_v1';

function inferPaperForSubject(subjectName: string): 'DA' | 'CS' {
  const lower = subjectName.trim().toLowerCase();
  const daPaper = GATE_SYLLABUS_PAPERS.find((p) => p.code === 'DA');
  if (
    daPaper?.sections.some(
      (sec) =>
        sec.title.toLowerCase() === lower ||
        lower.includes('python') ||
        lower.includes('machine learning') ||
        lower.includes('artificial intelligence') ||
        lower === 'ai' ||
        lower.includes('data science') ||
        lower.includes('probability') ||
        lower.includes('optimization') ||
        lower.includes('warehousing')
    )
  ) {
    return 'DA';
  }
  return 'CS';
}

function loadSubjectPaperMap(): Record<string, 'DA' | 'CS'> {
  try {
    const raw = localStorage.getItem(SUBJECT_PAPER_MAP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const NotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { subjects, topics, updateTopic } = useData();
  const { showToast } = useToast();

  const [paperFilter, setPaperFilter] = useState<'ALL' | 'DA' | 'CS'>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectPaperMap, setSubjectPaperMap] = useState<Record<string, 'DA' | 'CS'>>(loadSubjectPaperMap);

  // Quick .md upload target
  const [uploadSubjectId, setUploadSubjectId] = useState<string>('');
  const [uploadTopicId, setUploadTopicId] = useState<string>('');
  const mdInputRef = useRef<HTMLInputElement | null>(null);

  // Inline edit state per topic
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState('');

  const getSubjectPaper = (subjId: string, subjName: string): 'DA' | 'CS' => {
    return subjectPaperMap[subjId] || inferPaperForSubject(subjName);
  };

  const setSubjectPaper = (subjId: string, paper: 'DA' | 'CS') => {
    const next = { ...subjectPaperMap, [subjId]: paper };
    setSubjectPaperMap(next);
    try {
      localStorage.setItem(SUBJECT_PAPER_MAP_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (paperFilter === 'ALL') return true;
      return getSubjectPaper(s.id, s.name) === paperFilter;
    });
  }, [subjects, paperFilter, subjectPaperMap]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, (typeof subjects)[0]>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const uploadSubjectTopics = useMemo(() => {
    if (!uploadSubjectId) return [];
    return topics.filter((t) => t.subject_id === uploadSubjectId);
  }, [topics, uploadSubjectId]);

  const filteredTopics = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return topics.filter((t) => {
      const subj = subjectMap.get(t.subject_id);
      if (!subj) return false;
      const paper = getSubjectPaper(subj.id, subj.name);
      if (paperFilter !== 'ALL' && paper !== paperFilter) return false;
      if (selectedSubjectId !== 'ALL' && t.subject_id !== selectedSubjectId) return false;
      if (q) {
        return (
          t.topic_name.toLowerCase().includes(q) ||
          subj.name.toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [topics, subjectMap, paperFilter, selectedSubjectId, searchQuery, subjectPaperMap]);

  const handleQuickUploadMd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!uploadTopicId) {
      showToast({
        type: 'error',
        title: 'Select a Topic',
        message: 'Choose a Subject and Topic before uploading a .md note.',
      });
      e.target.value = '';
      return;
    }

    const target = topics.find((t) => t.id === uploadTopicId);
    if (!target) return;

    try {
      const text = (await file.text()).trim();
      if (!text) return;
      const nextNotes = target.notes?.trim()
        ? `${target.notes.trim()}\n\n---\n\n${text}`
        : text;
      await updateTopic(target.id, { notes: nextNotes });
      showToast({
        type: 'success',
        title: 'Markdown Note Saved',
        message: `Added "${file.name}" to ${target.topic_name}.`,
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Study Notes &amp; Markdown Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organized by Paper (DS / CS), Subject, and Topic — upload <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code> files rendered like GitHub.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'DA', 'CS'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPaperFilter(p);
                setSelectedSubjectId('ALL');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                paperFilter === p
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p === 'ALL' ? 'All Papers' : p === 'DA' ? 'DS (DA)' : 'CS'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick .md Upload Bar */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 shadow-sm space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Upload className="w-3.5 h-3.5 text-indigo-500" />
          <span>Upload .md Note to Subject &amp; Topic</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <select
            value={uploadSubjectId}
            onChange={(e) => {
              setUploadSubjectId(e.target.value);
              setUploadTopicId('');
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Subject...</option>
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                [{getSubjectPaper(s.id, s.name) === 'DA' ? 'DS' : 'CS'}] {s.name}
              </option>
            ))}
          </select>

          <select
            value={uploadTopicId}
            onChange={(e) => setUploadTopicId(e.target.value)}
            disabled={!uploadSubjectId}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">Select Topic...</option>
            {uploadSubjectTopics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.topic_name}
              </option>
            ))}
          </select>

          <div>
            <input
              ref={mdInputRef}
              type="file"
              accept=".md,.markdown,.txt"
              onChange={handleQuickUploadMd}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => mdInputRef.current?.click()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload .md File</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subject Filter Pills + Search */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, topics, or subjects..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedSubjectId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              selectedSubjectId === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Subjects ({filteredSubjects.length})
          </button>
          {filteredSubjects.map((subj) => (
            <button
              key={subj.id}
              type="button"
              onClick={() => setSelectedSubjectId(subj.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                selectedSubjectId === subj.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-darkCard border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {subj.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Cards grouped by Topic */}
      {filteredTopics.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">
            No topics match this filter. Add subjects/topics in GATE Study or Syllabus first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTopics.map((topic) => {
            const subj = subjectMap.get(topic.subject_id)!;
            const paper = getSubjectPaper(subj.id, subj.name);
            const isEditing = editingTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSubjectPaper(subj.id, paper === 'DA' ? 'CS' : 'DA')}
                        title="Click to switch DS / CS paper tag"
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        {paper === 'DA' ? 'DS (DA)' : 'CS'}
                      </button>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                        style={{ backgroundColor: `${subj.color}18`, color: subj.color }}
                      >
                        {subj.name}
                      </span>
                    </div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {topic.topic_name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setEditingTopicId(null);
                        } else {
                          setEditingTopicId(topic.id);
                          setDraftNotes(topic.notes || '');
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                      <span>{isEditing ? 'Cancel' : 'Edit Notes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/gate/topic/${topic.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Topic</span>
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2.5">
                    <textarea
                      rows={6}
                      value={draftNotes}
                      onChange={(e) => setDraftNotes(e.target.value)}
                      placeholder="Write GitHub Markdown notes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex items-center justify-end gap-2">
                      {draftNotes.trim() && (
                        <button
                          type="button"
                          onClick={async () => {
                            await updateTopic(topic.id, { notes: null });
                            setEditingTopicId(null);
                            showToast({ type: 'info', title: 'Notes Cleared' });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Clear</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await updateTopic(topic.id, { notes: draftNotes.trim() || null });
                          setEditingTopicId(null);
                          showToast({ type: 'success', title: 'Notes Saved' });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : topic.notes?.trim() ? (
                  <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto">
                    <MarkdownRenderer text={topic.notes} />
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    No notes yet. Click <span className="font-semibold">Edit Notes</span> or upload a <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code> file above.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
