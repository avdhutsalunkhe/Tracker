import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Award, Trash2, Calendar, Target, AlertTriangle } from 'lucide-react';

interface TestTableProps {
  onOpenAddTest: () => void;
}

export const TestTable: React.FC<TestTableProps> = ({ onOpenAddTest }) => {
  const { mockTests, subjects, deleteMockTest } = useData();

  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  return (
    <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            Mock Tests & PYQs Logged ({mockTests.length})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Score, accuracy, and negative marks summary</p>
        </div>

        <button
          onClick={onOpenAddTest}
          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          + Log New Test
        </button>
      </div>

      {mockTests.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No mock tests logged yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Test Title</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Marks Scored</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Q Breakdown</th>
                <th className="py-2.5 px-3 text-rose-500">Negative</th>
                <th className="py-2.5 px-3 text-right">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {mockTests.map((t) => {
                const subject = t.subject_id ? subjectMap.get(t.subject_id) : null;
                const attempted = t.correct_count + t.wrong_count;
                const accuracy = attempted > 0 ? Math.round((t.correct_count / attempted) * 100) : 0;
                const percent = Math.round((t.marks_scored / t.total_marks) * 100);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 min-w-[160px]">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{t.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {t.test_type}
                        </span>
                        {subject && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${subject.color}15`, color: subject.color }}
                          >
                            {subject.name}
                          </span>
                        )}
                      </div>
                      {t.notes && <div className="text-[10px] text-slate-400 mt-1 italic">{t.notes}</div>}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">{t.test_date}</td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {t.marks_scored.toFixed(2)}
                      </span>
                      <span className="text-slate-400"> / {t.total_marks} ({percent}%)</span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded-full ${accuracy >= 80
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : accuracy >= 65
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                          }`}
                      >
                        {accuracy}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-slate-500">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.correct_count}C</span> /{' '}
                      <span className="text-rose-500 font-semibold">{t.wrong_count}W</span> /{' '}
                      <span className="text-slate-400">{t.unattempted_count}U</span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-rose-500">
                      -{t.negative_marks.toFixed(2)}
                    </td>

                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (confirm(`Delete test "${t.title}"?`)) {
                            deleteMockTest(t.id);
                          }
                        }}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Test"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

