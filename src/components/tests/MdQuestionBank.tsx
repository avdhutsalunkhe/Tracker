import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  StudyDocument,
  StudyDocCategory,
  getCachedStudyDocuments,
  fetchStudyDocuments,
  uploadStudyDocument,
  getStudyDocumentUrl,
  fetchStudyDocumentText,
  toggleStudyDocumentSolved,
  deleteStudyDocument,
  formatFileSize,
} from '../../lib/studyDocuments';
import {
  FileText,
  Upload,
  CheckCircle2,
  Trash2,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  ExternalLink,
  Loader2,
} from 'lucide-react';

export type QuestionBankCategory = Extract<
  StudyDocCategory,
  'DPP' | 'Practice Questions' | 'Test Questions'
>;

const CATEGORIES: QuestionBankCategory[] = [
  'DPP',
  'Practice Questions',
  'Test Questions',
];

export const MdQuestionBank: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subjects, topics } = useData();
  const { showToast } = useToast();

  const userId = user?.id || '';
  const [docs, setDocs] = useState<StudyDocument[]>(() =>
    getCachedStudyDocuments(userId)
  );
  const [activeCategory, setActiveCategory] = useState<QuestionBankCategory>('DPP');
  const [paperFilter, setPaperFilter] = useState<'ALL' | 'DA' | 'CS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [uploadPaper, setUploadPaper] = useState<'DA' | 'CS'>('DA');
  const [uploadSubjectId, setUploadSubjectId] = useState<string>('');
  const [uploadTopicId, setUploadTopicId] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [mdContentMap, setMdContentMap] = useState<Record<string, string>>({});
  const [loadingMdId, setLoadingMdId] = useState<string | null>(null);
  const [docToDelete, setDocToDelete] = useState<StudyDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setDocs([]);
      return;
    }
    setDocs(getCachedStudyDocuments(userId));
    fetchStudyDocuments(userId)
      .then((fresh) => setDocs(fresh))
      .catch(() => {
        // Keep cached metadata if offline
      });
  }, [userId]);

  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  const topicMap = useMemo(() => {
    const map = new Map<string, string>();
    topics.forEach((t) => map.set(t.id, t.topic_name));
    return map;
  }, [topics]);

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
    for (const item of docs) {
      if (item.category in counts) {
        counts[item.category as QuestionBankCategory] += 1;
      }
    }
    return counts;
  }, [docs]);

  const filteredDocs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return docs.filter((d) => {
      if (d.category !== activeCategory) return false;
      if (paperFilter !== 'ALL' && d.paper !== paperFilter) return false;
      if (q) {
        const subjName = d.subject_id ? subjectMap.get(d.subject_id) || '' : '';
        const topicName = d.topic_id ? topicMap.get(d.topic_id) || '' : '';
        return (
          d.title.toLowerCase().includes(q) ||
          d.file_name.toLowerCase().includes(q) ||
          subjName.toLowerCase().includes(q) ||
          topicName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [docs, activeCategory, paperFilter, searchQuery, subjectMap, topicMap]);

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!userId) {
      showToast({
        type: 'error',
        title: 'Sign In Required',
        message: 'Sign in with your Supabase account to upload files to cloud storage.',
      });
      e.target.value = '';
      return;
    }

    setUploading(true);
    let uploadedCount = 0;
    try {
      for (const file of files) {
        const doc = await uploadStudyDocument({
          userId,
          file,
          paper: uploadPaper,
          subjectId: uploadSubjectId || null,
          topicId: uploadTopicId || null,
          category: activeCategory,
        });
        setDocs((prev) => [doc, ...prev]);
        uploadedCount += 1;
      }
      if (uploadedCount > 0) {
        showToast({
          type: 'success',
          title: `${activeCategory} Uploaded`,
          message: `Saved ${uploadedCount} file${uploadedCount === 1 ? '' : 's'} to Supabase Storage.`,
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error.message || 'Could not upload to Supabase Storage.',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleToggleExpand = async (doc: StudyDocument) => {
    if (expandedId === doc.id) {
      setExpandedId(null);
      return;
    }
    const isMarkdown = ['md', 'markdown', 'txt'].includes(doc.file_type.toLowerCase());
    if (!isMarkdown) {
      navigate('/viewer', {
        state: {
          storagePath: doc.storage_path,
          title: doc.title,
          fileType: doc.file_type,
        },
      });
      return;
    }

    setExpandedId(doc.id);
    if (!mdContentMap[doc.id]) {
      setLoadingMdId(doc.id);
      try {
        const text = await fetchStudyDocumentText(doc.storage_path);
        setMdContentMap((prev) => ({ ...prev, [doc.id]: text }));
      } catch (err: unknown) {
        showToast({
          type: 'error',
          title: 'Load Failed',
          message: (err as Error).message,
        });
      } finally {
        setLoadingMdId(null);
      }
    }
  };

  const handleToggleSolved = async (doc: StudyDocument) => {
    const nextSolved = !doc.solved;
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, solved: nextSolved } : d)));
    try {
      await toggleStudyDocumentSolved(userId, doc.id, nextSolved);
    } catch {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, solved: doc.solved } : d)));
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-500" />
          DPP, Practice &amp; Test Questions (Supabase Cloud)
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Upload <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code>, <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.pdf</code>, or <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.ppt/.pptx</code> files directly to Supabase Storage.
        </p>
      </div>

      {/* 3 Section Tabs */}
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
            setUploadTopicId('');
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
          value={uploadTopicId}
          onChange={(e) => setUploadTopicId(e.target.value)}
          disabled={!uploadSubjectId}
          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <option value="">Any Topic</option>
          {subjectTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.topic_name}
            </option>
          ))}
        </select>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.pdf,.ppt,.pptx"
            multiple
            onChange={handleUploadFiles}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            <span>{uploading ? 'Uploading...' : `Upload to ${activeCategory === 'DPP' ? 'DPP' : activeCategory.split(' ')[0]}`}</span>
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
      {filteredDocs.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          No <span className="font-semibold">{activeCategory}</span> files uploaded to Supabase yet.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isExpanded = expandedId === doc.id;
            const isMarkdown = ['md', 'markdown', 'txt'].includes(doc.file_type.toLowerCase());
            const subjName = doc.subject_id ? subjectMap.get(doc.subject_id) || 'General' : 'General';
            const topicName = doc.topic_id ? topicMap.get(doc.topic_id) : null;

            return (
              <div
                key={doc.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden"
              >
                <div className="p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleExpand(doc)}
                    className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  >
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-xs font-bold truncate ${doc.solved ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {doc.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {doc.file_type}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                          {doc.paper === 'DA' ? 'DS' : 'CS'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {subjName}
                        </span>
                        {topicName && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            · {topicName}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 tabular-nums">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleSolved(doc)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        doc.solved
                          ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{doc.solved ? 'Solved' : 'Mark Solved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleExpand(doc)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200/60 dark:hover:bg-slate-700"
                      title={isMarkdown ? (isExpanded ? 'Collapse' : 'Read') : 'Open file'}
                    >
                      {isMarkdown ? (
                        isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && isMarkdown && (
                  <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
                    {loadingMdId === doc.id ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading from Supabase Storage...</span>
                      </div>
                    ) : (
                      <MarkdownRenderer text={mdContentMap[doc.id] || ''} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(docToDelete)}
        onClose={() => setDocToDelete(null)}
        onConfirm={async () => {
          if (docToDelete) {
            await deleteStudyDocument(userId, docToDelete);
            setDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));
            showToast({ type: 'info', title: 'Deleted Document' });
          }
        }}
        title="Delete Document"
        message={`Delete "${docToDelete?.title}" from Supabase Storage?`}
        confirmLabel="Delete"
      />
    </div>
  );
};
