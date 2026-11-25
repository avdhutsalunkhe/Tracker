import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { MistakeCategory } from '../../types';
import { Plus } from 'lucide-react';

interface AddMistakeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMistakeModal: React.FC<AddMistakeModalProps> = ({ isOpen, onClose }) => {
  const { subjects, mockTests, addMistake } = useData();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MistakeCategory>('Conceptual Gap');
  const [subjectId, setSubjectId] = useState('');
  const [mockTestId, setMockTestId] = useState('');
  const [fixNote, setFixNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories: MistakeCategory[] = [
    'Conceptual Gap',
    'Silly / Calculation',
    'Formula Forgotten',
    'Time Pressure',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fixNote.trim()) return;

    setSubmitting(true);
    try {
      await addMistake({
        title: title.trim(),
        category,
        subject_id: subjectId || null,
        mock_test_id: mockTestId || null,
        fix_note: fixNote.trim(),
      });
      setTitle('');
      setFixNote('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Mistake Entry"
      subtitle="Analyze your errors to ensure they never repeat on exam day."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Mistake / Question Concept Summary
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Inverted condition in Little's Law, Forgot consensus term in K-Map"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Error Category
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            >
              <option value="">Select Subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Linked Mock Test (Optional)
            </label>
            <select
              value={mockTestId}
              onChange={(e) => setMockTestId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            >
              <option value="">None / Self-study Question</option>
              {mockTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Fix / Rule to Remember (The Golden Takeaway)
          </label>
          <textarea
            rows={3}
            required
            value={fixNote}
            onChange={(e) => setFixNote(e.target.value)}
            placeholder="What exact principle or check prevents this mistake? (e.g. Always check whether the graph is directed or undirected before applying Handshaking lemma!)"
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
            disabled={submitting || !title.trim() || !fixNote.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mistake</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
