import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { GateTopic, TopicStatus } from '../../types';
import {
  Search,
  Plus,
  Star,
  RotateCcw,
  BookOpen,
  Edit2,
  Trash2,
  Clock,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface TopicTableProps {
  selectedSubjectId: string | null;
  onOpenAddTopic: (subjectId?: string) => void;
  onEditTopic: (topic: GateTopic) => void;
}

export const TopicTable: React.FC<TopicTableProps> = ({
  selectedSubjectId,
  onOpenAddTopic,
  onEditTopic,
}) => {
  const { topics, subjects, updateTopic, deleteTopic, markTopicRevised } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | TopicStatus>('All');
  const [remarksModalTopic, setRemarksModalTopic] = useState<GateTopic | null>(null);
  const [remarksInput, setRemarksInput] = useState('');

  // Map of subject id to subject object
  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      if (selectedSubjectId && t.subject_id !== selectedSubjectId) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.topic_name.toLowerCase().includes(q);
        const matchesNotes = t.notes && t.notes.toLowerCase().includes(q);
        const subjectName = subjectMap.get(t.subject_id)?.name.toLowerCase() || '';
        const matchesSubject = subjectName.includes(q);
        if (!matchesName && !matchesNotes && !matchesSubject) return false;
      }
      return true;
    });
  }, [topics, selectedSubjectId, statusFilter, searchQuery, subjectMap]);

  const handleStatusChange = (topic: GateTopic, newStatus: TopicStatus) => {
    updateTopic(topic.id, { status: newStatus });
  };

  const handleQuickRevision = (topic: GateTopic) => {
    markTopicRevised(topic.id, 'Quick revision check-off');
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Controls Bar: Search + Status Filter + Add Topic Button */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search topics, formulas, or notes..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters and Add */}
        <div className="flex items-center gap-2 flex-wrap justify-between md:justify-end">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
            {(['All', 'Completed', 'In Progress', 'Not Started'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${statusFilter === st
                    ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenAddTopic(selectedSubjectId || undefined)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Topic</span>
          </button>
        </div>
      </div>

      {/* Table / List */}
      {filteredTopics.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No syllabus topics match the current filter or search criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Topic / Subject</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Confidence</th>
                <th className="py-3 px-3 text-center">PYQs</th>
                <th className="py-3 px-3 text-center">Hours</th>
                <th className="py-3 px-3">Revision</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTopics.map((topic) => {
                const subject = subjectMap.get(topic.subject_id);

                return (
                  <tr
                    key={topic.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Topic Name & Subject Tag */}
                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{topic.topic_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {subject && (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{
                              backgroundColor: `${subject.color}18`,
                              color: subject.color,
                            }}
                          >
                            {subject.name}
                          </span>
                        )}
                        {topic.notes && (
                          <span className="text-[10px] text-slate-400 truncate max-w-[240px]">
                            {topic.notes}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-3">
                      <select
                        value={topic.status}
                        onChange={(e) => handleStatusChange(topic, e.target.value as TopicStatus)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${topic.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : topic.status === 'In Progress'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </td>

                    {/* Confidence Stars */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => updateTopic(topic.id, { confidence: star })}
                            className="hover:scale-110 transition-transform"
                            title={`Set confidence to ${star}/5`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${star <= topic.confidence
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                                }`}
                            />
                          </button>
                        ))}
                      </div>
                    </td>

                    {/* PYQs Solved */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {topic.pyqs_solved || 0}
                    </td>

                    {/* Hours */}
                    <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {topic.study_hours || 0}h
                    </td>

                    {/* Spaced Revision info */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {topic.status === 'Completed' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuickRevision(topic)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 font-bold text-[10px] transition-colors"
                            title="Click to check off revision & schedule next"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Rev #{topic.revision_count || 0}
                          </button>
                          {topic.next_revision_date && (
                            <span className="text-[10px] text-slate-400">
                              Next: {topic.next_revision_date}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Mark Completed to schedule</span>
                      )}
                    </td>

                    {/* Edit / Delete Actions */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onEditTopic(topic)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                          title="Edit Topic"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete topic "${topic.topic_name}"?`)) {
                              deleteTopic(topic.id);
                            }
                          }}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                          title="Delete Topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

