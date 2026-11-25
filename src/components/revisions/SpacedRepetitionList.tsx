import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { GateTopic } from '../../types';
import { RevisionHistoryModal } from './RevisionHistoryModal';
import { format, addDays, parseISO, isPast, isToday } from 'date-fns';
import {
  RotateCcw,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  BookOpen,
  History,
  Star
} from 'lucide-react';

export const SpacedRepetitionList: React.FC = () => {
  const { topics, subjects, markTopicRevised } = useData();

  const [historyTopic, setHistoryTopic] = useState<GateTopic | null>(null);
  const [remarksTopic, setRemarksTopic] = useState<GateTopic | null>(null);
  const [customRemarks, setCustomRemarks] = useState('');
  const [customNextDate, setCustomNextDate] = useState('');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const next7DaysStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  // Group completed topics into Overdue, Due Today, and Upcoming (Next 7 Days)
  const { overdue, dueToday, upcoming, completedNoDate } = useMemo(() => {
    const overdueList: GateTopic[] = [];
    const dueTodayList: GateTopic[] = [];
    const upcomingList: GateTopic[] = [];
    const noDateList: GateTopic[] = [];

    topics
      .filter((t) => t.status === 'Completed')
      .forEach((t) => {
        if (!t.next_revision_date) {
          noDateList.push(t);
        } else if (t.next_revision_date < todayStr) {
          overdueList.push(t);
        } else if (t.next_revision_date === todayStr) {
          dueTodayList.push(t);
        } else if (t.next_revision_date <= next7DaysStr) {
          upcomingList.push(t);
        } else {
          upcomingList.push(t);
        }
      });

    // Sort overdue by oldest next_revision_date first
    overdueList.sort((a, b) => (a.next_revision_date || '').localeCompare(b.next_revision_date || ''));
    upcomingList.sort((a, b) => (a.next_revision_date || '').localeCompare(b.next_revision_date || ''));

    return {
      overdue: overdueList,
      dueToday: dueTodayList,
      upcoming: upcomingList,
      completedNoDate: noDateList,
    };
  }, [topics, todayStr, next7DaysStr]);

  const handleOpenRemarks = (topic: GateTopic) => {
    setRemarksTopic(topic);
    setCustomRemarks('');
    setCustomNextDate('');
  };

  const handleConfirmRevision = async () => {
    if (!remarksTopic) return;
    await markTopicRevised(
      remarksTopic.id,
      customRemarks.trim() || undefined,
      customNextDate || undefined
    );
    setRemarksTopic(null);
  };

  const renderTopicCard = (
    topic: GateTopic,
    badgeStyle: string,
    borderStyle: string,
    badgeText: string
  ) => {
    const subject = subjectMap.get(topic.subject_id);

    return (
      <div
        key={topic.id}
        className={`p-4 rounded-2xl border ${borderStyle} bg-white dark:bg-darkCard transition-all shadow-xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3`}
      >
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {badgeText}
            </span>
            {subject && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
              >
                {subject.name}
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-medium">
              Completed Rev #{topic.revision_count || 0}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {topic.topic_name}
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              Scheduled: <strong className="text-slate-700 dark:text-slate-300">{topic.next_revision_date}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              Confidence: {topic.confidence}/5
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={() => setHistoryTopic(topic)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="View revision log history"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleOpenRemarks(topic)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Revised</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. OVERDUE QUEUE (Rose highlight) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
              Overdue Revisions ({overdue.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Highest Priority</span>
        </div>

        {overdue.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No overdue topics! You are on top of your revision schedule.
          </div>
        ) : (
          <div className="space-y-2.5">
            {overdue.map((topic) =>
              renderTopicCard(
                topic,
                'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
                'border-rose-400/50 dark:border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/10',
                `Overdue (${topic.next_revision_date})`
              )
            )}
          </div>
        )}
      </div>

      {/* 2. DUE TODAY (Amber highlight) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-amber-600 dark:text-amber-400">
              Due Today ({dueToday.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Scheduled for today</span>
        </div>

        {dueToday.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No revisions due today. Check upcoming topics or solve mock tests.
          </div>
        ) : (
          <div className="space-y-2.5">
            {dueToday.map((topic) =>
              renderTopicCard(
                topic,
                'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
                'border-amber-400/50 dark:border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10',
                'Due Today'
              )
            )}
          </div>
        )}
      </div>

      {/* 3. UPCOMING (Next 7 Days & Later) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Upcoming Revisions ({upcoming.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Auto-Spaced Schedule</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No upcoming revisions. Mark syllabus topics as "Completed" in GATE Study to automatically schedule them.
          </div>
        ) : (
          <div className="space-y-2.5">
            {upcoming.map((topic) =>
              renderTopicCard(
                topic,
                'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
                'border-slate-200 dark:border-slate-800',
                `Due on ${topic.next_revision_date}`
              )
            )}
          </div>
        )}
      </div>

      {/* Mark Revised Remarks Modal */}
      {remarksTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRemarksTopic(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl z-10 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Log Revision #{(remarksTopic.revision_count || 0) + 1}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{remarksTopic.topic_name}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Remarks / Key Takeaways (Optional)
              </label>
              <textarea
                rows={2}
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="e.g. Practiced 5 tough GATE 2022 questions; mastered edge-cases."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Next Revision Date (Leave blank for auto-scheduled spaced repetition)
              </label>
              <input
                type="date"
                value={customNextDate}
                onChange={(e) => setCustomNextDate(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRemarksTopic(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRevision}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
              >
                Confirm Revision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <RevisionHistoryModal topic={historyTopic} onClose={() => setHistoryTopic(null)} />
    </div>
  );
};

