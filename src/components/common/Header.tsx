import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useTimer } from '../../context/TimerContext';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Search,
  Play,
  Pause,
  Clock,
  User as UserIcon,
  LogIn,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, onOpenAuth }) => {
  const { theme, toggleTheme } = useTheme();
  const { isRunning, formattedTime, mode, phase, startTimer, pauseTimer } = useTimer();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-darkCard/80 backdrop-blur-md border-b border-lightBorder dark:border-darkBorder">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Mobile Brand Logo / Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-primaryIndigo-600 to-emerald-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span className="text-xs sm:text-sm font-black text-white tracking-wider">TR</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5 leading-none">
                Tracker
                <span className="hidden xs:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                  GATE
                </span>
              </span>
              <span className="hidden sm:block text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                Habits & Prep PWA
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Persistent Floating Mini-Timer Pill (shown if timer is running or active) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 shadow-sm transition-all">
            <Link to="/timer" className="flex items-center gap-1.5 text-xs font-semibold hover:underline">
              <Clock className={`w-3.5 h-3.5 ${isRunning ? 'animate-pulse text-indigo-600 dark:text-indigo-400' : ''}`} />
              <span className="tabular-nums font-mono font-bold">{formattedTime}</span>
              <span className="hidden sm:inline text-[11px] opacity-75">
                ({mode === 'Pomodoro' ? (phase === 'focus' ? 'Focus' : 'Break') : 'Stopwatch'})
              </span>
            </Link>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              className="p-1 rounded-full hover:bg-indigo-200/60 dark:hover:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 transition-colors ml-0.5"
              aria-label={isRunning ? 'Pause Timer' : 'Start Timer'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
          </div>
        </div>

        {/* Right Actions: Ctrl+K Search, Theme Toggle, Auth Status */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/70 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs font-medium transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-mono shadow-sm">
              Ctrl K
            </kbd>
          </button>

          <button
            onClick={onOpenSearch}
            className="sm:hidden p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Day / Night Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Night'} Mode`}
            title={`Switch to ${theme === 'dark' ? 'Day (Light)' : 'Night (Dark)'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* User Profile / Supabase Auth Button */}
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline truncate max-w-[120px]">
              {user?.email?.split('@')[0] || 'Account'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

