import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useTimer } from '../../context/TimerContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Play, RotateCcw, AlertTriangle, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { format, isPast, parseISO, isToday } from 'date-fns';

export const NextUpCard: React.FC = () => {
  const navigate = useNavigate();
  const { topics, subjects, revisions, sessions } = useData();
  const { setSelectedSubjectId, setSelectedTopicId, startTimer } = useTimer();

  const recommendation = useMemo(() => {
    if (topics.length === 0) return null;

    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // 1. Check for Overdue Revision
    const overdueTopic = topics.find(
      (t) => t.status === 'Completed' && t.next_revision_date && t.next_revision_date < todayStr
    );
    if (overdueTopic) {
      const subject = subjects.find((s) => s.id === overdueTopic.subject_id);
      return {
        priorityType: 'Overdue Revision',
        priorityColor: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30',
        borderColor: 'border-rose-500/40',
        badge: 'Top Priority — Overdue',
        reason: `Revision #${(overdueTopic.revision_count || 0) + 1} was due on ${overdueTopic.next_revision_date}. Retain your edge with an active recall session.`,
        topic: overdueTopic,
        subject,
      };
    }

    // 2. Check for Revision Due Today
    const dueTodayTopic = topics.find(
      (t) => t.status === 'Completed' && t.next_revision_date === todayStr
    );
    if (dueTodayTopic) {
      const subject = subjects.find((s) => s.id === dueTodayTopic.subject_id);
      return {
        priorityType: 'Revision Due Today',
        priorityColor: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
        borderColor: 'border-amber-500/40',
        badge: 'Scheduled for Today',
        reason: `Scheduled Revision #${(dueTodayTopic.revision_count || 0) + 1} per the spaced repetition curve.`,
        topic: dueTodayTopic,
        subject,
      };
    }

    // 3. Lowest-confidence topic (In Progress or Completed with confidence <= 2)
    const lowConfidenceTopic = [...topics]
      .filter((t) => t.status !== 'Not Started' && t.confidence <= 2)
      .sort((a, b) => a.confidence - b.confidence)[0];

    if (lowConfidenceTopic) {
      const subject = subjects.find((s) => s.id === lowConfidenceTopic.subject_id);
      return {
        priorityType: 'Weakness Booster',
        priorityColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
        borderColor: 'border-indigo-500/40',
        badge: `Low Confidence (${lowConfidenceTopic.confidence}/5)`,
        reason: 'You marked this topic as challenging. Solving 10 focused PYQs here yields high score ROI.',
        topic: lowConfidenceTopic,
        subject,
      };
    }

    // 4. In Progress topic
    const inProgressTopic = topics.find((t) => t.status === 'In Progress');
    if (inProgressTopic) {
      const subject = subjects.find((s) => s.id === inProgressTopic.subject_id);
      return {
        priorityType: 'Continue Syllabus',
        priorityColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
        borderColor: 'border-emerald-500/40',
        badge: 'In Progress',
        reason: 'Pick up right where you left off and complete this core syllabus module.',
        topic: inProgressTopic,
        subject,
      };
    }

    // 5. Default next topic
    const anyTopic = topics[0];
    const subject = subjects.find((s) => s.id === anyTopic.subject_id);
    return {
      priorityType: 'Recommended Study',
      priorityColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/15 border-indigo-500/30',
      borderColor: 'border-indigo-500/40',
      badge: anyTopic.status,
      reason: 'Deep focus study block recommended.',
      topic: anyTopic,
      subject,
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
