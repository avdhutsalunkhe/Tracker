import React, { useState, useRef } from 'react';
import { useData } from '../../src/context/DataContext';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  isPushSupported,
  isIOSDevice,
  subscribeToWebPush,
  showLocalSwNotification,
} from '../lib/pushNotifications';
import { StorageData } from '../lib/storage';
import {
  Settings,
  Calendar,
  Download,
  Upload,
  Trash2,
  Database,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Bell,
  Smartphone,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    habits,
    reorderHabits,
    deleteHabit,
    exportData,
    importBackupData,
    resetAllData,
  } = useData();
  const { user, isConfigured, signOut } = useAuth();
  const { showToast } = useToast();

  const [resetting, setResetting] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<{ id: string; title: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<StorageData | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [examDate, setExamDate] = useState(settings?.gate_exam_date || '2027-02-06');
  const [dailyGoalHours, setDailyGoalHours] = useState(settings?.daily_study_goal_hours || 6.0);
  const [pomodoroFocus, setPomodoroFocus] = useState(settings?.pomodoro_focus_mins || 50);
  const [pomodoroBreak, setPomodoroBreak] = useState(settings?.pomodoro_break_mins || 10);
  const [targetScore, setTargetScore] = useState(settings?.target_gate_score ?? 65);
  const [secondaryTitle, setSecondaryTitle] = useState(settings?.secondary_exam_title || '');
  const [secondaryDate, setSecondaryDate] = useState(settings?.secondary_exam_date || '');
  const [preAlertMins, setPreAlertMins] = useState(settings?.pre_alert_mins ?? 5);
  const [eveningReminder, setEveningReminder] = useState(settings?.evening_reminder_time || '20:30');
  const [saving, setSaving] = useState(false);

  const [notifPerm, setNotifPerm] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [subscribingPush, setSubscribingPush] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings({
        gate_exam_date: examDate,
        daily_study_goal_hours: Number(dailyGoalHours) || 6.0,
        pomodoro_focus_mins: Number(pomodoroFocus) || 50,
        pomodoro_break_mins: Number(pomodoroBreak) || 10,
        target_gate_score: Number(targetScore) || 65,
        secondary_exam_title: secondaryTitle.trim() || null,
        secondary_exam_date: secondaryDate || null,
        pre_alert_mins: Number(preAlertMins) || 5,
        evening_reminder_time: eveningReminder || '20:30',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEnableNotifications = async () => {
    setSubscribingPush(true);
    try {
      const res = await subscribeToWebPush(user?.id || '', preAlertMins, eveningReminder);
      if (typeof Notification !== 'undefined') {
        setNotifPerm(Notification.permission);
      }
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Notifications Enabled',
          message: res.reason || 'Mobile & desktop alerts are active.',
        });
      } else {
        showToast({
          type: 'error',
          title: 'Notification Setup Failed',
          message: res.reason || 'Could not enable notifications.',
        });
      }
    } finally {
      setSubscribingPush(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as StorageData;
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.settings ||
        !Array.isArray(parsed.habits) ||
        !Array.isArray(parsed.topics)
      ) {
        showToast({
          type: 'error',
          title: 'Invalid Backup File',
          message: 'JSON does not match the Tracker backup schema.',
        });
        return;
      }
      setPendingImport(parsed);
    } catch {
      showToast({
        type: 'error',
        title: 'Import Failed',
        message: 'Could not parse the selected JSON file.',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          Configure exam countdown milestones, study goals, push notifications, routine habits, and backups.
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium tabular-nums focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Target GATE Score (/100)
            </label>
            <input
              type="number"
              step="1"
              min="25"
              max="100"
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium tabular-nums focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Pomodoro Focus (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="180"
              value={pomodoroFocus}
              onChange={(e) => setPomodoroFocus(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium tabular-nums focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Default Pomodoro Break (Minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={pomodoroBreak}
              onChange={(e) => setPomodoroBreak(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium tabular-nums focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Secondary Milestone (Optional — e.g. Semester Exams)
            </label>
            <input
              type="text"
              value={secondaryTitle}
              onChange={(e) => setSecondaryTitle(e.target.value)}
              placeholder="e.g. Sem 6 Finals / Campus Placements"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Secondary Milestone Date
            </label>
            <input
              type="date"
              value={secondaryDate}
              onChange={(e) => setSecondaryDate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none cursor-pointer"
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

      {/* 2. Enable Mobile Notifications Card */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              Mobile & Desktop Push Notifications
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Receive native alerts before timetable study blocks and daily evening revision checks.
            </p>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
              notifPerm === 'granted'
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : notifPerm === 'denied'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            {notifPerm === 'granted'
              ? 'Enabled'
              : notifPerm === 'denied'
              ? 'Blocked'
              : 'Not Enabled'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pre-Alert Before Study Slot (Minutes)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={preAlertMins}
              onChange={(e) => setPreAlertMins(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs tabular-nums outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Daily Evening Habit Reminder
            </label>
            <input
              type="time"
              value={eveningReminder}
              onChange={(e) => setEveningReminder(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
            />
          </div>
        </div>

        {isIOSDevice() && (
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-800 dark:text-indigo-200 flex items-start gap-2">
            <Smartphone className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              On iPhone/iPad (iOS 16.4+), tap Share and choose <strong>Add to Home Screen</strong>, then open Tracker from your Home Screen to enable Web Push alerts.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            disabled={subscribingPush || !isPushSupported()}
            onClick={handleEnableNotifications}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50"
          >
            {subscribingPush ? 'Activating...' : 'Enable Mobile Notifications'}
          </button>

          <button
            type="button"
            onClick={() =>
              showLocalSwNotification(
                'Tracker Test Notification',
                'Push alerts & native sound are working properly.',
                '/timer'
              )
            }
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Send Test Notification
          </button>
        </div>
      </div>

      {/* 3. Manage & Reorder Habits */}
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
                <span className="font-mono text-[10px] text-slate-400 w-4 tabular-nums">{idx + 1}.</span>
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
                  onClick={() => setHabitToDelete({ id: h.id, title: h.title })}
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

      {/* 4. Data Ownership & Two-Way Backup */}
      <div className="rounded-2xl bg-white dark:bg-darkCard border border-lightBorder dark:border-darkBorder p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-500" />
            Data Ownership & Two-Way Backup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export or restore your entire preparation history, habit logs, timetable, and mistake notes anytime.
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => exportData('json')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold hover:bg-indigo-100 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON Backup</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4" />
            <span>Import / Restore JSON</span>
          </button>

          <button
            type="button"
            onClick={() => exportData('csv')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Topics CSV</span>
          </button>

          <button
            type="button"
            disabled={resetting}
            onClick={() => setConfirmResetOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{resetting ? 'Resetting...' : 'Reset All Data'}</span>
          </button>
        </div>
      </div>

      {/* 5. Supabase Auth & Cloud Status */}
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

      <ConfirmModal
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        loading={resetting}
        onConfirm={async () => {
          setResetting(true);
          try {
            await resetAllData();
          } finally {
            setResetting(false);
          }
        }}
        title="Reset All Tracker Data"
        message="Are you sure you want to delete ALL your habits, tasks, GATE subjects, topics, revisions, mock tests, mistakes, and flashcards? This cannot be undone."
        confirmLabel="Reset All Data"
      />

      <ConfirmModal
        isOpen={Boolean(habitToDelete)}
        onClose={() => setHabitToDelete(null)}
        onConfirm={() => {
          if (habitToDelete) return deleteHabit(habitToDelete.id);
        }}
        title="Delete Habit"
        message={`Delete habit "${habitToDelete?.title}"?`}
        confirmLabel="Delete Habit"
      />

      <ConfirmModal
        isOpen={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        danger={false}
        onConfirm={async () => {
          if (pendingImport) await importBackupData(pendingImport);
        }}
        title="Restore JSON Backup"
        message={`Restore ${pendingImport?.topics?.length || 0} topics, ${pendingImport?.habits?.length || 0} habits, and ${pendingImport?.mockTests?.length || 0} mock tests? This will overwrite your current local snapshot.`}
        confirmLabel="Restore Backup"
      />
    </div>
  );
};
