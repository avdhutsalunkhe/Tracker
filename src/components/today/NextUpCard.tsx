import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTimer } from '../../context/TimerContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play } from 'lucide-react';
import { format } from 'date-fns';
import { computeTopicROIScore, getEffectiveConfidence, isConfidenceDecayed } from '../../utils/topicIntelligence';

export const NextUpCard: React.FC = () => {
  const navigate = useNavigate();
  const { topics, subjects, revisions, sessions } = useData();
  const { setSelectedSubjectId, setSelectedTopicId, startTimer } = useTimer();

  const recommendation = useMemo(() => {
    if (topics.length === 0) return null;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    // Rank all topics by ROI formula: Weightage * (6 - EffectiveConfidence) + OverdueBonus
    const ranked = [...topics]
      .map((topic) => {
        const subject = subjectMap.get(topic.subject_id);
        const roi = computeTopicROIScore(topic, subject, todayStr);
        return { topic, subject, roi };
      })
      .sort((a, b) => b.roi - a.roi);

    const best = ranked[0];
    if (!best) return null;
    const { topic, subject, roi } = best;
    const effConf = getEffectiveConfidence(topic);
    const decayed = isConfidenceDecayed(topic);

    if (topic.status === 'Completed' && topic.next_revision_date && topic.next_revision_date < todayStr) {
      return {
        priorityColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30',
        borderColor: 'border-rose-500/40',
        badge: `Overdue Revision · ROI ${Math.round(roi)}`,
        reason: `Revision #${(topic.revision_count || 0) + 1} was due on ${topic.next_revision_date}. High-yield active recall recommended.`,
        topic,
        subject,
        decayed,
      };
    }

    if (topic.status === 'Completed' && topic.next_revision_date === todayStr) {
      return {
        priorityColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
        borderColor: 'border-amber-500/40',
        badge: `Due Today · ROI ${Math.round(roi)}`,
        reason: `Scheduled Revision #${(topic.revision_count || 0) + 1} per the spaced repetition curve.`,
        topic,
        subject,
        decayed,
      };
    }

    return {
      priorityColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
      borderColor: 'border-indigo-500/40',
      badge: `ROI ${Math.round(roi)} · Conf ${effConf}/5`,
      reason: decayed
        ? 'Confidence decayed after 21+ days without revision. Review key concepts and solve PYQs.'
        : 'Highest expected GATE marks return based on subject weightage and confidence gap.',
      topic,
      subject,
      decayed,
    };
  }, [topics, subjects]);

  if (!recommendation || !recommendation.topic) {
    return null;
  }

  const handleStartFocus = () => {
    if (recommendation.topic) {
      setSelectedSubjectId(recommendation.topic.subject_id);
      setSelectedTopicId(recommendation.topic.id);
      startTimer();
      navigate('/timer');
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white dark:bg-darkCard border ${recommendation.borderColor} p-4 sm:p-5 shadow-sm transition-all hover:shadow-md`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> What to Study Next?
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${recommendation.priorityColor}`}
            >
              {recommendation.badge}
            </span>
          </div>

          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {recommendation.topic.topic_name}
            </h3>
            {recommendation.subject && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${recommendation.subject.color}18`,
                  color: recommendation.subject.color,
                }}
              >
                {recommendation.subject.name}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {recommendation.reason}
          </p>
        </div>

        {/* Right: 1-Click Action */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          <button
            onClick={handleStartFocus}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Focus Timer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

