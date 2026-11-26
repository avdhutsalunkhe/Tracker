import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { uploadFormulaImage } from '../../lib/studyDocuments';
import { Plus, Bookmark, Image as ImageIcon, X, Loader2 } from 'lucide-react';

interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSubjectId?: string;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, defaultSubjectId }) => {
  const { user } = useAuth();
  const { subjects, addFlashcard } = useData();
  const { showToast } = useToast();

  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [frontPrompt, setFrontPrompt] = useState('');
  const [backAnswer, setBackAnswer] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imgInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontPrompt.trim() || (!backAnswer.trim() && !imageFile)) return;

    setSubmitting(true);
    try {
      let finalBack = backAnswer.trim();
      if (imageFile) {
        if (!user?.id) {
          showToast({
            type: 'error',
            title: 'Sign In Required',
            message: 'Sign in with your Supabase account to upload formula images.',
          });
          return;
        }
        const path = await uploadFormulaImage(user.id, imageFile);
        const marker = `[[formula-img:${path}]]`;
        finalBack = finalBack ? `${finalBack}\n\n${marker}` : marker;
      }
      await addFlashcard(subjectId || null, frontPrompt.trim(), finalBack);
      setFrontPrompt('');
      setBackAnswer('');
      setImageFile(null);
      onClose();
    } catch (err: unknown) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: (err as Error).message,
      });
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
            value={backAnswer}
            onChange={(e) => setBackAnswer(e.target.value)}
            placeholder="e.g. T(n) = aT(n/b) + f(n) — or attach a photo of your book/notes below."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <input
            ref={imgInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>{imageFile ? 'Change Image' : 'Upload Formula Image'}</span>
          </button>

          {imageFile && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
              <span className="truncate max-w-[160px]">{imageFile.name}</span>
              <button type="button" onClick={() => setImageFile(null)} className="hover:text-rose-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
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
            disabled={submitting || !frontPrompt.trim() || (!backAnswer.trim() && !imageFile)}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>{submitting ? 'Uploading...' : 'Save Flashcard'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

