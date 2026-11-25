import React from 'react';
import { NavLink } from 'react-router-dom';
import { CheckSquare, CalendarDays, BookOpen, Timer, MoreHorizontal } from 'lucide-react';
import { useTimer } from '../../context/TimerContext';

interface BottomNavProps {
  onOpenMore: () => void;
  isMoreOpen: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMore, isMoreOpen }) => {
  const { isRunning } = useTimer();

  const mainTabs = [
    { to: '/', label: 'Today', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/gate', label: 'GATE', icon: BookOpen },
    { to: '/timer', label: 'Timer', icon: Timer, hasBadge: isRunning },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-darkCard/95 backdrop-blur-lg border-t border-lightBorder dark:border-darkBorder pb-safe">
      <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-darkCard animate-pulse" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
            </NavLink>
          );
        })}

        {/* More Tab */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
            isMoreOpen
              ? 'text-indigo-600 dark:text-indigo-400 font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[11px] mt-1 tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
};
