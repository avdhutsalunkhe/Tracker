import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { Plus, Bookmark } from 'lucide-react';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, defaultSubjectId }) => {
  const { subjects, addFlashcard } = useData();

  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [frontPrompt, setFrontPrompt] = useState('');
  const [backAnswer, setBackAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontPrompt.trim() || !backAnswer.trim()) return;

    setSubmitting(true);
    try {
      await addFlashcard(subjectId || null, frontPrompt.trim(), backAnswer.trim());
      setFrontPrompt('');
      setBackAnswer('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Formula Vault & Flashcards"
      subtitle="Quick definitions, theorems, formulas, and tricky edge-case rules."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Subject
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
          >
            <option value="">General / All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Card Front (Question / Concept / Formula Name)
          </label>
          <input
            type="text"
            required
            autoFocus
            value={frontPrompt}
            onChange={(e) => setFrontPrompt(e.target.value)}
            placeholder="e.g. Master Theorem Case 3 Condition?, Bellman-Ford Time Complexity?"
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Card Back (Formula / Solution / Key Theorem)
          </label>
          <textarea
            rows={4}
            required
            value={backAnswer}
            onChange={(e) => setBackAnswer(e.target.value)}
            placeholder="e.g. T(n) = aT(n/b) + f(n). If f(n) = Omega(n^(log_b(a) + eps)) and regularity condition af(n/b) <= cf(n) holds, then T(n) = Theta(f(n))."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !frontPrompt.trim() || !backAnswer.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Save Flashcard</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
