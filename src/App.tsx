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
import { TimetablePage } from './pages/TimetablePage';

const AppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isRunning, startTimer, pauseTimer } = useTimer();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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
            <Route path="/gate/topic/:topicId" element={<TopicDetailPage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
            <Route path="/revisions" element={<RevisionsPage />} />
            <Route path="/timer" element={<TimerPage />} />
            <Route path="/tests" element={<TestsPage />} />
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
