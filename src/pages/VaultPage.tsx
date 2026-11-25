import React, { useState } from 'react';
import { useData } from '../../src/context/DataContext';
import { FlashcardDeck } from '../components/vault/FlashcardDeck';
import { FormulaList } from '../components/vault/FormulaList';
import { AddCardModal } from '../components/vault/AddCardModal';
import { Bookmark, Sparkles, Layers, List } from 'lucide-react';

export const VaultPage: React.FC = () => {
  const { subjects, flashcards } = useData();

  const [activeTab, setActiveTab] = useState<'flashcards' | 'list'>('flashcards');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Formula Vault & Rapid Flashcards
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key theorems, edge-case conditions, and active recall cards for high GATE marks.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Flashcards</span>
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'list'
                ? 'bg-white dark:bg-darkCard text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Formula Table</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelectedSubjectId(null)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
              selectedSubjectId === null
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSubjectId(s.id === selectedSubjectId ? null : s.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors ${
                selectedSubjectId === s.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {activeTab === 'flashcards' && (
          <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-600 dark:text-slate-300 shrink-0">
            <input
              type="checkbox"
              checked={onlyNeedsReview}
              onChange={(e) => setOnlyNeedsReview(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600"
            />
            <span>Only Needs Review</span>
          </label>
        )}
      </div>

      {/* Main Content */}
      {activeTab === 'flashcards' ? (
        <FlashcardDeck
          selectedSubjectId={selectedSubjectId}
          onlyNeedsReview={onlyNeedsReview}
        />
      ) : (
        <FormulaList
          selectedSubjectId={selectedSubjectId}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      )}

      {/* Add Modal */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultSubjectId={selectedSubjectId || undefined}
      />
    </div>
  );
};
