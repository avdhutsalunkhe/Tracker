import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { GateCountdown } from './GateCountdown';
import {
  CalendarDays,
  CheckSquare,
  BookOpen,
  RotateCcw,
  Timer,
  Award,
  Bookmark,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeStreak } = useData();

  const navItems = [
    { to: '/', label: 'Today', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar & Heatmap', icon: CalendarDays },
    { to: '/gate', label: 'GATE Study', icon: BookOpen },
    { to: '/revisions', label: 'Revisions Queue', icon: RotateCcw },
    { to: '/timer', label: 'Study Timer', icon: Timer },
    { to: '/tests', label: 'Tests & Mistakes', icon: Award },
    { to: '/vault', label: 'Formula Vault', icon: Bookmark },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col justify-between border-r border-lightBorder dark:border-darkBorder bg-white dark:bg-darkCard transition-all duration-300 ease-in-out shrink-0 select-none z-20 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col p-3">
        {/* Navigation list */}
        <nav className="space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  } ${collapsed ? 'justify-center px-0' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Countdown & Collapse Toggle */}
      <div className="p-3 space-y-3">
        {!collapsed && (
          <div className="animate-in fade-in duration-200">
            <GateCountdown compact />
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold pl-1">
              <Flame className="w-4 h-4 fill-current" />
              <span>{activeStreak}d Habit Streak</span>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              collapsed ? 'w-full flex justify-center' : ''
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
