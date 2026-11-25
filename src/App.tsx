import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { TimerProvider } from './context/TimerContext';

// Components
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { BottomNav } from './components/common/BottomNav';
import { MoreDrawer } from './components/common/MoreDrawer';
import { CommandPalette } from './components/common/CommandPalette';
import { ToastContainer } from './components/common/ToastContainer';
import { AuthModal } from './components/auth/AuthModal';
import { DemoModeBanner } from './components/auth/DemoModeBanner';

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

const AppContent: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-lightBg dark:bg-darkBg text-slate-900 dark:text-slate-100 transition-colors">
      {/* Demo / Guest banner */}
      <DemoModeBanner onOpenAuth={() => setIsAuthOpen(true)} />

      {/* Persistent App Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Workspace: Desktop Sidebar + Content Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Left Sidebar */}
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/gate" element={<GatePage />} />
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
