import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useTimer } from '../context/TimerContext';
import { TopicStatus } from '../types';
import { parseSubtopics } from '../utils/subtopics';
import { GATE_SYLLABUS_PAPERS } from '../lib/syllabusData';
import { AddTopicModal } from '../components/gate/AddTopicModal';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  RotateCcw,
  Plus,
  Play,
  ChevronRight,
  Award,
  AlertTriangle,
  Bookmark,
  FileText,
} from 'lucide-react';

export const SubjectDetailPage: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const {
    subjects,
    topics,
    revisions,
    mockTests,
    mistakes,
    flashcards,
    addTopic,
    updateTopic,
  } = useData();
  const { setSelectedSubjectId, setSelectedTopicId, startTimer } = useTimer();

  const [statusFilter, setStatusFilter] = useState<'All' | TopicStatus>('All');
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);

  const subject = useMemo(
    () => subjects.find((s) => s.id === subjectId),
    [subjects, subjectId]
  );

  const subjectTopics = useMemo(
    () => topics.filter((t) => t.subject_id === subjectId),
    [topics, subjectId]
  );

  const filteredTopics = useMemo(
    () =>
      statusFilter === 'All'
        ? subjectTopics
        : subjectTopics.filter((t) => t.status === statusFilter),
    [subjectTopics, statusFilter]
  );

  const stats = useMemo(() => {
    const total = subjectTopics.length;
    const completed = subjectTopics.filter((t) => t.status === 'Completed').length;
    const inProgress = subjectTopics.filter((t) => t.status === 'In Progress').length;
    const notStarted = subjectTopics.filter((t) => t.status === 'Not Started').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pyqs = subjectTopics.reduce((acc, t) => acc + (t.pyqs_solved || 0), 0);
    const hours = Math.round(
      subjectTopics.reduce((acc, t) => acc + (t.study_hours || 0), 0) * 10
    ) / 10;
    const avgConfidence =
      total > 0
        ? (
            subjectTopics.reduce((acc, t) => acc + (t.confidence || 3), 0) / total
          ).toFixed(1)
        : '0.0';
    const topicIds = new Set(subjectTopics.map((t) => t.id));
    const revCount = revisions.filter((r) => topicIds.has(r.topic_id)).length;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      percent,
      pyqs,
      hours,
      avgConfidence,
      revCount,
    };
  }, [subjectTopics, revisions]);

  // Match official GATE syllabus section by subject name
  const matchingSyllabusItems = useMemo(() => {
    if (!subject) return [];
    const subjLower = subject.name.trim().toLowerCase();
    const existingNames = new Set(subjectTopics.map((t) => t.topic_name.trim().toLowerCase()));
    const results: Array<{ paper: string; group?: string; title: string }> = [];

    for (const paper of GATE_SYLLABUS_PAPERS) {
      for (const sec of paper.sections) {
        const secLower = sec.title.toLowerCase();
        if (secLower.includes(subjLower) || subjLower.includes(secLower)) {
          sec.groups.forEach((g) => {
            g.items.forEach((item) => {
              if (!existingNames.has(item.trim().toLowerCase())) {
                results.push({ paper: paper.code, group: g.label, title: item });
              }
            });
          });
        }
      }
    }
    return results;
  }, [subject, subjectTopics]);

  const subjectTests = useMemo(
    () => mockTests.filter((m) => m.subject_id === subjectId),
    [mockTests, subjectId]
  );
  const subjectMistakes = useMemo(
    () => mistakes.filter((m) => m.subject_id === subjectId && !m.is_resolved),
    [mistakes, subjectId]
  );
  const subjectCards = useMemo(
    () => flashcards.filter((f) => f.subject_id === subjectId),
    [flashcards, subjectId]
  );

  if (!subject) {
    return (
      <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder text-center space-y-4">
        <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
        <h2 className="text-base font-bold">Subject Not Found</h2>
        <button
          onClick={() => navigate('/gate')}
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          Back to GATE Study
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => navigate('/gate')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-darkCard text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Subjects</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedSubjectId(subject.id);
              setSelectedTopicId(null);
              startTimer();
              navigate('/timer');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Timer</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddTopicOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>

      {/* Subject Overview Card */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="w-4 h-4 rounded-full shrink-0"
              style={{ backgroundColor: subject.color }}
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {subject.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                {stats.completed} Completed · {stats.inProgress} In Progress · {stats.notStarted} Not Started
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-black tabular-nums" style={{ color: subject.color }}>
              {stats.percent}%
            </div>
            <div className="text-[11px] text-slate-400">Syllabus Completed</div>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${stats.percent}%`,
              backgroundColor: stats.percent === 100 ? '#10B981' : subject.color,
            }}
          />
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400">Topics</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
              {stats.completed}/{stats.total}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400">PYQs Solved</div>
            <div className="text-base font-black text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
              {stats.pyqs}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400">Study Hours</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
              {stats.hours}h
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <div className="text-[10px] font-bold uppercase text-slate-400">Revisions</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
              {stats.revCount}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 col-span-2 sm:col-span-1">
            <div className="text-[10px] font-bold uppercase text-slate-400">Avg Confidence</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {stats.avgConfidence}/5
            </div>
          </div>
        </div>
      </div>

      {/* Topics List in This Subject */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Topics & Subtopics ({filteredTopics.length})
          </h2>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto">
            {(['All', 'Completed', 'In Progress', 'Not Started'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredTopics.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No topics in this filter. Click "+ Add Topic" above to add one.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTopics.map((topic) => {
              const subList = parseSubtopics(topic.subtopic);
              const subDone = subList.filter((s) => s.done).length;

              return (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/gate/topic/${topic.id}`)}
                  className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next: TopicStatus =
                            topic.status === 'Not Started'
                              ? 'In Progress'
                              : topic.status === 'In Progress'
                              ? 'Completed'
                              : 'Not Started';
                          updateTopic(topic.id, { status: next });
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                          topic.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : topic.status === 'In Progress'
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title="Tap to cycle status"
                      >
                        {topic.status}
                      </button>
                      {subList.length > 0 && (
                        <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {subDone}/{subList.length} subtopics
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 break-words">
                      {topic.topic_name}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {topic.confidence}/5
                      </span>
                      <span>{topic.pyqs_solved || 0} PYQs</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {topic.study_hours || 0}h
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <RotateCcw className="w-3 h-3" />
                        Rev {topic.revision_count || 0}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Unadded Official Syllabus Topics for this Subject */}
      {matchingSyllabusItems.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-500" />
              Remaining Official Syllabus Topics ({matchingSyllabusItems.length})
            </h2>
          </div>
          <div className="space-y-2">
            {matchingSyllabusItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{item.title}</div>
                  {item.group && <div className="text-[10px] text-slate-400">{item.group}</div>}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    addTopic({
                      subject_id: subject.id,
                      topic_name: item.title,
                      subtopic: item.group || null,
                      status: 'Not Started',
                      covered_date: null,
                      confidence: 3,
                      pyqs_solved: 0,
                      study_hours: 0,
                      notes: `${item.paper} Syllabus`,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-semibold shrink-0"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linked Tests, Mistakes & Formulas Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-500" />
            Subject Mock Tests ({subjectTests.length})
          </div>
          {subjectTests.length === 0 ? (
            <p className="text-xs text-slate-400">No tests logged for this subject yet.</p>
          ) : (
            subjectTests.slice(0, 3).map((t) => (
              <div key={t.id} className="text-xs flex justify-between text-slate-600 dark:text-slate-300 tabular-nums">
                <span className="truncate pr-2">{t.title}</span>
                <span className="font-bold shrink-0">{t.marks_scored}/{t.total_marks}</span>
              </div>
            ))
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            Unresolved Mistakes ({subjectMistakes.length})
          </div>
          {subjectMistakes.length === 0 ? (
            <p className="text-xs text-slate-400">No unresolved mistakes in this subject.</p>
          ) : (
            subjectMistakes.slice(0, 3).map((m) => (
              <div key={m.id} className="text-xs text-slate-600 dark:text-slate-300 truncate">
                • {m.title}
              </div>
            ))
          )}
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder space-y-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-amber-500" />
            Formula Vault Cards ({subjectCards.length})
          </div>
          {subjectCards.length === 0 ? (
            <p className="text-xs text-slate-400">No flashcards saved for this subject.</p>
          ) : (
            subjectCards.slice(0, 3).map((c) => (
              <div key={c.id} className="text-xs text-slate-600 dark:text-slate-300 truncate">
                • {c.front_prompt}
              </div>
            ))
          )}
        </div>
      </div>

      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => setIsAddTopicOpen(false)}
        defaultSubjectId={subject.id}
      />
    </div>
  );
};
