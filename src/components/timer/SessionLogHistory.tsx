import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Clock, Calendar, BookOpen } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const SessionLogHistory: React.FC = () => {
  const { sessions, subjects, topics } = useData();

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const topicMap = useMemo(() => {
    const map = new Map<string, string>();
    topics.forEach((t) => map.set(t.id, t.topic_name));
    return map;
  }, [topics]);

  const recentSessions = useMemo(() => {
    return [...sessions].slice(0, 10);
  }, [sessions]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          Recent Study Sessions ({sessions.length})
        </h3>
        <span className="text-xs text-slate-400">Auto-saved ≥ 1 min</span>
      </div>

      {recentSessions.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          No focus sessions recorded yet. Start the timer above!
        </div>
      ) : (
        <div className="space-y-2">
          {recentSessions.map((session) => {
            const subject = session.subject_id ? subjectMap.get(session.subject_id) : null;
            const topicName = session.topic_id ? topicMap.get(session.topic_id) : null;

            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {topicName || (subject ? `${subject.name} Revision` : 'General Focus Session')}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {session.session_date}
                    </span>
                    <span>•</span>
                    <span className="capitalize">{session.mode}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                    {session.duration_minutes}m
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
