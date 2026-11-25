import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { GATE_BRANCH_PRESETS } from '../../lib/constants';
import { Sparkles, BookOpen, Check } from 'lucide-react';

interface SeedSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeed: (branchName: string) => Promise<void>;
}

export const SeedSubjectsModal: React.FC<SeedSubjectsModalProps> = ({ isOpen, onClose, onSeed }) => {
  const [selectedBranch, setSelectedBranch] = useState(GATE_BRANCH_PRESETS[0].branchName);
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      await onSeed(selectedBranch);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Seed Sample GATE Syllabus"
      subtitle="Instantly populate your tracker with standard GATE subjects and high-weightage topics."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Select Your GATE Engineering Branch:
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {GATE_BRANCH_PRESETS.map((preset) => {
              const isSelected = selectedBranch === preset.branchName;
              return (
                <div
                  key={preset.branchName}
                  onClick={() => setSelectedBranch(preset.branchName)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{preset.branchName}</span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex gap-1.5 flex-wrap">
                    {preset.subjects.slice(0, 4).map((s) => (
                      <span key={s.name} className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {s.name}
                      </span>
                    ))}
                    {preset.subjects.length > 4 && <span>+{preset.subjects.length - 4} more</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSeed}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load Syllabus</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

