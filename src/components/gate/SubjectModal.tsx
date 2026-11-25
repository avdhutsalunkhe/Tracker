import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { SUBJECT_COLORS } from '../../lib/constants';
import { Plus, Check } from 'lucide-react';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => Promise<string | null>;
  initialName?: string;
  initialColor?: string;
  isEditing?: boolean;
  onUpdate?: (name: string, color: string) => Promise<void>;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  initialName = '',
  initialColor = SUBJECT_COLORS[0],
  isEditing = false,
  onUpdate,
}) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setColor(initialColor);
    }
  }, [isOpen, initialName, initialColor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (isEditing && onUpdate) {
        await onUpdate(name.trim(), color);
      } else {
        await onAdd(name.trim(), color);
      }
      setName('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit GATE Subject' : 'Add GATE Subject'}
      subtitle="Organize your GATE syllabus by subject."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Subject Name
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Operating Systems, Algorithms, Linear Algebra"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Subject Color Tag
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {SUBJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-xs"
                style={{ backgroundColor: c }}
              >
                {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>
            ))}
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
            type="submit"
            disabled={submitting || !name.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isEditing ? 'Save Subject' : 'Add Subject'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

