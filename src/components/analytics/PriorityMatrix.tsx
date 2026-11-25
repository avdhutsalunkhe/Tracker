import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTimer } from '../../context/TimerContext';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Play, Star, BookOpen, AlertTriangle } from 'lucide-react';

export const PriorityMatrix: React.FC = () => {
  const navigate = useNavigate();
  const { topics, subjects, mistakes } = useData();
  const { setSelectedSubjectId, setSelectedTopicId, startTimer } = useTimer();

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  // Weak topics: confidence <= 2 or associated with unresolved mistakes
  const weakTopics = useMemo(() => {
    return topics
      .filter((t) => t.confidence <= 2 || t.status === 'In Progress')
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 6);
  }, [topics]);

  const handleFocusTopic = (topic: (typeof weakTopics)[0]) => {
    setSelectedSubjectId(topic.subject_id);
    setSelectedTopicId(topic.id);
    startTimer();
    navigate('/timer');
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            Weakness Priority Radar
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Topics marked Confidence ≤ 2 or requiring deep revision
          </p>
        </div>
      </div>

      {weakTopics.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No weak topics identified! All syllabus topics have confidence ≥ 3.
        </div>
      ) : (
        <div className="space-y-2">
          {weakTopics.map((topic) => {
            const subject = subjectMap.get(topic.subject_id);

            return (
              <div
                key={topic.id}
                className="p-3 rounded-xl border border-rose-300/40 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {subject && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
                      >
                        {subject.name}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-rose-500 text-rose-500" />
                      Confidence {topic.confidence}/5
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                    {topic.topic_name}
                  </div>
                  {topic.notes && (
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">{topic.notes}</div>
                  )}
                </div>

                <button
                  onClick={() => handleFocusTopic(topic)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-2xs shrink-0 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Drill PYQs</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
