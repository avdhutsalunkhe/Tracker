import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { MathText } from '../common/MathText';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Zap,
} from 'lucide-react';

interface FlashcardDeckProps {
  selectedSubjectId: string | null;
  onlyNeedsReview: boolean;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  selectedSubjectId,
  onlyNeedsReview,
}) => {
  const { flashcards, subjects, toggleFlashcardReview, gradeFlashcardSM2 } = useData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizMode, setQuizMode] = useState(false);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const deck = useMemo(() => {
    const filtered = flashcards.filter((c) => {
      if (selectedSubjectId && c.subject_id !== selectedSubjectId) return false;
      if (onlyNeedsReview && !c.needs_review) return false;
      return true;
    });
    if (quizMode) {
      return filtered.slice(0, 10);
    }
    return filtered;
  }, [flashcards, selectedSubjectId, onlyNeedsReview, quizMode]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedSubjectId, onlyNeedsReview, quizMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < deck.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
          setIsFlipped(false);
        }
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

  const handleGrade = async (quality: 0 | 2 | 4 | 5) => {
    const card = deck[currentIndex];
    if (!card) return;
    await gradeFlashcardSM2(card.id, quality);
    if (currentIndex < deck.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFlipped(false);
    }
  };

  if (deck.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder text-xs text-slate-400">
        No flashcards found matching the selected filter. Add some formulas in Formula Table!
      </div>
    );
  }

  const currentCard = deck[currentIndex];
  const subject = currentCard.subject_id ? subjectMap.get(currentCard.subject_id) : null;

  return (
    <div className="space-y-4">
      {/* Deck Progress Bar + Quiz Mode Toggle */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500 font-semibold px-1 flex-wrap">
        <span className="tabular-nums">
          Card {currentIndex + 1} of {deck.length} {quizMode ? '(10-Card SM-2 Quiz)' : ''}
        </span>

        <button
          type="button"
          onClick={() => setQuizMode(!quizMode)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
            quizMode
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-darkCard text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{quizMode ? 'Exit 10-Card Quiz' : 'Rapid-Fire 10-Card Quiz'}</span>
        </button>
      </div>

      {/* Flip Card */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full min-h-[220px] sm:min-h-[260px] p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkCard border-2 border-indigo-500/30 hover:border-indigo-500/60 shadow-md cursor-pointer select-none flex flex-col justify-between transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isFlipped
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
            {currentCard.interval_days && (
              <span className="text-[10px] text-slate-400 tabular-nums">
                Interval: {currentCard.interval_days}d
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFlashcardReview(currentCard.id);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
              currentCard.needs_review
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <Bookmark className="w-3 h-3 fill-current" />
            <span>{currentCard.needs_review ? 'Needs Review' : 'Mastered'}</span>
          </button>
        </div>

        {/* Center KaTeX Math Content */}
        <div className="py-6 flex items-center justify-center text-center">
          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 whitespace-pre-line leading-relaxed max-w-full overflow-x-auto">
            <MathText text={isFlipped ? currentCard.back_answer : currentCard.front_prompt} />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <RotateCw className="w-3 h-3" /> Tap or press Space to flip
          </span>
          <span>LaTeX ($...$) supported</span>
        </div>
      </div>

      {/* SM-2 Grading Buttons when in Quiz Mode & Flipped */}
      {quizMode && isFlipped ? (
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleGrade(0)}
            className="py-2.5 px-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/30"
          >
            Again (1d)
          </button>
          <button
            type="button"
            onClick={() => handleGrade(2)}
            className="py-2.5 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30"
          >
            Hard
          </button>
          <button
            type="button"
            onClick={() => handleGrade(4)}
            className="py-2.5 px-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-500/30"
          >
            Good
          </button>
          <button
            type="button"
            onClick={() => handleGrade(5)}
            className="py-2.5 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30"
          >
            Easy
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
};
