import React, { useState, useMemo } from 'react';
import { GATE_SYLLABUS_PAPERS, SyllabusSection } from '../lib/syllabusData';
import { useData } from '../context/DataContext';
import { TopicStatus } from '../types';
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Sparkles,
  BookOpen,
  X,
  Check,
} from 'lucide-react';

export const SyllabusPage: React.FC = () => {
  const { subjects, topics, addSubject, addTopic, updateTopic } = useData();

  const [selectedPaperCode, setSelectedPaperCode] = useState<'DA' | 'CS'>('DA');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionNumber, setSelectedSectionNumber] = useState<number | null>(null);
  const [importingPaper, setImportingPaper] = useState(false);

  const activePaper = useMemo(
    () => GATE_SYLLABUS_PAPERS.find((p) => p.code === selectedPaperCode) || GATE_SYLLABUS_PAPERS[0],
    [selectedPaperCode]
  );

  // Lookup map for existing topics in user's tracker (lowercase topic_name -> topic)
  const trackedTopicMap = useMemo(() => {
    const map = new Map<string, (typeof topics)[0]>();
    topics.forEach((t) => {
      map.set(t.topic_name.trim().toLowerCase(), t);
    });
    return map;
  }, [topics]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activePaper.sections;

    return activePaper.sections
      .map((sec) => {
        const titleMatches = sec.title.toLowerCase().includes(q);
        if (titleMatches) return sec;

        const matchingGroups = sec.groups
          .map((g) => ({
            ...g,
            items: g.items.filter(
              (item) =>
                item.toLowerCase().includes(q) ||
                (g.label && g.label.toLowerCase().includes(q))
            ),
          }))
          .filter((g) => g.items.length > 0);

        if (matchingGroups.length === 0) return null;
        return { ...sec, groups: matchingGroups };
      })
      .filter((s): s is SyllabusSection => s !== null);
  }, [activePaper, searchQuery]);

  // Compute per-section stats
  const getSectionStats = (sec: SyllabusSection) => {
    let total = 0;
    let tracked = 0;
    let completed = 0;
    sec.groups.forEach((g) => {
      g.items.forEach((item) => {
        total++;
        const found = trackedTopicMap.get(item.trim().toLowerCase());
        if (found) {
          tracked++;
          if (found.status === 'Completed') completed++;
        }
      });
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, tracked, completed, percent };
  };

  // Paper coverage stats
  const paperStats = useMemo(() => {
    let totalItems = 0;
    let trackedCount = 0;
    let completedCount = 0;

    activePaper.sections.forEach((sec) => {
      const st = getSectionStats(sec);
      totalItems += st.total;
      trackedCount += st.tracked;
      completedCount += st.completed;
    });

    const percent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    return { totalItems, trackedCount, completedCount, percent };
  }, [activePaper, trackedTopicMap]);

  const activeSection = useMemo(
    () =>
      selectedSectionNumber !== null
        ? filteredSections.find((s) => s.sectionNumber === selectedSectionNumber) || null
        : null,
    [filteredSections, selectedSectionNumber]
  );

  // Ensure subject exists in user's tracker, or create it
  const ensureSubjectId = async (sectionTitle: string, color: string): Promise<string | null> => {
    const existing = subjects.find(
      (s) => s.name.trim().toLowerCase() === sectionTitle.trim().toLowerCase()
    );
    if (existing) return existing.id;
    return await addSubject(sectionTitle, color);
  };

  const handleAddSingleItem = async (
    section: SyllabusSection,
    itemTitle: string,
    subtopicLabel?: string,
    initialStatus: TopicStatus = 'Not Started'
  ) => {
    const subjId = await ensureSubjectId(section.title, section.color);
    if (!subjId) return;

    await addTopic({
      subject_id: subjId,
      topic_name: itemTitle,
      subtopic: subtopicLabel || null,
      status: initialStatus,
      covered_date: initialStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null,
      confidence: 3,
      pyqs_solved: 0,
      study_hours: 0,
      notes: `${activePaper.code} · Section ${section.sectionNumber}`,
    });
  };

  const handleCycleStatus = async (
    section: SyllabusSection,
    itemTitle: string,
    subtopicLabel?: string
  ) => {
    const existing = trackedTopicMap.get(itemTitle.trim().toLowerCase());
    if (!existing) {
      await handleAddSingleItem(section, itemTitle, subtopicLabel, 'In Progress');
      return;
    }
    const nextStatus: TopicStatus =
      existing.status === 'Not Started'
        ? 'In Progress'
        : existing.status === 'In Progress'
        ? 'Completed'
        : 'Not Started';
    await updateTopic(existing.id, { status: nextStatus });
  };

  const handleImportPaper = async () => {
    setImportingPaper(true);
    try {
      for (const sec of activePaper.sections) {
        const subjId = await ensureSubjectId(sec.title, sec.color);
        if (!subjId) continue;

        for (const group of sec.groups) {
          for (const item of group.items) {
            if (!trackedTopicMap.has(item.trim().toLowerCase())) {
              await addTopic({
                subject_id: subjId,
                topic_name: item,
                subtopic: group.label || null,
                status: 'Not Started',
                covered_date: null,
                confidence: 3,
                pyqs_solved: 0,
                study_hours: 0,
                notes: `${activePaper.code} · Section ${sec.sectionNumber}`,
              });
            }
          }
        }
      }
    } finally {
      setImportingPaper(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header + Paper Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            GATE 2027 Syllabus
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activePaper.organizingInstitute} — Click any section card to inspect & track topics.
          </p>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto max-w-full">
          {GATE_SYLLABUS_PAPERS.map((paper) => {
            const isActive = selectedPaperCode === paper.code;
            return (
              <button
                key={paper.code}
                onClick={() => {
                  setSelectedPaperCode(paper.code);
                  setSelectedSectionNumber(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                  isActive
                    ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {paper.code} Paper
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Card Container (Calendar-style Grid) */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
        {/* Top Bar: Paper Name, Stats, Search & Import */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-rose-900/90 text-amber-300 text-[11px] font-extrabold tracking-wide">
                {activePaper.code}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {activePaper.name}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {paperStats.completedCount} / {paperStats.totalItems} topics completed ({paperStats.percent}%) · {paperStats.trackedCount} tracked
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Filter ${activePaper.code} syllabus...`}
                className="w-full sm:w-56 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleImportPaper}
              disabled={importingPaper}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{importingPaper ? 'Importing...' : `Import ${activePaper.code}`}</span>
            </button>
          </div>
        </div>

        {/* Section Cards Grid (Matches Monthly Calendar Card Style) */}
        {filteredSections.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400">
            No sections match "{searchQuery}" in {activePaper.code}.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
            {filteredSections.map((section) => {
              const stats = getSectionStats(section);
              const isSelected = selectedSectionNumber === section.sectionNumber;

              return (
                <div
                  key={`${activePaper.code}-${section.sectionNumber}`}
                  onClick={() => setSelectedSectionNumber(section.sectionNumber)}
                  className={`min-h-[104px] sm:min-h-[118px] p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none group ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500 shadow-sm'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400/60 dark:hover:border-indigo-500/60'
                  }`}
                >
                  {/* Top Row: Section Number Pill + Activity Dot */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700'
                      }`}
                    >
                      {section.sectionNumber}
                    </span>

                    <span
                      className={`w-2 h-2 rounded-full transition-opacity ${
                        stats.completed === stats.total && stats.total > 0
                          ? 'bg-emerald-500 shadow-xs shadow-emerald-500/40'
                          : stats.tracked > 0
                          ? 'bg-indigo-500'
                          : 'bg-emerald-500/40'
                      }`}
                      title={`${stats.completed}/${stats.total} completed`}
                    />
                  </div>

                  {/* Middle: Section Title */}
                  <div className="my-2">
                    <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                      {section.title}
                    </h3>
                  </div>

                  {/* Bottom: Count + Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {stats.completed}/{stats.total} done
                      </span>
                      <span style={{ color: section.color }}>{stats.percent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${stats.percent}%`,
                          backgroundColor:
                            stats.percent === 100 ? '#10B981' : section.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Section Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>In Progress / Tracked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-1.5 rounded-full bg-indigo-500" />
            <span>Section Syllabus Progress</span>
          </div>
        </div>
      </div>

      {/* Section Detail Slide-Over Drawer (Matches Calendar DayDrawer) */}
      {activeSection && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedSectionNumber(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white dark:bg-darkCard border-l border-lightBorder dark:border-darkBorder shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: activeSection.color }}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    {activePaper.code} · Section {activeSection.sectionNumber}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {activeSection.title}
                </h2>
                {(() => {
                  const st = getSectionStats(activeSection);
                  return (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {st.completed} of {st.total} topics completed ({st.percent}%)
                    </p>
                  );
                })()}
              </div>

              <button
                onClick={() => setSelectedSectionNumber(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeSection.groups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-2.5">
                  {group.label && (
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{group.label}</span>
                    </h3>
                  )}

                  <div className="space-y-2">
                    {group.items.map((item, iIdx) => {
                      const tracked = trackedTopicMap.get(item.trim().toLowerCase());
                      const isCompleted = tracked?.status === 'Completed';
                      const isInProgress = tracked?.status === 'In Progress';

                      return (
                        <div
                          key={iIdx}
                          onClick={() => handleCycleStatus(activeSection, item, group.label)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer select-none transition-all flex items-start justify-between gap-3 ${
                            isCompleted
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/30'
                              : isInProgress
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-400/40'
                              : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-400/50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : isInProgress
                                  ? 'bg-indigo-600 text-white'
                                  : 'border-2 border-slate-300 dark:border-slate-600'
                              }`}
                            >
                              {isCompleted ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : isInProgress ? (
                                <Clock className="w-3 h-3" />
                              ) : null}
                            </div>

                            <span
                              className={`font-medium leading-relaxed ${
                                isCompleted
                                  ? 'line-through text-slate-400 dark:text-slate-500'
                                  : 'text-slate-800 dark:text-slate-200'
                              }`}
                            >
                              {item}
                            </span>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              isCompleted
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : isInProgress
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                : tracked
                                ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                            }`}
                          >
                            {tracked ? tracked.status : '+ Track'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tap any item to cycle: Track → In Progress → Completed</span>
              <button
                onClick={() => setSelectedSectionNumber(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
