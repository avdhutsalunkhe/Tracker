import React from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { GateTopic } from '../../types';
import { RotateCcw, Calendar, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RevisionHistoryModalProps {
  topic: GateTopic | null;
  onClose: () => void;
}

export const RevisionHistoryModal: React.FC<RevisionHistoryModalProps> = ({ topic, onClose }) => {
  const { revisions } = useData();

  if (!topic) return null;

  const topicRevisions = revisions
    .filter((r) => r.topic_id === topic.id)
    .sort((a, b) => b.revision_number - a.revision_number);

  return (
    <Modal
      isOpen={Boolean(topic)}
      onClose={onClose}
      title={`Revision History: ${topic.topic_name}`}
      subtitle={`Completed ${topic.revision_count || 0} spaced revisions so far.`}
    >
      <div className="space-y-4">
        {topicRevisions.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No past revision records logged yet for this topic.
          </div>
        ) : (
          <div className="relative border-l-2 border-indigo-500/30 pl-4 ml-2 space-y-4">
            {topicRevisions.map((rev) => (
              <div key={rev.id} className="relative">
                {/* Dot */}
                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-900" />

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 mb-1">
                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Revision #{rev.revision_number}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {rev.revised_on}
                    </span>
                  </div>
                  {rev.remarks && (
                    <p className="text-slate-600 dark:text-slate-300 mt-1 italic">
                      "{rev.remarks}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

