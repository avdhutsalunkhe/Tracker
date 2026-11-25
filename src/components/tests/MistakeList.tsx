import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { MistakeCategory } from '../../types';
import { AddMistakeModal } from './AddMistakeModal';
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Filter,
  Plus,
  Check,
  RotateCcw,
  BookOpen
} from 'lucide-react';

export const MistakeList: React.FC = () => {
  const { mistakes, subjects, mockTests, toggleMistakeResolved, deleteMistake } = useData();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'All' | MistakeCategory>('All');
  const [showOnlyUnresolved, setShowOnlyUnresolved] = useState(false);

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  const testMap = useMemo(() => {
    const map = new Map<string, string>();
    mockTests.forEach((t) => map.set(t.id, t.title));
    return map;
  }, [mockTests]);

  const categories: Array<'All' | MistakeCategory> = [
    'All',
    'Conceptual Gap',
    'Silly / Calculation',
    'Formula Forgotten',
    'Time Pressure',
  ];

  const filteredMistakes = useMemo(() => {
    return mistakes.filter((m) => {
      if (categoryFilter !== 'All' && m.category !== categoryFilter) return false;
      if (showOnlyUnresolved && m.is_resolved) return false;
      return true;
    });
  }, [mistakes, categoryFilter, showOnlyUnresolved]);

  const unresolvedCount = mistakes.filter((m) => !m.is_resolved).length;

  const getCategoryBadge = (cat: MistakeCategory) => {
    switch (cat) {
      case 'Conceptual Gap':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'Silly / Calculation':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'Formula Forgotten':
        return 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30';
      case 'Time Pressure':
        return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
    }
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Mistake Notebook & Error Log
            </h3>
            {unresolvedCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {unresolvedCount} Unresolved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Fix root causes and review high-yield rules to remember.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Mistake</span>
        </button>
      </div>

      {/* Filter Tabs and Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors ${categoryFilter === c
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Toggle Unresolved */}
        <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showOnlyUnresolved}
            onChange={(e) => setShowOnlyUnresolved(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 rounded-sm"
          />
          <span>Only Unresolved</span>
        </label>
      </div>

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No mistakes found under this filter. Keep up the high accuracy!
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMistakes.map((mistake) => {
            const subject = mistake.subject_id ? subjectMap.get(mistake.subject_id) : null;
            const testName = mistake.mock_test_id ? testMap.get(mistake.mock_test_id) : null;

            return (
              <div
                key={mistake.id}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${mistake.is_resolved
                    ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-80'
                    : 'bg-white dark:bg-darkCard border-slate-200 dark:border-slate-800 shadow-2xs hover:border-amber-400/50'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(
                          mistake.category
                        )}`}
                      >
                        {mistake.category}
                      </span>
                      {subject && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                        >
                          {subject.name}
                        </span>
                      )}
                      {testName && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                          From: {testName}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-xs sm:text-sm font-bold ${mistake.is_resolved
                          ? 'line-through text-slate-400'
                          : 'text-slate-900 dark:text-slate-100'
                        }`}
                    >
                      {mistake.title}
                    </h4>

                    {mistake.fix_note && (
                      <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40 text-xs">
                        <span className="font-bold text-indigo-700 dark:text-indigo-400 mr-1.5">
                          Rule to Remember:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">{mistake.fix_note}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleMistakeResolved(mistake.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${mistake.is_resolved
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      title={mistake.is_resolved ? 'Mark Unresolved' : 'Mark as Mastered & Resolved'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{mistake.is_resolved ? 'Resolved' : 'Resolve'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Delete this mistake log?')) {
                          deleteMistake(mistake.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      <AddMistakeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

