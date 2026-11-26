import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

export type QuestionBankCategory = 'DPP' | 'Practice Questions' | 'Test Questions';

export interface MdQuestionSet {
  id: string;
  category: QuestionBankCategory;
  paper: 'DA' | 'CS';
  subject_id?: string | null;
  subject_name: string;
  topic_name?: string | null;
  title: string;
  content: string;
  solved: boolean;
  created_at: string;
}

const STORAGE_KEY = 'avdhut_md_question_bank_v1';

const CATEGORIES: QuestionBankCategory[] = [
  'DPP',
  'Practice Questions',
  'Test Questions',
];

function loadSets(): MdQuestionSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const MdQuestionBank: React.FC = () => {
  const { subjects, topics } = useData();
  const { showToast } = useToast();

  const [sets, setSets] = useState<MdQuestionSet[]>(loadSets);
  const [activeCategory, setActiveCategory] = useState<QuestionBankCategory>('DPP');
  const [paperFilter, setPaperFilter] = useState<'ALL' | 'DA' | 'CS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload metadata state
  const [uploadPaper, setUploadPaper] = useState<'DA' | 'CS'>('DA');
  const [uploadSubjectId, setUploadSubjectId] = useState<string>('');
  const [uploadTopicName, setUploadTopicName] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [setToDelete, setSetToDelete] = useState<MdQuestionSet | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
    } catch {
      // Ignore quota errors
    }
  }, [sets]);

  const subjectTopics = useMemo(() => {
    if (!uploadSubjectId) return [];
    return topics.filter((t) => t.subject_id === uploadSubjectId);
  }, [topics, uploadSubjectId]);

  const categoryCounts = useMemo(() => {
    const counts: Record<QuestionBankCategory, number> = {
      DPP: 0,
      'Practice Questions': 0,
      'Test Questions': 0,
    };
    for (const item of sets) {
      if (counts[item.category] !== undefined) counts[item.category] += 1;
    }
    return counts;
  }, [sets]);

  const filteredSets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return sets.filter((s) => {
      if (s.category !== activeCategory) return false;
      if (paperFilter !== 'ALL' && s.paper !== paperFilter) return false;
      if (q) {
        return (
          s.title.toLowerCase().includes(q) ||
          s.subject_name.toLowerCase().includes(q) ||
          (s.topic_name || '').toLowerCase().includes(q) ||
          s.content.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [sets, activeCategory, paperFilter, searchQuery]);

  const handleUploadMd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const selectedSubj = subjects.find((s) => s.id === uploadSubjectId);
    const created: MdQuestionSet[] = [];

    for (const file of files) {
      try {
        const text = (await file.text()).trim();
        if (!text) continue;
        const cleanTitle = file.name.replace(/\.(md|markdown|txt)$/i, '').trim() || activeCategory;
        created.push({
          id: `qset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          category: activeCategory,
          paper: uploadPaper,
          subject_id: selectedSubj?.id || null,
          subject_name: selectedSubj?.name || 'General',
          topic_name: uploadTopicName || null,
          title: cleanTitle,
          content: text,
          solved: false,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Skip unreadable file
      }
    }

    if (created.length > 0) {
      setSets((prev) => [...created, ...prev]);
      setExpandedId(created[0].id);
      showToast({
        type: 'success',
        title: `${activeCategory} Uploaded`,
        message: `Added ${created.length} .md file${created.length === 1 ? '' : 's'}.`,
      });
    } else {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'Selected .md file was empty or unreadable.',
      });
    }
    e.target.value = '';
  };

  const toggleSolved = (id: string) => {
    setSets((prev) => prev.map((s) => (s.id === id ? { ...s, solved: !s.solved } : s)));
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            DPP, Practice &amp; Test Questions (.md Bank)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Upload <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code> question sets for DPP, Practice Questions, and Test Questions — rendered like GitHub.
          </p>
        </div>
      </div>

      {/* 3 Section Tabs: DPP | Practice Questions | Test Questions */}
      <div className="grid grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                active
                  ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className="truncate">{cat}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 tabular-nums">
                {categoryCounts[cat]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Upload Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
        <select
          value={uploadPaper}
          onChange={(e) => setUploadPaper(e.target.value as 'DA' | 'CS')}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="DA">Paper: DS (DA)</option>
          <option value="CS">Paper: CS</option>
        </select>

        <select
          value={uploadSubjectId}
          onChange={(e) => {
            setUploadSubjectId(e.target.value);
            setUploadTopicName('');
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All / General Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={uploadTopicName}
          onChange={(e) => setUploadTopicName(e.target.value)}
          disabled={!uploadSubjectId}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="">Any Topic</option>
          {subjectTopics.map((t) => (
            <option key={t.id} value={t.topic_name}>
              {t.topic_name}
            </option>
          ))}
        </select>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            multiple
            onChange={handleUploadMd}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload .md to {activeCategory === 'DPP' ? 'DPP' : activeCategory.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCategory.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['ALL', 'DA', 'CS'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPaperFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                paperFilter === p
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {p === 'ALL' ? 'All Papers' : p === 'DA' ? 'DS (DA)' : 'CS'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredSets.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No <span className="font-semibold">{activeCategory}</span> .md files uploaded yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSets.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden"
              >
                <div className="p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${item.solved ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {item.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                          {item.paper === 'DA' ? 'DS' : 'CS'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {item.subject_name}
                        </span>
                        {item.topic_name && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            · {item.topic_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleSolved(item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        item.solved
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{item.solved ? 'Solved' : 'Mark Solved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                      title={isExpanded ? 'Collapse' : 'Read'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSetToDelete(item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    <MarkdownRenderer text={item.content} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(setToDelete)}
        onClose={() => setSetToDelete(null)}
        onConfirm={() => {
          if (setToDelete) {
            setSets((prev) => prev.filter((s) => s.id !== setToDelete.id));
            showToast({ type: 'info', title: 'Deleted Question Set' });
          }
        }}
        title="Delete Question Set"
        message={`Delete "${setToDelete?.title}" from ${setToDelete?.category}?`}
        confirmLabel="Delete"
      />
    </div>
  );
};
