import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { useTimer } from '../../context/TimerContext';
import {
  Search,
  BookOpen,
  Calendar,
  CheckSquare,
  Timer,
  RotateCcw,
  Award,
  Bookmark,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Play,
  ArrowRight,
  X
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  color?: string;
  icon: React.ElementType;
  category: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddTopic?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { topics, subjects, flashcards } = useData();
  const { theme, toggleTheme } = useTheme();
  const { startTimer } = useTimer();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Subject lookup
  const subjectMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    subjects.forEach((s) => map.set(s.id, { name: s.name, color: s.color }));
    return map;
  }, [subjects]);

  // Quick navigation pages
  const staticCommands = useMemo<CommandItem[]>(
    () => [
      { id: 'p-today', title: 'Go to Today Dashboard', icon: CheckSquare, category: 'Navigation', action: () => navigate('/') },
      { id: 'p-cal', title: 'Go to Calendar & Heatmap', icon: Calendar, category: 'Navigation', action: () => navigate('/calendar') },
      { id: 'p-gate', title: 'Go to GATE Study', icon: BookOpen, category: 'Navigation', action: () => navigate('/gate') },
      { id: 'p-rev', title: 'Go to Revisions Queue', icon: RotateCcw, category: 'Navigation', action: () => navigate('/revisions') },
      { id: 'p-timer', title: 'Go to Study Timer', icon: Timer, category: 'Navigation', action: () => navigate('/timer') },
      { id: 'p-tests', title: 'Go to Tests & Mistakes', icon: Award, category: 'Navigation', action: () => navigate('/tests') },
      { id: 'p-vault', title: 'Go to Formula Vault & Flashcards', icon: Bookmark, category: 'Navigation', action: () => navigate('/vault') },
      { id: 'p-ana', title: 'Go to Analytics & Weakness Radar', icon: BarChart3, category: 'Navigation', action: () => navigate('/analytics') },
      { id: 'p-set', title: 'Go to Settings', icon: Settings, category: 'Navigation', action: () => navigate('/settings') },
      {
        id: 'act-timer',
        title: 'Start Focus Timer Now',
        icon: Play,
        category: 'Quick Actions',
        action: () => {
          startTimer();
          navigate('/timer');
        },
      },
      {
        id: 'act-theme',
        title: `Switch to ${theme === 'dark' ? 'Light' : 'Night'} Mode`,
        icon: theme === 'dark' ? Sun : Moon,
        category: 'Quick Actions',
        action: () => toggleTheme(),
      },
    ],
    [navigate, startTimer, theme, toggleTheme]
  );

  // Filtered topics matching search
  const filteredTopics = useMemo<CommandItem[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return topics
      .filter((t) => t.topic_name.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)))
      .slice(0, 5)
      .map((t) => ({
        id: `t-${t.id}`,
        title: t.topic_name,
        subtitle: subjectMap.get(t.subject_id)?.name || 'Subject',
        badge: t.status,
        color: subjectMap.get(t.subject_id)?.color,
        icon: BookOpen,
        category: 'Topics',
        action: () => {
          navigate('/gate');
        },
      }));
  }, [query, topics, subjectMap, navigate]);

  // Filtered formulas/flashcards
  const filteredCards = useMemo<CommandItem[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return flashcards
      .filter((c) => c.front_prompt.toLowerCase().includes(q) || c.back_answer.toLowerCase().includes(q))
      .slice(0, 3)
      .map((c) => ({
        id: `c-${c.id}`,
        title: c.front_prompt,
        subtitle: c.back_answer.substring(0, 50) + '...',
        badge: 'Formula Vault',
        icon: Bookmark,
        category: 'Formulas',
        action: () => navigate('/vault'),
      }));
  }, [query, flashcards, navigate]);

  // Combined command list
  const allResults = useMemo<CommandItem[]>(() => {
    const q = query.toLowerCase();
    const matchedCommands = staticCommands.filter((c) => c.title.toLowerCase().includes(q));
    return [...matchedCommands, ...filteredTopics, ...filteredCards];
  }, [query, staticCommands, filteredTopics, filteredCards]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < allResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : allResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        allResults[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Palette Card */}
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, topic, formula, or page..."
            className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {allResults.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
              No matching commands, topics, or formulas found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {allResults.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold truncate">{item.title}</div>
                        {item.subtitle && (
                          <div className={`text-[11px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badge && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Tracker Quick Actions</span>
        </div>
      </div>
    </div>
  );
};
