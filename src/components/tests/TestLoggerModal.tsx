import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useData } from '../../context/DataContext';
import { TestType } from '../../types';
import { format } from 'date-fns';
import { Award, Plus } from 'lucide-react';

interface TestLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestLoggerModal: React.FC<TestLoggerModalProps> = ({ isOpen, onClose }) => {
  const { subjects, addMockTest, selectedDate } = useData();

  const [title, setTitle] = useState('');
  const [testType, setTestType] = useState<TestType>('Full Length');
  const [subjectId, setSubjectId] = useState<string>('');
  const [testDate, setTestDate] = useState(selectedDate || format(new Date(), 'yyyy-MM-dd'));
  const [marksScored, setMarksScored] = useState<number>(65);
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [correctCount, setCorrectCount] = useState<number>(45);
  const [wrongCount, setWrongCount] = useState<number>(10);
  const [unattemptedCount, setUnattemptedCount] = useState<number>(10);
  const [negativeMarks, setNegativeMarks] = useState<number>(3.33);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const testTypes: TestType[] = ['Full Length', 'Subject Test', 'PYQ Paper', 'Topic Test'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await addMockTest({
        title: title.trim(),
        test_type: testType,
        subject_id: subjectId || null,
        test_date: testDate,
        marks_scored: Number(marksScored) || 0,
        total_marks: Number(totalMarks) || 100,
        correct_count: Number(correctCount) || 0,
        wrong_count: Number(wrongCount) || 0,
        unattempted_count: Number(unattemptedCount) || 0,
        negative_marks: Number(negativeMarks) || 0,
        notes: notes.trim() || null,
      });
      setTitle('');
      setNotes('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Mock Test or PYQ Paper"
      subtitle="Track your scores, accuracy, and negative marks lost."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Test Title / Series Name
          </label>
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. MadeEasy FLT #4, GATE 2023 CS Paper, Ace OS Subject Test"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Test Type
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value as TestType)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            >
              {testTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject (If applicable)
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            >
              <option value="">Full Syllabus / Multi-subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Marks Scored
            </label>
            <input
              type="number"
              step="0.01"
              value={marksScored}
              onChange={(e) => setMarksScored(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Total Marks
            </label>
            <input
              type="number"
              step="1"
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5">
              Negative Marks
            </label>
            <input
              type="number"
              step="0.01"
              value={negativeMarks}
              onChange={(e) => setNegativeMarks(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-xs outline-none font-bold text-rose-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Correct Qs
            </label>
            <input
              type="number"
              value={correctCount}
              onChange={(e) => setCorrectCount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Wrong Qs
            </label>
            <input
              type="number"
              value={wrongCount}
              onChange={(e) => setWrongCount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Unattempted
            </label>
            <input
              type="number"
              value={unattemptedCount}
              onChange={(e) => setUnattemptedCount(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Test Date
          </label>
          <input
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Key Reflections & Time Management Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Too much time spent on MSQ questions; silly formula mistake in Queuing Theory..."
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
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
            disabled={submitting || !title.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Save Test</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

