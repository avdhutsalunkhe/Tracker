import React, { useState } from 'react';
import { TestScoreChart } from '../components/tests/TestScoreChart';
import { TestTable } from '../components/tests/TestTable';
import { TestLoggerModal } from '../components/tests/TestLoggerModal';
import { MistakeList } from '../components/tests/MistakeList';
import { MistakeBreakdownChart } from '../components/tests/MistakeBreakdownChart';
import { PYQMatrix } from '../components/tests/PYQMatrix';
import { MdQuestionBank } from '../components/tests/MdQuestionBank';
import { Award } from 'lucide-react';

export const TestsPage: React.FC = () => {
  const [isAddTestOpen, setIsAddTestOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Mock Tests & Mistake Notebook
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Record full-length tests, subject tests, PYQ scores, and eliminate recurring errors.
        </p>
      </div>

      {/* 1. Performance Trends Chart & Mistake Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <TestScoreChart />
        <MistakeBreakdownChart />
      </div>

      {/* 2. Mock Test Table */}
      <TestTable onOpenAddTest={() => setIsAddTestOpen(true)} />

      {/* 3. DPP, Practice Questions & Test Questions (.md Bank) */}
      <MdQuestionBank />

      {/* 4. PYQ Matrix */}
      <PYQMatrix />

      {/* 4. Mistake Notebook */}
      <MistakeList />

      {/* Log Test Modal */}
      <TestLoggerModal isOpen={isAddTestOpen} onClose={() => setIsAddTestOpen(false)} />
    </div>
  );
};

