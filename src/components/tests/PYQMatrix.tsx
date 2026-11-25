import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { PYQQuestionType } from '../../types';
import { Grid3X3, Plus, Check } from 'lucide-react';

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];
const Q_TYPES: PYQQuestionType[] = ['MCQ', 'MSQ', 'NAT'];

export const PYQMatrix: React.FC = () => {
  const { pyqMatrix, upsertPyqMatrix } = useData();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedType, setSelectedType] = useState<PYQQuestionType>('MCQ');

  const matrixMap = useMemo(() => {
    const map = new Map<string, { solved: number; correct: number }>();
    pyqMatrix.forEach((e) => {
      map.set(`${e.year}-${e.question_type}`, {
        solved: e.solved_count,
        correct: e.correct_count,
      });
    });
    return map;
  }, [pyqMatrix]);

  const typeTotals = useMemo(() => {
    return Q_TYPES.map((t) => {
      const entries = pyqMatrix.filter((e) => e.question_type === t);
      const solved = entries.reduce((acc, e) => acc + e.solved_count, 0);
      const correct = entries.reduce((acc, e) => acc + e.correct_count, 0);
      const accPct = solved > 0 ? Math.round((correct / solved) * 100) : 0;
      return { type: t, solved, correct, accPct };
    });
  }, [pyqMatrix]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Grid3X3 className="w-4 h-4 text-indigo-500" />
            PYQ Matrix (Year × Question Type)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track solved Previous Year Questions and accuracy across MCQ, MSQ, and NAT.
          </p>
        </div>

        {/* Quick Log Controls */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold tabular-nums outline-none"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as PYQQuestionType)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
          >
            {Q_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => upsertPyqMatrix(selectedYear, selectedType, 1, 1)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <Check className="w-3 h-3" />
            <span>+1 Correct</span>
          </button>
          <button
            type="button"
            onClick={() => upsertPyqMatrix(selectedYear, selectedType, 1, 0)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            <Plus className="w-3 h-3" />
            <span>+1 Wrong</span>
          </button>
        </div>
      </div>

      {/* Accuracy Summary Pills */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {typeTotals.map((t) => (
          <div
            key={t.type}
            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-center"
          >
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{t.type}</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
              {t.accPct}%
            </div>
            <div className="text-[10px] text-slate-400 tabular-nums">
              {t.correct}/{t.solved} solved
            </div>
          </div>
        ))}
      </div>

      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase">
              <th className="py-2 px-3">Year</th>
              {Q_TYPES.map((t) => (
                <th key={t} className="py-2 px-3 text-center">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 tabular-nums">
            {YEARS.map((y) => (
              <tr key={y} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">{y}</td>
                {Q_TYPES.map((t) => {
                  const cell = matrixMap.get(`${y}-${t}`) || { solved: 0, correct: 0 };
                  const pct = cell.solved > 0 ? Math.round((cell.correct / cell.solved) * 100) : 0;
                  return (
                    <td key={t} className="py-2 px-3 text-center">
                      {cell.solved === 0 ? (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px]">
                          {cell.correct}/{cell.solved} ({pct}%)
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
