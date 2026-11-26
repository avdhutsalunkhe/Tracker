import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { GateTopic, TopicStatus } from '../../types';
import { parseSubtopics } from '../../utils/subtopics';
import { Search, Plus, ChevronRight, BookOpen } from 'lucide-react';

interface TopicTableProps {
  selectedSubjectId: string | null;
  onOpenAddTopic: (subjectId?: string) => void;
  onEditTopic: (topic: GateTopic) => void;
}

export const TopicTable: React.FC<TopicTableProps> = ({
  selectedSubjectId,
  onOpenAddTopic,
}) => {
  const navigate = useNavigate();
  const { topics, subjects } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TopicStatus>('All');

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (selectedSubjectId && t.subject_id !== selectedSubjectId) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.topic_name.toLowerCase().includes(q);
        const matchesSubtopic = t.subtopic && t.subtopic.toLowerCase().includes(q);
        const matchesNotes = t.notes && t.notes.toLowerCase().includes(q);
        const subjectName = subjectMap.get(t.subject_id)?.name.toLowerCase() || '';
        const matchesSubject = subjectName.includes(q);
        if (!matchesName && !matchesSubtopic && !matchesNotes && !matchesSubject) return false;
      }
      return true;
    });
  }, [topics, selectedSubjectId, statusFilter, searchQuery, subjectMap]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics or subtopics..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between lg:justify-end">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs overflow-x-auto">
            {(['All', 'Completed', 'In Progress', 'Not Started'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  statusFilter === st
                    ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenAddTopic(selectedSubjectId || undefined)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>

      {/* Simple Clean Cards */}
      {filteredTopics.length === 0 ? (
        <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
          <BookOpen className="w-7 h-7 mx-auto mb-2 opacity-40" />
          No topics match your filter. Click "+ Add Topic" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredTopics.map((topic) => {
            const subject = subjectMap.get(topic.subject_id);
            const subList = parseSubtopics(topic.subtopic);
            const subDone = subList.filter((s) => s.done).length;

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => navigate(`/gate/topic/${topic.id}`)}
                className="text-left p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800/70 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {subject && (
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{
                          backgroundColor: `${subject.color}18`,
                          color: subject.color,
                        }}
                      >
                        {subject.name}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        topic.status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : topic.status === 'In Progress'
                          ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {topic.status}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug break-words">
                    {topic.topic_name}
                  </div>

                  {subList.length > 0 && (
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {subDone}/{subList.length} subtopics covered
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
