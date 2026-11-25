import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Flashcard } from '../../types';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Sparkles,
  Shuffle
} from 'lucide-react';

interface FlashcardDeckProps {
  selectedSubjectId: string | null;
  onlyNeedsReview: boolean;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  selectedSubjectId,
  onlyNeedsReview,
}) => {
  const { flashcards, subjects, toggleFlashcardReview } = useData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const deck = useMemo(() => {
    return flashcards.filter((c) => {
      if (selectedSubjectId && c.subject_id !== selectedSubjectId) return false;
      if (onlyNeedsReview && !c.needs_review) return false;
      return true;
    });
  }, [flashcards, selectedSubjectId, onlyNeedsReview]);

  // Reset index when deck changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedSubjectId, onlyNeedsReview]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, deck.length]);

  const handleNext = () => {
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  if (deck.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder text-xs text-slate-400">
        No flashcards found matching the selected filter. Add some formulas below!
      </div>
    );
  }

  const currentCard = deck[currentIndex];
  const subject = currentCard.subject_id ? subjectMap.get(currentCard.subject_id) : null;

  return (
    <div className="space-y-4">
      {/* Deck Progress Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <span>
          Card {currentIndex + 1} of {deck.length}
        </span>
        <span className="text-[11px] text-slate-400">Press Space or Tap Card to Flip</span>
      </div>

      {/* The 3D Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[220px] sm:min-h-[260px] p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkCard border-2 border-indigo-500/30 hover:border-indigo-500/60 shadow-md cursor-pointer select-none flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
      >
        {/* Top Header of Card */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFlipped
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                }`}
            >
              {isFlipped ? 'ANSWER / FORMULA' : 'CONCEPT / PROMPT'}
            </span>
            {subject && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded"
                style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
              >
                {subject.name}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFlashcardReview(currentCard.id);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${currentCard.needs_review
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
          >
            <Bookmark className="w-3 h-3 fill-current" />
            <span>{currentCard.needs_review ? 'Needs Review' : 'Mastered'}</span>
          </button>
        </div>

        {/* Center Content */}
        <div className="py-6 flex items-center justify-center text-center">
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed">
            {isFlipped ? currentCard.back_answer : currentCard.front_prompt}
          </p>
        </div>

        {/* Bottom Hint */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <RotateCw className="w-3 h-3" /> Click to flip
          </span>
          <span>GATE High-Yield Formula</span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-3 px-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
        >
          Flip Card
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === deck.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-xs"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

