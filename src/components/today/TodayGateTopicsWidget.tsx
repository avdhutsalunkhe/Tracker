import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { parseSubtopics, countSubtopics } from '../../utils/subtopics';
import { BookOpen, Plus, ChevronRight, ArrowRight } from 'lucide-react';

export const TodayGateTopicsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { topics, subjects } = useData();

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const recentTopics = topics.slice(0, 4);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            GATE Topics & Subtopics
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/gate"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold"
          >
            <Plus className="w-3 h-3" />
            <span>Add / Manage</span>
          </Link>
          <Link
            to="/gate"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>All ({topics.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {recentTopics.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          No GATE topics logged yet. Click "+ Add / Manage" to add subjects, topics, and subtopics.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {recentTopics.map((topic) => {
            const subj = subjectMap.get(topic.subject_id);
            const subList = parseSubtopics(topic.subtopic);
            const { done: subDone, total: subTotal } = countSubtopics(subList);

            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => navigate(`/gate/topic/${topic.id}`)}
                className="text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex items-center justify-between gap-2 group"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {subj && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${subj.color}18`, color: subj.color }}
                      >
                        {subj.name}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {topic.topic_name}
                  </div>
                  {subTotal > 0 && (
                    <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {subDone}/{subTotal} subtopics covered
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
