import React, { useState, useMemo } from 'react';
import { GATE_SYLLABUS_PAPERS, SyllabusSection } from '../lib/syllabusData';
import { useData } from '../context/DataContext';
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const SyllabusPage: React.FC = () => {
  const { subjects, topics, addSubject, addTopic } = useData();

  const [selectedPaperCode, setSelectedPaperCode] = useState<'CS' | 'DA'>('CS');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
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

  // Paper coverage stats
  const paperStats = useMemo(() => {
    let totalItems = 0;
    let trackedCount = 0;
    let completedCount = 0;

    activePaper.sections.forEach((sec) => {
      sec.groups.forEach((g) => {
        g.items.forEach((item) => {
          totalItems++;
          const found = trackedTopicMap.get(item.trim().toLowerCase());
          if (found) {
            trackedCount++;
            if (found.status === 'Completed') completedCount++;
          }
        });
      });
    });

    const percent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
    return { totalItems, trackedCount, completedCount, percent };
  }, [activePaper, trackedTopicMap]);

  const toggleSection = (secKey: string) => {
    setCollapsedSections((prev) => ({ ...prev, [secKey]: !prev[secKey] }));
  };

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
    subtopicLabel?: string
  ) => {
    const subjId = await ensureSubjectId(section.title, section.color);
    if (!subjId) return;

    await addTopic({
      subject_id: subjId,
      topic_name: itemTitle,
      subtopic: subtopicLabel || null,
      status: 'Not Started',
      covered_date: null,
      confidence: 3,
      pyqs_solved: 0,
      study_hours: 0,
      notes: `${activePaper.code} · Section ${section.sectionNumber}`,
    });
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            GATE 2027 Official Syllabus
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activePaper.organizingInstitute} — Browse CS & DA papers and add any topic directly to your tracker.
          </p>
        </div>

        {/* Paper Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs shrink-0">
          {GATE_SYLLABUS_PAPERS.map((paper) => {
            const isActive = selectedPaperCode === paper.code;
            return (
              <button
                key={paper.code}
                onClick={() => setSelectedPaperCode(paper.code)}
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

      {/* Paper Banner + Stats + Import All */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md bg-rose-900/90 text-amber-300 text-xs font-extrabold tracking-wide">
              {activePaper.code}
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {activePaper.name}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span>{activePaper.sections.length} Sections</span>
            <span>•</span>
            <span>{paperStats.totalItems} Syllabus Topics</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
              {paperStats.trackedCount} in Tracker ({paperStats.completedCount} Completed · {paperStats.percent}%)
            </span>
          </div>
        </div>

        <button
          onClick={handleImportPaper}
          disabled={importingPaper}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>{importingPaper ? 'Importing...' : `Add All ${activePaper.code} Topics to Tracker`}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activePaper.code} sections, topics, or keywords...`}
          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Sections List */}
      {filteredSections.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder text-xs text-slate-400">
          No syllabus topics match "{searchQuery}" in the {activePaper.code} paper.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSections.map((section) => {
            const secKey = `${activePaper.code}-${section.sectionNumber}`;
            const isCollapsed = Boolean(collapsedSections[secKey]);

            return (
              <div
                key={secKey}
                className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder shadow-xs overflow-hidden"
              >
                {/* Section Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(secKey)}
                  className="w-full px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: section.color }}
                    />
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                      Section {section.sectionNumber}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                      {section.title}
                    </h3>
                  </div>

                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {/* Section Body */}
                {!isCollapsed && (
                  <div className="p-4 sm:p-5 space-y-4">
                    {section.groups.map((group, gIdx) => (
                      <div key={gIdx} className="space-y-2">
                        {group.label && (
                          <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>{group.label}</span>
                          </h4>
                        )}

                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-900/30">
                          {group.items.map((item, iIdx) => {
                            const tracked = trackedTopicMap.get(item.trim().toLowerCase());

                            return (
                              <div
                                key={iIdx}
                                className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs hover:bg-white dark:hover:bg-slate-800/40 transition-colors"
                              >
                                <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                  {item}
                                </span>

                                <div className="shrink-0">
                                  {tracked ? (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                        tracked.status === 'Completed'
                                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                          : tracked.status === 'In Progress'
                                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                      }`}
                                    >
                                      {tracked.status === 'Completed' ? (
                                        <CheckCircle2 className="w-3 h-3" />
                                      ) : (
                                        <Clock className="w-3 h-3" />
                                      )}
                                      {tracked.status}
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleAddSingleItem(section, item, group.label)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 font-semibold text-[11px] transition-colors"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Track</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
