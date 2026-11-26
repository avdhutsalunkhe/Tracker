import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  RotateCcw,
  Award,
  Bookmark,
  BarChart3,
  Settings,
  X,
  Download,
  LogIn,
  LogOut,
  Flame,
  ShieldCheck,
  Calendar,
  FileText,
  CalendarClock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const MoreDrawer: React.FC<MoreDrawerProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { user, signOut } = useAuth();
  const { activeStreak, exportData } = useData();

  if (!isOpen) return null;

  const moreLinks = [
    { to: '/timetable', label: 'Daily Timetable', icon: CalendarClock, desc: 'Fixed routine & auto study allocator' },
    { to: '/syllabus', label: 'GATE 2027 Syllabus', icon: FileText, desc: 'Official CS & DA paper syllabus' },
    { to: '/revisions', label: 'Revisions Queue', icon: RotateCcw, desc: 'Spaced repetition schedule & overdue topics' },
    { to: '/tests', label: 'Tests & Mistakes', icon: Award, desc: 'Mock test scores, accuracy & mistake notebook' },
    { to: '/notes', label: 'Notes (.md)', icon: FileText, desc: 'DS & CS notes organized by Subject & Topic' },
    { to: '/vault', label: 'Formula Vault', icon: Bookmark, desc: 'Key formulas, definitions & rapid flashcards' },
    { to: '/analytics', label: 'Analytics & Heatmap', icon: BarChart3, desc: '365-day consistency, hours chart & radar' },
    { to: '/settings', label: 'Settings', icon: Settings, desc: 'Exam date, daily goals & habit management' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white dark:bg-darkCard rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 overflow-y-auto animate-in slide-in-from-bottom duration-200 shadow-2xl">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">More Tools & Views</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Everything for complete GATE preparation</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <div className="space-y-2 mb-5">
          {moreLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-start gap-3.5 p-3 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-200'
                  }`
                }
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold">{item.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</div>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Actions & Auth */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
            <span className="flex items-center gap-1 text-amber-500 font-semibold">
              <Flame className="w-3.5 h-3.5 fill-current" /> {activeStreak}d Habit Streak
            </span>
            <button
              onClick={() => exportData('json')}
              className="flex items-center gap-1 hover:text-indigo-500 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Backup JSON
            </button>
          </div>

          {!user ? (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogIn className="w-4 h-4" /> Sign In / Create Account
            </button>
          ) : (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out ({user?.email?.split('@')[0]})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

