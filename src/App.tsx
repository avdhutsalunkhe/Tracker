import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { TimerProvider, useTimer } from './context/TimerContext';

// Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { MoreDrawer } from './components/common/MoreDrawer';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { LoginPage } from './components/auth/LoginPage';
import { Lock } from 'lucide-react';

// Pages
import { TodayPage } from './pages/TodayPage';
import { CalendarPage } from './pages/CalendarPage';
import { GatePage } from './pages/GatePage';
import { RevisionsPage } from './pages/RevisionsPage';
import { TimerPage } from './pages/TimerPage';
import { TestsPage } from './pages/TestsPage';
import { VaultPage } from './pages/VaultPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SyllabusPage } from './pages/SyllabusPage';
import { TopicDetailPage } from './pages/TopicDetailPage';
import { SubjectDetailPage } from './pages/SubjectDetailPage';
import { TimetablePage } from './pages/TimetablePage';
import { NotesPage } from './pages/NotesPage';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRunning, startTimer, pauseTimer, isScreenLocked, formattedTime, mode, phase, unlockScreen } = useTimer();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Global keyboard-first shortcuts (S: start/pause timer, T: Today, M: Tests & Mistakes)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!user) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
      } else if (key === 't') {
        e.preventDefault();
        navigate('/');
      } else if (key === 'm') {
        e.preventDefault();
        navigate('/tests');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [user, isRunning, startTimer, pauseTimer, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-lightBg dark:bg-darkBg text-slate-900 dark:text-slate-100 gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Tracker...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-lightBg dark:bg-darkBg text-slate-900 dark:text-slate-100 transition-colors">
      {/* Persistent App Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace: Desktop Sidebar + Content Body */}
      <div className="flex-1 flex min-w-0">
        {/* Collapsible Left Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* Scrollable Main Content */}
        <main className="flex-1 min-w-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/gate" element={<GatePage />} />
            <Route path="/gate/subject/:subjectId" element={<SubjectDetailPage />} />
            <Route path="/gate/topic/:topicId" element={<TopicDetailPage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
            <Route path="/revisions" element={<RevisionsPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile 5-Tab Bottom Navigation Bar */}
      <BottomNav onOpenMore={() => setIsMoreOpen(true)} isMoreOpen={isMoreOpen} />

      {/* Mobile More Drawer */}
      <MoreDrawer
        isOpen={isMoreOpen}
        onClose={() => setIsMoreOpen(false)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Supabase Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Strict Focus Lock Overlay (Requires PIN to unlock) */}
      {isScreenLocked && (
        <div className="fixed inset-0 z-[100] bg-[#0B1120] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-sm w-full space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>Focus Lock Active</span>
            </div>

            <div>
              <div className="text-6xl font-black font-mono tracking-tight tabular-nums">
                {formattedTime}
              </div>
              <div className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-semibold">
                {mode === 'Pomodoro' ? (phase === 'focus' ? 'Deep Focus' : 'Break') : 'Deep Stopwatch'}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (unlockScreen(pinInput)) {
                  setPinInput('');
                  setPinError(false);
                } else {
                  setPinError(true);
                }
              }}
              className="space-y-3 pt-4 border-t border-slate-800"
            >
              <p className="text-xs text-slate-400">
                Enter your Focus Lock PIN to unlock screen controls
              </p>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Enter PIN..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {pinError && (
                <p className="text-xs text-rose-400 font-semibold">Incorrect PIN. Stay focused!</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Unlock Focus Screen
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <DataProvider>
              <TimerProvider>
                <AppContent />
              </TimerProvider>
            </DataProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
