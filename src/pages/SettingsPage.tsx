import React, { useState } from 'react';
import { useData } from '../../src/context/DataContext';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import {
  Settings,
  Calendar,
  Clock,
  Download,
  Trash2,
  Database,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, habits, reorderHabits, deleteHabit, exportData } = useData();
  const { user, isConfigured, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [examDate, setExamDate] = useState(settings?.gate_exam_date || '2027-02-06');
  const [dailyGoalHours, setDailyGoalHours] = useState(settings?.daily_study_goal_hours || 6.0);
  const [pomodoroFocus, setPomodoroFocus] = useState(settings?.pomodoro_focus_mins || 50);
  const [pomodoroBreak, setPomodoroBreak] = useState(settings?.pomodoro_break_mins || 10);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        gate_exam_date: examDate,
        daily_study_goal_hours: Number(dailyGoalHours) || 6.0,
        pomodoro_focus_mins: Number(pomodoroFocus) || 50,
        pomodoro_break_mins: Number(pomodoroBreak) || 10,
      });
    } finally {
      setSaving(false);
    }
  };

  const moveHabit = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= habits.length) return;

    const updated = [...habits];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    reorderHabits(updated);
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Tracker Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure exam countdown milestones, study goals, routine habits, and data backups.
        </p>
      </div>

      {/* 1. Exam Target & Study Goals Form */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 sm:p-6 shadow-sm space-y-5"
      >
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-500" />
          GATE Target & Focus Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              GATE Exam Target Date
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default GATE 2027 date: 2027-02-06</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Daily Study Hours Goal
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="18"
              value={dailyGoalHours}
              onChange={(e) => setDailyGoalHours(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">Used for progress bars and analytics lines.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Pomodoro Focus Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={pomodoroFocus}
              onChange={(e) => setPomodoroFocus(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Pomodoro Break Duration (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={pomodoroBreak}
              onChange={(e) => setPomodoroBreak(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Parameters'}
          </button>
        </div>
      </form>

      {/* 2. Manage & Reorder Habits */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Manage & Reorder Daily Routine Habits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Use the arrows to organize the display order of your daily checklist.
          </p>
        </div>

        <div className="space-y-2">
          {habits.map((h, idx) => (
            <div
              key={h.id}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <span className="font-mono text-[10px] text-slate-400 w-4">{idx + 1}.</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{h.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {h.time_slot}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => moveHabit(idx, 'up')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === habits.length - 1}
                  onClick={() => moveHabit(idx, 'down')}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete habit "${h.title}"?`)) {
                      deleteHabit(h.id);
                    }
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors ml-1"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Data Ownership & Full Export */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-500" />
            Data Ownership & Backup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export your entire preparation history, habit logs, and mistake notes anytime.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => exportData('json')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Download Complete JSON Backup</span>
          </button>

          <button
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Topics Spreadsheet (CSV)</span>
          </button>
        </div>
      </div>

      {/* 4. Supabase Auth & Cloud Status */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 sm:p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-500" />
          Cloud Sync & Supabase Backend
        </h2>

        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Connection Status:</span>
            <span className="font-bold flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isConfigured ? 'Supabase Connected' : 'Not Configured'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Logged in as:</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono">
              {user?.email || 'Not signed in'}
            </span>
          </div>
        </div>

        {user && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Sign Out of Tracker
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

