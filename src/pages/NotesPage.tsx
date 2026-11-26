import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { GATE_SYLLABUS_PAPERS } from '../lib/syllabusData';
import { MarkdownRenderer } from '../components/common/MarkdownRenderer';
import { parseSubtopics, SubtopicItem } from '../utils/subtopics';
import {
  StudyDocument,
  getCachedStudyDocuments,
  fetchStudyDocuments,
  uploadStudyDocument,
  getStudyDocumentUrl,
  fetchStudyDocumentText,
  deleteStudyDocument,
  formatFileSize,
} from '../lib/studyDocuments';
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
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  FolderOpen,
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
  const { user } = useAuth();
  const { subjects, topics, updateTopic } = useData();
  const { showToast } = useToast();
  const userId = user?.id || '';

  const [paperFilter, setPaperFilter] = useState<'ALL' | 'DA' | 'CS'>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectPaperMap, setSubjectPaperMap] = useState<Record<string, 'DA' | 'CS'>>(loadSubjectPaperMap);

  // Left sidebar tree state (W3Schools-style Topic -> Subtopics accordion)
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedSubtopicTitle, setSelectedSubtopicTitle] = useState<string | null>(null);

  // Cloud documents (separate files in Supabase Storage)
  const [cloudDocs, setCloudDocs] = useState<StudyDocument[]>(() =>
    getCachedStudyDocuments(userId)
  );
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string>('__inline__');
  const [mdCache, setMdCache] = useState<Record<string, string>>({});
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  // Inline edit state for selected topic's summary notes
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [draftNotes, setDraftNotes] = useState('');
  const mdInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!userId) {
      setCloudDocs([]);
      return;
    }
    setCloudDocs(getCachedStudyDocuments(userId));
    fetchStudyDocuments(userId)
      .then((fresh) => setCloudDocs(fresh))
      .catch(() => {});
  }, [userId]);

  const getSubjectPaper = (subjId: string, subjName: string): 'DA' | 'CS' =>
    subjectPaperMap[subjId] || inferPaperForSubject(subjName);

  const setSubjectPaper = (subjId: string, paper: 'DA' | 'CS') => {
    const next = { ...subjectPaperMap, [subjId]: paper };
    setSubjectPaperMap(next);
    try {
      localStorage.setItem(SUBJECT_PAPER_MAP_KEY, JSON.stringify(next));
    } catch {
      // Ignore
    }
  };

  const subjectMap = useMemo(() => {
    const map = new Map<string, (typeof subjects)[0]>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (paperFilter === 'ALL') return true;
      return getSubjectPaper(s.id, s.name) === paperFilter;
    });
  }, [subjects, paperFilter, subjectPaperMap]);

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
          (t.subtopic || '').toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [topics, subjectMap, paperFilter, selectedSubjectId, searchQuery, subjectPaperMap]);

  // Auto-select first visible topic if none selected
  const activeTopic = useMemo(() => {
    if (selectedTopicId) {
      const found = filteredTopics.find((t) => t.id === selectedTopicId);
      if (found) return found;
    }
    return filteredTopics[0] || null;
  }, [filteredTopics, selectedTopicId]);

  const activeSubject = activeTopic ? subjectMap.get(activeTopic.subject_id) || null : null;

  // Separate uploaded files belonging to activeTopic
  const activeTopicDocs = useMemo(() => {
    if (!activeTopic) return [];
    return cloudDocs.filter(
      (d) => d.category === 'Notes' && d.topic_id === activeTopic.id
    );
  }, [cloudDocs, activeTopic]);

  // Pick default active file tab when switching topics
  useEffect(() => {
    setIsEditingInline(false);
    if (!activeTopic) return;
    if (activeTopicDocs.length > 0 && !activeTopic.notes?.trim()) {
      setActiveFileId(activeTopicDocs[0].id);
    } else if (activeTopic.notes?.trim()) {
      setActiveFileId('__inline__');
    } else if (activeTopicDocs.length > 0) {
      setActiveFileId(activeTopicDocs[0].id);
    } else {
      setActiveFileId('__inline__');
    }
  }, [activeTopic?.id]);

  // Load .md text from Supabase Storage when a cloud .md file tab is selected
  useEffect(() => {
    if (!activeFileId || activeFileId === '__inline__') return;
    const doc = activeTopicDocs.find((d) => d.id === activeFileId);
    if (!doc) return;
    const isMd = ['md', 'markdown', 'txt'].includes(doc.file_type.toLowerCase());
    if (!isMd || mdCache[doc.id] !== undefined) return;

    setLoadingDocId(doc.id);
    fetchStudyDocumentText(doc.storage_path)
      .then((text) => setMdCache((prev) => ({ ...prev, [doc.id]: text })))
      .catch((err: unknown) => {
        showToast({
          type: 'error',
          title: 'Could not load file',
          message: (err as Error).message,
        });
      })
      .finally(() => setLoadingDocId(null));
  }, [activeFileId, activeTopicDocs, mdCache, showToast]);

  const handleUploadSeparateFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (!activeTopic) {
      showToast({
        type: 'error',
        title: 'Select a Topic',
        message: 'Select a topic from the left sidebar first.',
      });
      e.target.value = '';
      return;
    }

    if (!userId) {
      showToast({
        type: 'error',
        title: 'Sign In Required',
        message: 'Sign in with your Supabase account to upload separate files.',
      });
      e.target.value = '';
      return;
    }

    setUploadingDoc(true);
    try {
      const subj = subjectMap.get(activeTopic.subject_id);
      const paper = subj ? getSubjectPaper(subj.id, subj.name) : 'DA';
      let lastDoc: StudyDocument | null = null;

      for (const file of files) {
        const doc = await uploadStudyDocument({
          userId,
          file,
          paper,
          subjectId: activeTopic.subject_id,
          topicId: activeTopic.id,
          category: 'Notes',
        });
        setCloudDocs((prev) => [doc, ...prev]);
        lastDoc = doc;

        const isMd = ['md', 'markdown', 'txt'].includes(doc.file_type.toLowerCase());
        if (isMd) {
          const text = await file.text();
          setMdCache((prev) => ({ ...prev, [doc.id]: text }));
        }
      }

      if (lastDoc) {
        setActiveFileId(lastDoc.id);
        showToast({
          type: 'success',
          title: 'Separate File Uploaded',
          message: `Added ${files.length} file${files.length === 1 ? '' : 's'} to ${activeTopic.topic_name}.`,
        });
      }
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: (err as Error).message,
      });
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  const renderSidebarSubtopics = (
    items: SubtopicItem[],
    topicId: string,
    depth = 0
  ): React.ReactNode => {
    return items.map((sub) => {
      const isSubSelected =
        selectedTopicId === topicId && selectedSubtopicTitle === sub.title;
      return (
        <div key={sub.id} className={depth > 0 ? 'pl-3 border-l border-slate-200 dark:border-slate-700' : ''}>
          <button
            type="button"
            onClick={() => {
              setSelectedTopicId(topicId);
              setSelectedSubtopicTitle(sub.title);
            }}
            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors ${
              isSubSelected
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span className="truncate">{sub.title}</span>
            {sub.done && (
              <CheckCircle2
                className={`w-3.5 h-3.5 shrink-0 ${
                  isSubSelected ? 'text-white' : 'text-emerald-500'
                }`}
              />
            )}
          </button>
          {sub.children && sub.children.length > 0 && (
            <div className="mt-0.5 space-y-0.5">
              {renderSidebarSubtopics(sub.children, topicId, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const selectedCloudDoc =
    activeFileId !== '__inline__'
      ? activeTopicDocs.find((d) => d.id === activeFileId) || null
      : null;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header & Paper Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Study Notes &amp; File Explorer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Browse by DS / CS → Subject → Topic &amp; Subtopics. Upload multiple separate <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code>, <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.pdf</code>, or <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.ppt</code> files.
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

      {/* Subject Filter Pills + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or subtopics..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* W3Schools-Style Two-Pane Layout */}
      {filteredTopics.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-8 text-center space-y-2">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-500">
            No topics found for this filter. Add topics in GATE Study or Syllabus first.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Pane: Topic & Subtopic Accordion Tree */}
          <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-3 shadow-sm lg:sticky lg:top-20 max-h-[65vh] lg:max-h-[calc(100vh-8rem)] overflow-y-auto space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Topics &amp; Subtopics ({filteredTopics.length})
            </div>

            {filteredTopics.map((t) => {
              const subj = subjectMap.get(t.subject_id);
              const subList = parseSubtopics(t.subtopic);
              const hasSubs = subList.length > 0;
              const isTopicActive = activeTopic?.id === t.id && !selectedSubtopicTitle;
              const isExpanded = expandedTopics[t.id] ?? activeTopic?.id === t.id;
              const fileCount = cloudDocs.filter(
                (d) => d.category === 'Notes' && d.topic_id === t.id
              ).length;

              return (
                <div key={t.id} className="space-y-0.5">
                  <div
                    className={`flex items-center justify-between gap-1 rounded-xl px-2 py-2 transition-colors ${
                      isTopicActive
                        ? 'bg-indigo-600 text-white font-semibold'
                        : activeTopic?.id === t.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(t.id);
                        setSelectedSubtopicTitle(null);
                        if (hasSubs) {
                          setExpandedTopics((prev) => ({ ...prev, [t.id]: true }));
                        }
                      }}
                      className="flex-1 min-w-0 text-left text-xs truncate"
                    >
                      <span className="block truncate">{t.topic_name}</span>
                      {subj && (
                        <span
                          className={`block text-[10px] truncate ${
                            isTopicActive ? 'text-indigo-100' : 'text-slate-400'
                          }`}
                        >
                          {subj.name}
                          {fileCount > 0 ? ` · ${fileCount} file${fileCount === 1 ? '' : 's'}` : ''}
                        </span>
                      )}
                    </button>

                    {hasSubs && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTopics((prev) => ({ ...prev, [t.id]: !isExpanded }))
                        }
                        className={`p-1 rounded-lg shrink-0 ${
                          isTopicActive ? 'hover:bg-indigo-500' : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        aria-label="Toggle subtopics"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {hasSubs && isExpanded && (
                    <div className="pl-3 ml-2 border-l border-slate-200 dark:border-slate-700 space-y-0.5 py-0.5">
                      {renderSidebarSubtopics(subList, t.id)}
                    </div>
                  )}
                </div>
              );
            })}
          </aside>

          {/* Right Pane: Separate Files & GitHub Reader */}
          {activeTopic && activeSubject && (
            <section className="lg:col-span-8 xl:col-span-9 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-6 shadow-sm space-y-4">
              {/* Top Breadcrumb + Upload Separate File */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSubjectPaper(
                          activeSubject.id,
                          getSubjectPaper(activeSubject.id, activeSubject.name) === 'DA' ? 'CS' : 'DA'
                        )
                      }
                      title="Click to switch DS / CS paper tag"
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                    >
                      {getSubjectPaper(activeSubject.id, activeSubject.name) === 'DA' ? 'DS (DA)' : 'CS'}
                    </button>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: `${activeSubject.color}18`, color: activeSubject.color }}
                    >
                      {activeSubject.name}
                    </span>
                    {selectedSubtopicTitle && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        Subtopic: {selectedSubtopicTitle}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeTopic.topic_name}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <input
                    ref={mdInputRef}
                    type="file"
                    accept=".md,.markdown,.txt,.pdf,.ppt,.pptx"
                    multiple
                    onChange={handleUploadSeparateFiles}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingDoc}
                    onClick={() => mdInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
                  >
                    {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{uploadingDoc ? 'Uploading...' : '+ Add Separate File'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/gate/topic/${activeTopic.id}`)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Topic Details</span>
                  </button>
                </div>
              </div>

              {/* Separate File Tabs Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveFileId('__inline__');
                    setIsEditingInline(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    activeFileId === '__inline__'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Overview Notes</span>
                </button>

                {activeTopicDocs.map((doc) => {
                  const isActive = activeFileId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      className={`inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFileId(doc.id);
                          setIsEditingInline(false);
                        }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="max-w-[160px] truncate">{doc.title}</span>
                        <span className="px-1 py-0.5 rounded text-[9px] font-bold uppercase bg-white/80 dark:bg-slate-900/80">
                          {doc.file_type}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteStudyDocument(userId, doc);
                          setCloudDocs((prev) => prev.filter((d) => d.id !== doc.id));
                          if (activeFileId === doc.id) setActiveFileId('__inline__');
                          showToast({ type: 'info', title: 'File Deleted' });
                        }}
                        className="p-0.5 rounded text-slate-400 hover:text-rose-500"
                        title="Delete file"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Active File / Notes Content */}
              {activeFileId === '__inline__' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingInline) {
                          setIsEditingInline(false);
                        } else {
                          setDraftNotes(activeTopic.notes || '');
                          setIsEditingInline(true);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      {isEditingInline ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                      <span>{isEditingInline ? 'Preview' : 'Edit Overview'}</span>
                    </button>
                  </div>

                  {isEditingInline ? (
                    <div className="space-y-2.5">
                      <textarea
                        rows={8}
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Write GitHub Markdown notes..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            await updateTopic(activeTopic.id, { notes: draftNotes.trim() || null });
                            setIsEditingInline(false);
                            showToast({ type: 'success', title: 'Notes Saved' });
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save</span>
                        </button>
                      </div>
                    </div>
                  ) : activeTopic.notes?.trim() ? (
                    <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto">
                      <MarkdownRenderer text={activeTopic.notes} />
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <FolderOpen className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-500">
                        Click <span className="font-semibold">+ Add Separate File</span> above to upload separate <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.md</code>, <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.pdf</code>, or <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">.ppt</code> files for this topic.
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedCloudDoc ? (
                ['md', 'markdown', 'txt'].includes(selectedCloudDoc.file_type.toLowerCase()) ? (
                  <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 overflow-x-auto">
                    {loadingDocId === selectedCloudDoc.id ? (
                      <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading {selectedCloudDoc.file_name} from Supabase...</span>
                      </div>
                    ) : (
                      <MarkdownRenderer text={mdCache[selectedCloudDoc.id] || ''} />
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {selectedCloudDoc.file_name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedCloudDoc.file_type.toUpperCase()} · {formatFileSize(selectedCloudDoc.file_size)} · Stored in Supabase
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/viewer', {
                          state: {
                            storagePath: selectedCloudDoc.storage_path,
                            title: selectedCloudDoc.title,
                            fileType: selectedCloudDoc.file_type,
                          },
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View {selectedCloudDoc.file_type.toUpperCase()}</span>
                    </button>
                  </div>
                )
              ) : null}
            </section>
          )}
        </div>
      )}
    </div>
  );
};
