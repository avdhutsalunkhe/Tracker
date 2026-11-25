import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Flashcard } from '../../types';
import { Search, Plus, Trash2, Bookmark, CheckCircle2 } from 'lucide-react';

interface FormulaListProps {
  selectedSubjectId: string | null;
  onOpenAddModal: () => void;
}

export const FormulaList: React.FC<FormulaListProps> = ({ selectedSubjectId, onOpenAddModal }) => {
  const { flashcards, subjects, toggleFlashcardReview, deleteFlashcard } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const filteredCards = useMemo(() => {
    return flashcards.filter((c) => {
      if (selectedSubjectId && c.subject_id !== selectedSubjectId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          c.front_prompt.toLowerCase().includes(q) ||
          c.back_answer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [flashcards, selectedSubjectId, searchQuery]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formulas, theorems, properties..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors shrink-0 self-end sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Formula</span>
        </button>
      </div>

      {/* List */}
      {filteredCards.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No formulas found. Add your first formula to the vault!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCards.map((card) => {
            const subject = card.subject_id ? subjectMap.get(card.subject_id) : null;

            return (
              <div
                key={card.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    {subject ? (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                      >
                        {subject.name}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        General
                      </span>
                    )}

                    <button
                      onClick={() => toggleFlashcardReview(card.id)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${card.needs_review
                          ? 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                          : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        }`}
                    >
                      {card.needs_review ? 'Needs Review' : 'Mastered'}
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {card.front_prompt}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-mono bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 whitespace-pre-line mt-2">
                    {card.back_answer}
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      if (confirm('Delete this formula card?')) {
                        deleteFlashcard(card.id);
                      }
                    }}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

