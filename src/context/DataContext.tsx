import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  UserSettings,
  DailyHabit,
  HabitLog,
  DailyTask,
  GateSubject,
  GateTopic,
  GateRevision,
  StudySession,
  MockTest,
  MistakeLog,
  Flashcard,
  PriorityLevel,
  HabitTimeSlot,
  TopicStatus,
  TimerMode,
  TestType,
  MistakeCategory,
  DayDetailData
} from '../types';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadStoredData, saveStoredData, getEmptyUserData, StorageData } from '../lib/storage';
import { SPACED_REPETITION_INTERVALS, GATE_BRANCH_PRESETS } from '../lib/constants';
import { sound } from '../lib/sound';
import { format, addDays, parseISO, differenceInCalendarDays, subDays } from 'date-fns';

interface DataContextType {
  loading: boolean;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  goToToday: () => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;

  // State
  settings: UserSettings;
  habits: DailyHabit[];
  habitLogs: HabitLog[];
  tasks: DailyTask[];
  subjects: GateSubject[];
  topics: GateTopic[];
  revisions: GateRevision[];
  sessions: StudySession[];
  mockTests: MockTest[];
  mistakes: MistakeLog[];
  flashcards: Flashcard[];

  // Computed Properties for selected date
  selectedDateHabits: Array<{ habit: DailyHabit; completed: boolean; logId?: string }>;
  selectedDateTasks: DailyTask[];
  selectedDateStudyHours: number;
  selectedDateProgress: { completed: number; total: number; percent: number };
  activeStreak: number;

  // Actions - Habits & Daily
  toggleHabit: (habitId: string, date?: string) => Promise<void>;
  addHabit: (title: string, time_slot: HabitTimeSlot) => Promise<void>;
  updateHabit: (id: string, updates: Partial<DailyHabit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  reorderHabits: (reordered: DailyHabit[]) => Promise<void>;

  // Actions - Tasks
  addTask: (title: string, priority: PriorityLevel, date?: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Actions - Subjects & Topics
  addSubject: (name: string, color: string) => Promise<string | null>;
  updateSubject: (id: string, name: string, color: string) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  seedPresetSubjects: (branchName?: string) => Promise<void>;

  addTopic: (data: Omit<GateTopic, 'id' | 'user_id' | 'revision_count' | 'next_revision_date'> & { next_revision_date?: string | null }) => Promise<void>;
  updateTopic: (id: string, updates: Partial<GateTopic>) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;

  // Actions - Spaced Repetition Revisions
  markTopicRevised: (topicId: string, remarks?: string, customNextDate?: string) => Promise<void>;

  // Actions - Study Sessions
  logStudySession: (subjectId: string | null, topicId: string | null, durationMinutes: number, mode: TimerMode) => Promise<void>;

  // Actions - Mock Tests & Mistakes
  addMockTest: (data: Omit<MockTest, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  deleteMockTest: (id: string) => Promise<void>;
  addMistake: (data: Omit<MistakeLog, 'id' | 'user_id' | 'is_resolved' | 'created_at'>) => Promise<void>;
  toggleMistakeResolved: (id: string) => Promise<void>;
  deleteMistake: (id: string) => Promise<void>;

  // Actions - Flashcards
  addFlashcard: (subjectId: string | null, frontPrompt: string, backAnswer: string) => Promise<void>;
  toggleFlashcardReview: (id: string) => Promise<void>;
  deleteFlashcard: (id: string) => Promise<void>;

  // Actions - Settings & Data Export
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  exportData: (formatType: 'json' | 'csv') => void;

  // Day drawer helper
  getDayDetailData: (date: string) => DayDetailData;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

  // Data State (starts empty until authenticated user loads)
  const [data, setData] = useState<StorageData>(() => getEmptyUserData(user?.id || ''));

  // Sync / Load on user change
  useEffect(() => {
    const currentUserId = user?.id;

    if (!currentUserId) {
      setData(getEmptyUserData(''));
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured || !supabase) {
      const offlineData = loadStoredData(currentUserId);
      setData(offlineData);
      setLoading(false);
      return;
    }

    // Load from Supabase for authenticated user
    const fetchCloudData = async () => {
      const client = supabase;
      if (!client) return;

      setLoading(true);
      try {
        const [
          settingsRes,
          habitsRes,
          habitLogsRes,
          tasksRes,
          subjectsRes,
          topicsRes,
          revisionsRes,
          sessionsRes,
          mockTestsRes,
          mistakesRes,
          flashcardsRes,
        ] = await Promise.all([
          client.from('user_settings').select('*').eq('user_id', currentUserId).maybeSingle(),
          client.from('daily_habits').select('*').eq('user_id', currentUserId).order('sort_order', { ascending: true }),
          client.from('habit_logs').select('*').eq('user_id', currentUserId),
          client.from('daily_tasks').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false }),
          client.from('gate_subjects').select('*').eq('user_id', currentUserId).order('created_at', { ascending: true }),
          client.from('gate_topics').select('*').eq('user_id', currentUserId).order('updated_at', { ascending: false }),
          client.from('gate_revisions').select('*').eq('user_id', currentUserId).order('revised_on', { ascending: false }),
          client.from('study_sessions').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false }),
          client.from('mock_tests').select('*').eq('user_id', currentUserId).order('test_date', { ascending: false }),
          client.from('mistake_logs').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false }),
          client.from('flashcards').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false }),
        ]);

        let userSettings = settingsRes.data;
        if (!userSettings) {
          // Initialize user settings if not present
          const defaultSettings: UserSettings = {
            user_id: currentUserId,
            gate_exam_date: '2027-02-06',
            daily_study_goal_hours: 6.0,
            pomodoro_focus_mins: 50,
            pomodoro_break_mins: 10,
          };
          await client.from('user_settings').upsert(defaultSettings);
          userSettings = defaultSettings;
        }

        const cloudData: StorageData = {
          settings: userSettings,
          habits: habitsRes.data || [],
          habitLogs: habitLogsRes.data || [],
          tasks: tasksRes.data || [],
          subjects: subjectsRes.data || [],
          topics: topicsRes.data || [],
          revisions: revisionsRes.data || [],
          sessions: sessionsRes.data || [],
          mockTests: mockTestsRes.data || [],
          mistakes: mistakesRes.data || [],
          flashcards: flashcardsRes.data || [],
        };

        setData(cloudData);
        saveStoredData(currentUserId, cloudData);
      } catch (err) {
        console.warn('Failed to load data from Supabase, fallback to local storage:', err);
        const fallback = loadStoredData(currentUserId);
        setData(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchCloudData();
  }, [user?.id]);

  // Persist local store whenever state changes (offline capability)
  useEffect(() => {
    if (user?.id) {
      saveStoredData(user.id, data);
    }
  }, [data, user?.id]);

  // Date Navigation
  const goToToday = useCallback(() => setSelectedDate(format(new Date(), 'yyyy-MM-dd')), []);
  const goToPrevDay = useCallback(() => {
    setSelectedDate((prev) => format(subDays(parseISO(prev), 1), 'yyyy-MM-dd'));
  }, []);
  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => format(addDays(parseISO(prev), 1), 'yyyy-MM-dd'));
  }, []);

  // Computed Properties for selected date
  const selectedDateHabits = useMemo(() => {
    const logsMap = new Map<string, HabitLog>();
    data.habitLogs
      .filter((l) => l.log_date === selectedDate)
      .forEach((l) => logsMap.set(l.habit_id, l));

    return data.habits
      .filter((h) => h.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((h) => {
        const log = logsMap.get(h.id);
        return {
          habit: h,
          completed: Boolean(log?.completed),
          logId: log?.id,
        };
      });
  }, [data.habits, data.habitLogs, selectedDate]);

  const selectedDateTasks = useMemo(() => {
    return data.tasks.filter((t) => t.task_date === selectedDate);
  }, [data.tasks, selectedDate]);

  const selectedDateStudyHours = useMemo(() => {
    const totalMinutes = data.sessions
      .filter((s) => s.session_date === selectedDate)
      .reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [data.sessions, selectedDate]);

  const selectedDateProgress = useMemo(() => {
    const total = selectedDateHabits.length;
    const completed = selectedDateHabits.filter((h) => h.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }, [selectedDateHabits]);

  // Active Habit Streak Count calculation
  const activeStreak = useMemo(() => {
    const activeHabits = data.habits.filter((h) => h.is_active);
    if (activeHabits.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    // Check if today is completed or at least partially completed
    const todayLogs = data.habitLogs.filter((l) => l.log_date === todayStr && l.completed);
    let checkDate = today;

    // If today has completed habits, count it
    if (todayLogs.length > 0) {
      streak++;
      checkDate = subDays(today, 1);
    } else {
      // If today not done yet, test yesterday
      checkDate = subDays(today, 1);
    }

    // Traverse back consecutive days
    for (let i = 0; i < 365; i++) {
      const dateStr = format(checkDate, 'yyyy-MM-dd');
      const dayLogs = data.habitLogs.filter((l) => l.log_date === dateStr && l.completed);
      if (dayLogs.length > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  }, [data.habits, data.habitLogs]);

  // =========================================================================
  // ACTIONS: HABITS
  // =========================================================================
  const toggleHabit = async (habitId: string, targetDate?: string) => {
    const dateToUse = targetDate || selectedDate;
    const currentUserId = user?.id || '';

    const existingLog = data.habitLogs.find(
      (l) => l.habit_id === habitId && l.log_date === dateToUse
    );

    const willBeCompleted = existingLog ? !existingLog.completed : true;
    const nowIso = new Date().toISOString();

    // Play subtle audio pop on check
    if (willBeCompleted) {
      sound.playCheckmark();
    }

    const tempId = existingLog?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hl-${Date.now()}`);

    // Optimistic UI update using functional prev state so rapid clicks don't overwrite each other
    setData((prev) => {
      const found = prev.habitLogs.find(
        (l) => l.habit_id === habitId && l.log_date === dateToUse
      );
      if (found) {
        return {
          ...prev,
          habitLogs: prev.habitLogs.map((l) =>
            l.habit_id === habitId && l.log_date === dateToUse
              ? { ...l, completed: willBeCompleted, completed_at: nowIso }
              : l
          ),
        };
      }
      return {
        ...prev,
        habitLogs: [
          ...prev.habitLogs,
          {
            id: tempId,
            user_id: currentUserId,
            habit_id: habitId,
            log_date: dateToUse,
            completed: willBeCompleted,
            completed_at: nowIso,
          },
        ],
      };
    });

    // Sync to Supabase if connected
    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: upserted, error } = await supabase
          .from('habit_logs')
          .upsert(
            {
              user_id: currentUserId,
              habit_id: habitId,
              log_date: dateToUse,
              completed: willBeCompleted,
              completed_at: nowIso,
            },
            { onConflict: 'habit_id,log_date' }
          )
          .select()
          .single();

        if (error) throw error;
        if (upserted) {
          setData((prev) => ({
            ...prev,
            habitLogs: prev.habitLogs.map((l) =>
              l.habit_id === habitId && l.log_date === dateToUse ? upserted : l
            ),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        // Rollback only this habit+date entry
        setData((prev) => ({
          ...prev,
          habitLogs: existingLog
            ? prev.habitLogs.map((l) =>
                l.habit_id === habitId && l.log_date === dateToUse ? existingLog : l
              )
            : prev.habitLogs.filter(
                (l) => !(l.habit_id === habitId && l.log_date === dateToUse)
              ),
        }));
        showToast({
          type: 'error',
          title: 'Sync Failed',
          message: error.message || 'Could not update habit checkmark.',
        });
      }
    }
  };

  const addHabit = async (title: string, time_slot: HabitTimeSlot) => {
    const currentUserId = user?.id || '';
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `habit-${Date.now()}`;
    const newHabit: DailyHabit = {
      id: newId,
      user_id: currentUserId,
      title: title.trim(),
      time_slot,
      is_active: true,
      sort_order: data.habits.length + 1,
      created_at: new Date().toISOString(),
    };

    const prevHabits = [...data.habits];
    setData((prev) => ({ ...prev, habits: [...prev.habits, newHabit] }));
    showToast({ type: 'success', title: 'Habit Added', message: `"${newHabit.title}" added to daily routine.` });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('daily_habits').insert({
          id: newId,
          user_id: currentUserId,
          title: newHabit.title,
          time_slot: newHabit.time_slot,
          is_active: true,
          sort_order: newHabit.sort_order,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            habits: prev.habits.map((h) => (h.id === newHabit.id ? inserted : h)),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, habits: prevHabits }));
        showToast({ type: 'error', title: 'Error adding habit', message: error.message });
      }
    }
  };

  const updateHabit = async (id: string, updates: Partial<DailyHabit>) => {
    const prevHabits = [...data.habits];
    setData((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('daily_habits').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, habits: prevHabits }));
        showToast({ type: 'error', title: 'Error updating habit', message: error.message });
      }
    }
  };

  const deleteHabit = async (id: string) => {
    const prevHabits = [...data.habits];
    const prevLogs = [...data.habitLogs];

    setData((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
      habitLogs: prev.habitLogs.filter((l) => l.habit_id !== id),
    }));
    showToast({ type: 'info', title: 'Habit Removed' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('daily_habits').delete().eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, habits: prevHabits, habitLogs: prevLogs }));
        showToast({ type: 'error', title: 'Error deleting habit', message: error.message });
      }
    }
  };

  const reorderHabits = async (reordered: DailyHabit[]) => {
    const updated = reordered.map((h, idx) => ({ ...h, sort_order: idx + 1 }));
    setData((prev) => ({ ...prev, habits: updated }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        for (const item of updated) {
          await supabase.from('daily_habits').update({ sort_order: item.sort_order }).eq('id', item.id);
        }
      } catch (err) {
        console.warn('Reorder sync error:', err);
      }
    }
  };

  // =========================================================================
  // ACTIONS: DAILY TASKS
  // =========================================================================
  const addTask = async (title: string, priority: PriorityLevel, date?: string) => {
    const currentUserId = user?.id || '';
    const targetDate = date || selectedDate;
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `task-${Date.now()}`;
    const newTask: DailyTask = {
      id: newId,
      user_id: currentUserId,
      title: title.trim(),
      task_date: targetDate,
      priority,
      completed: false,
      created_at: new Date().toISOString(),
    };

    const prevTasks = [...data.tasks];
    setData((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    showToast({ type: 'success', title: 'Task Added', message: `"${newTask.title}" for ${targetDate}` });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('daily_tasks').insert({
          id: newId,
          user_id: currentUserId,
          title: newTask.title,
          task_date: newTask.task_date,
          priority: newTask.priority,
          completed: false,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            tasks: prev.tasks.map((t) => (t.id === newTask.id ? inserted : t)),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, tasks: prevTasks }));
        showToast({ type: 'error', title: 'Error adding task', message: error.message });
      }
    }
  };

  const toggleTask = async (taskId: string) => {
    const target = data.tasks.find((t) => t.id === taskId);
    if (!target) return;

    const willBeCompleted = !target.completed;
    if (willBeCompleted) sound.playCheckmark();

    const prevTasks = [...data.tasks];
    setData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, completed: willBeCompleted } : t)),
    }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('daily_tasks')
          .update({ completed: willBeCompleted })
          .eq('id', taskId);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, tasks: prevTasks }));
        showToast({ type: 'error', title: 'Error updating task', message: error.message });
      }
    }
  };

  const deleteTask = async (taskId: string) => {
    const prevTasks = [...data.tasks];
    setData((prev) => ({ ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) }));
    showToast({ type: 'info', title: 'Task Deleted' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('daily_tasks').delete().eq('id', taskId);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, tasks: prevTasks }));
        showToast({ type: 'error', title: 'Error deleting task', message: error.message });
      }
    }
  };

  // =========================================================================
  // ACTIONS: SUBJECTS
  // =========================================================================
  const addSubject = async (name: string, color: string): Promise<string | null> => {
    const currentUserId = user?.id || '';
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `subj-${Date.now()}`;
    const newSubject: GateSubject = {
      id: newId,
      user_id: currentUserId,
      name: name.trim(),
      color,
      created_at: new Date().toISOString(),
    };

    const prevSubjects = [...data.subjects];
    setData((prev) => ({ ...prev, subjects: [...prev.subjects, newSubject] }));
    showToast({ type: 'success', title: 'Subject Created', message: name });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('gate_subjects').insert({
          id: newId,
          user_id: currentUserId,
          name: newSubject.name,
          color: newSubject.color,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            subjects: prev.subjects.map((s) => (s.id === newSubject.id ? inserted : s)),
          }));
          return inserted.id;
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, subjects: prevSubjects }));
        showToast({ type: 'error', title: 'Error adding subject', message: error.message });
        return null;
      }
    }
    return newSubject.id;
  };

  const updateSubject = async (id: string, name: string, color: string) => {
    const prevSubjects = [...data.subjects];
    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === id ? { ...s, name: name.trim(), color } : s)),
    }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('gate_subjects')
          .update({ name: name.trim(), color })
          .eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, subjects: prevSubjects }));
        showToast({ type: 'error', title: 'Error updating subject', message: error.message });
      }
    }
  };

  const deleteSubject = async (id: string) => {
    const prevSubjects = [...data.subjects];
    const prevTopics = [...data.topics];

    setData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== id),
      topics: prev.topics.filter((t) => t.subject_id !== id),
    }));
    showToast({ type: 'info', title: 'Subject and associated topics deleted' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('gate_subjects').delete().eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, subjects: prevSubjects, topics: prevTopics }));
        showToast({ type: 'error', title: 'Error deleting subject', message: error.message });
      }
    }
  };

  const seedPresetSubjects = async (branchName?: string) => {
    const currentUserId = user?.id || '';
    const preset = GATE_BRANCH_PRESETS.find((p) => p.branchName === branchName) || GATE_BRANCH_PRESETS[0];

    const newSubjects: GateSubject[] = [];
    const newTopics: GateTopic[] = [];

    preset.subjects.forEach((s, sIdx) => {
      const subjId = `subj-${Date.now()}-${sIdx}`;
      newSubjects.push({
        id: subjId,
        user_id: currentUserId,
        name: s.name,
        color: s.color,
        created_at: new Date().toISOString(),
      });

      s.sampleTopics.forEach((tName, tIdx) => {
        newTopics.push({
          id: `topic-${Date.now()}-${sIdx}-${tIdx}`,
          user_id: currentUserId,
          subject_id: subjId,
          topic_name: tName,
          status: 'Not Started',
          covered_date: null,
          confidence: 3,
          pyqs_solved: 0,
          study_hours: 0,
          notes: null,
          revision_count: 0,
          next_revision_date: null,
          updated_at: new Date().toISOString(),
        });
      });
    });

    setData((prev) => ({
      ...prev,
      subjects: [...prev.subjects, ...newSubjects],
      topics: [...prev.topics, ...newTopics],
    }));

    showToast({
      type: 'success',
      title: 'Preset Seeded',
      message: `Loaded ${newSubjects.length} subjects and ${newTopics.length} syllabus topics for ${preset.branchName}.`,
    });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        for (const subj of newSubjects) {
          const { data: insertedSubj, error: sErr } = await supabase.from('gate_subjects').insert({
            user_id: currentUserId,
            name: subj.name,
            color: subj.color,
          }).select().single();
          if (sErr) continue;

          const relatedTopics = newTopics.filter((t) => t.subject_id === subj.id);
          for (const top of relatedTopics) {
            await supabase.from('gate_topics').insert({
              user_id: currentUserId,
              subject_id: insertedSubj.id,
              topic_name: top.topic_name,
              status: top.status,
              confidence: top.confidence,
              pyqs_solved: top.pyqs_solved,
              study_hours: top.study_hours,
            });
          }
        }
      } catch (err) {
        console.warn('Seed sync error:', err);
      }
    }
  };

  // =========================================================================
  // ACTIONS: TOPICS
  // =========================================================================
  const addTopic = async (
    topicData: Omit<GateTopic, 'id' | 'user_id' | 'revision_count' | 'next_revision_date'> & { next_revision_date?: string | null }
  ) => {
    const currentUserId = user?.id || '';

    // Calculate next revision date if completed and not provided
    let calculatedNextRevision: string | null = topicData.next_revision_date || null;
    if (topicData.status === 'Completed' && !calculatedNextRevision) {
      calculatedNextRevision = format(addDays(new Date(), SPACED_REPETITION_INTERVALS[0]), 'yyyy-MM-dd');
    }

    const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `topic-${Date.now()}`;
    const newTopic: GateTopic = {
      ...topicData,
      id: newId,
      user_id: currentUserId,
      revision_count: 0,
      next_revision_date: calculatedNextRevision,
      updated_at: new Date().toISOString(),
    };

    const prevTopics = [...data.topics];
    setData((prev) => ({ ...prev, topics: [newTopic, ...prev.topics] }));
    showToast({ type: 'success', title: 'Topic Logged', message: newTopic.topic_name });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('gate_topics').insert({
          id: newId,
          user_id: currentUserId,
          subject_id: newTopic.subject_id,
          topic_name: newTopic.topic_name,
          status: newTopic.status,
          covered_date: newTopic.covered_date,
          confidence: newTopic.confidence,
          pyqs_solved: newTopic.pyqs_solved,
          study_hours: newTopic.study_hours,
          notes: newTopic.notes,
          revision_count: 0,
          next_revision_date: newTopic.next_revision_date,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            topics: prev.topics.map((t) => (t.id === newTopic.id ? inserted : t)),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, topics: prevTopics }));
        showToast({ type: 'error', title: 'Error adding topic', message: error.message });
      }
    }
  };

  const updateTopic = async (id: string, updates: Partial<GateTopic>) => {
    const target = data.topics.find((t) => t.id === id);
    if (!target) return;

    // Auto-schedule next revision date if status changed to Completed and no revision scheduled
    const updatedFields = { ...updates, updated_at: new Date().toISOString() };
    if (updates.status === 'Completed' && target.status !== 'Completed' && !target.next_revision_date) {
      updatedFields.next_revision_date = format(addDays(new Date(), SPACED_REPETITION_INTERVALS[0]), 'yyyy-MM-dd');
      if (!updates.covered_date) {
        updatedFields.covered_date = format(new Date(), 'yyyy-MM-dd');
      }
    }

    const prevTopics = [...data.topics];
    setData((prev) => ({
      ...prev,
      topics: prev.topics.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)),
    }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('gate_topics').update(updatedFields).eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, topics: prevTopics }));
        showToast({ type: 'error', title: 'Error updating topic', message: error.message });
      }
    }
  };

  const deleteTopic = async (id: string) => {
    const prevTopics = [...data.topics];
    const prevRevisions = [...data.revisions];

    setData((prev) => ({
      ...prev,
      topics: prev.topics.filter((t) => t.id !== id),
      revisions: prev.revisions.filter((r) => r.topic_id !== id),
    }));
    showToast({ type: 'info', title: 'Topic Deleted' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('gate_topics').delete().eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, topics: prevTopics, revisions: prevRevisions }));
        showToast({ type: 'error', title: 'Error deleting topic', message: error.message });
      }
    }
  };

  // =========================================================================
  // ACTIONS: SPACED REPETITION REVISION
  // =========================================================================
  const markTopicRevised = async (topicId: string, remarks?: string, customNextDate?: string) => {
    const topic = data.topics.find((t) => t.id === topicId);
    if (!topic) return;

    const currentUserId = user?.id || '';
    const newRevCount = (topic.revision_count || 0) + 1;
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // Interval scheduling: +1d, +3d, +7d, +15d, +30d, +60d
    let nextDate: string;
    if (customNextDate) {
      nextDate = customNextDate;
    } else {
      const intervalIndex = Math.min(newRevCount, SPACED_REPETITION_INTERVALS.length - 1);
      const daysToAdd = SPACED_REPETITION_INTERVALS[intervalIndex];
      nextDate = format(addDays(new Date(), daysToAdd), 'yyyy-MM-dd');
    }

    const newRevision: GateRevision = {
      id: `rev-${Date.now()}`,
      user_id: currentUserId,
      topic_id: topicId,
      revision_number: newRevCount,
      revised_on: todayStr,
      remarks: remarks?.trim() || null,
      created_at: new Date().toISOString(),
    };

    const prevTopics = [...data.topics];
    const prevRevisions = [...data.revisions];

    setData((prev) => ({
      ...prev,
      revisions: [newRevision, ...prev.revisions],
      topics: prev.topics.map((t) =>
        t.id === topicId
          ? {
              ...t,
              revision_count: newRevCount,
              next_revision_date: nextDate,
              updated_at: new Date().toISOString(),
            }
          : t
      ),
    }));

    sound.playCheckmark();
    showToast({
      type: 'success',
      title: `Revision #${newRevCount} Logged!`,
      message: `Next revision scheduled for ${nextDate}`,
    });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const [revRes, topRes] = await Promise.all([
          supabase.from('gate_revisions').insert({
            user_id: currentUserId,
            topic_id: topicId,
            revision_number: newRevCount,
            revised_on: todayStr,
            remarks: remarks?.trim() || null,
          }),
          supabase.from('gate_topics').update({
            revision_count: newRevCount,
            next_revision_date: nextDate,
            updated_at: new Date().toISOString(),
          }).eq('id', topicId),
        ]);
        if (revRes.error) throw revRes.error;
        if (topRes.error) throw topRes.error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, topics: prevTopics, revisions: prevRevisions }));
        showToast({ type: 'error', title: 'Error logging revision', message: error.message });
      }
    }
  };

  // =========================================================================
  // ACTIONS: STUDY SESSIONS (Pomodoro & Stopwatch)
  // =========================================================================
  const logStudySession = async (
    subjectId: string | null,
    topicId: string | null,
    durationMinutes: number,
    mode: TimerMode
  ) => {
    if (durationMinutes < 1) return;

    const currentUserId = user?.id || '';
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const additionalHours = Math.round((durationMinutes / 60) * 10) / 10;

    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      user_id: currentUserId,
      subject_id: subjectId,
      topic_id: topicId,
      session_date: todayStr,
      duration_minutes: durationMinutes,
      mode,
      created_at: new Date().toISOString(),
    };

    const prevSessions = [...data.sessions];
    const prevTopics = [...data.topics];

    setData((prev) => ({
      ...prev,
      sessions: [newSession, ...prev.sessions],
      topics: topicId
        ? prev.topics.map((t) =>
            t.id === topicId
              ? {
                  ...t,
                  study_hours: Math.round(((t.study_hours || 0) + additionalHours) * 10) / 10,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        : prev.topics,
    }));

    showToast({
      type: 'success',
      title: 'Session Logged',
      message: `${durationMinutes}m ${mode} added to today's focus hours.`,
    });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error: sessErr } = await supabase.from('study_sessions').insert({
          user_id: currentUserId,
          subject_id: subjectId,
          topic_id: topicId,
          session_date: todayStr,
          duration_minutes: durationMinutes,
          mode,
        });
        if (sessErr) throw sessErr;

        if (topicId) {
          const target = data.topics.find((t) => t.id === topicId);
          if (target) {
            await supabase
              .from('gate_topics')
              .update({
                study_hours: Math.round(((target.study_hours || 0) + additionalHours) * 10) / 10,
                updated_at: new Date().toISOString(),
              })
              .eq('id', topicId);
          }
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, sessions: prevSessions, topics: prevTopics }));
        showToast({ type: 'error', title: 'Error saving study session', message: error.message });
      }
    }
  };

  // =========================================================================
  // ACTIONS: MOCK TESTS & MISTAKES
  // =========================================================================
  const addMockTest = async (testData: Omit<MockTest, 'id' | 'user_id' | 'created_at'>) => {
    const currentUserId = user?.id || '';
    const newTest: MockTest = {
      ...testData,
      id: `test-${Date.now()}`,
      user_id: currentUserId,
      created_at: new Date().toISOString(),
    };

    const prevTests = [...data.mockTests];
    setData((prev) => ({ ...prev, mockTests: [newTest, ...prev.mockTests] }));
    showToast({ type: 'success', title: 'Mock Test Logged', message: `${newTest.title}: ${newTest.marks_scored}/${newTest.total_marks}` });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('mock_tests').insert({
          user_id: currentUserId,
          title: newTest.title,
          test_type: newTest.test_type,
          subject_id: newTest.subject_id,
          test_date: newTest.test_date,
          marks_scored: newTest.marks_scored,
          total_marks: newTest.total_marks,
          correct_count: newTest.correct_count,
          wrong_count: newTest.wrong_count,
          unattempted_count: newTest.unattempted_count,
          negative_marks: newTest.negative_marks,
          notes: newTest.notes,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            mockTests: prev.mockTests.map((t) => (t.id === newTest.id ? inserted : t)),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, mockTests: prevTests }));
        showToast({ type: 'error', title: 'Error adding mock test', message: error.message });
      }
    }
  };

  const deleteMockTest = async (testId: string) => {
    const prevTests = [...data.mockTests];
    setData((prev) => ({ ...prev, mockTests: prev.mockTests.filter((t) => t.id !== testId) }));
    showToast({ type: 'info', title: 'Mock Test Deleted' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('mock_tests').delete().eq('id', testId);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, mockTests: prevTests }));
        showToast({ type: 'error', title: 'Error deleting mock test', message: error.message });
      }
    }
  };

  const addMistake = async (mistakeData: Omit<MistakeLog, 'id' | 'user_id' | 'is_resolved' | 'created_at'>) => {
    const currentUserId = user?.id || '';
    const newMistake: MistakeLog = {
      ...mistakeData,
      id: `mistake-${Date.now()}`,
      user_id: currentUserId,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };

    const prevMistakes = [...data.mistakes];
    setData((prev) => ({ ...prev, mistakes: [newMistake, ...prev.mistakes] }));
    showToast({ type: 'success', title: 'Mistake Added to Notebook' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('mistake_logs').insert({
          user_id: currentUserId,
          subject_id: newMistake.subject_id,
          mock_test_id: newMistake.mock_test_id,
          title: newMistake.title,
          category: newMistake.category,
          fix_note: newMistake.fix_note,
          is_resolved: false,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            mistakes: prev.mistakes.map((m) => (m.id === newMistake.id ? inserted : m)),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, mistakes: prevMistakes }));
        showToast({ type: 'error', title: 'Error adding mistake log', message: error.message });
      }
    }
  };

  const toggleMistakeResolved = async (id: string) => {
    const target = data.mistakes.find((m) => m.id === id);
    if (!target) return;

    const willBeResolved = !target.is_resolved;
    if (willBeResolved) sound.playCheckmark();

    const prevMistakes = [...data.mistakes];
    setData((prev) => ({
      ...prev,
      mistakes: prev.mistakes.map((m) => (m.id === id ? { ...m, is_resolved: willBeResolved } : m)),
    }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('mistake_logs')
          .update({ is_resolved: willBeResolved })
          .eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, mistakes: prevMistakes }));
        showToast({ type: 'error', title: 'Error updating mistake status', message: error.message });
      }
    }
  };

  const deleteMistake = async (id: string) => {
    const prevMistakes = [...data.mistakes];
    setData((prev) => ({ ...prev, mistakes: prev.mistakes.filter((m) => m.id !== id) }));
    showToast({ type: 'info', title: 'Mistake Deleted' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('mistake_logs').delete().eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, mistakes: prevMistakes }));
        showToast({ type: 'error', title: 'Error deleting mistake', message: error.message });
      }
    }
  };

  // =========================================================================
  // ACTIONS: FLASHCARDS
  // =========================================================================
  const addFlashcard = async (subjectId: string | null, frontPrompt: string, backAnswer: string) => {
    const currentUserId = user?.id || '';
    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      user_id: currentUserId,
      subject_id: subjectId,
      front_prompt: frontPrompt.trim(),
      back_answer: backAnswer.trim(),
      needs_review: true,
      created_at: new Date().toISOString(),
    };

    const prevCards = [...data.flashcards];
    setData((prev) => ({ ...prev, flashcards: [newCard, ...prev.flashcards] }));
    showToast({ type: 'success', title: 'Flashcard Added to Vault' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { data: inserted, error } = await supabase.from('flashcards').insert({
          user_id: currentUserId,
          subject_id: newCard.subject_id,
          front_prompt: newCard.front_prompt,
          back_answer: newCard.back_answer,
          needs_review: true,
        }).select().single();
        if (error) throw error;
        if (inserted) {
          setData((prev) => ({
            ...prev,
            flashcards: prev.flashcards.map((c) => (c.id === newCard.id ? inserted : c)),
          }));
        }
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, flashcards: prevCards }));
        showToast({ type: 'error', title: 'Error adding flashcard', message: error.message });
      }
    }
  };

  const toggleFlashcardReview = async (id: string) => {
    const target = data.flashcards.find((c) => c.id === id);
    if (!target) return;

    const willNeedReview = !target.needs_review;
    const prevCards = [...data.flashcards];
    setData((prev) => ({
      ...prev,
      flashcards: prev.flashcards.map((c) => (c.id === id ? { ...c, needs_review: willNeedReview } : c)),
    }));

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('flashcards')
          .update({ needs_review: willNeedReview })
          .eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, flashcards: prevCards }));
        showToast({ type: 'error', title: 'Error updating flashcard', message: error.message });
      }
    }
  };

  const deleteFlashcard = async (id: string) => {
    const prevCards = [...data.flashcards];
    setData((prev) => ({ ...prev, flashcards: prev.flashcards.filter((c) => c.id !== id) }));
    showToast({ type: 'info', title: 'Flashcard Deleted' });

    if (user?.id && isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('flashcards').delete().eq('id', id);
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, flashcards: prevCards }));
        showToast({ type: 'error', title: 'Error deleting flashcard', message: error.message });
      }
    }
  };

  // =========================================================================
  // ACTIONS: SETTINGS & EXPORT
  // =========================================================================
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...data.settings, ...newSettings, updated_at: new Date().toISOString() };
    const prevSettings = data.settings;
    setData((prev) => ({ ...prev, settings: updated }));
    showToast({ type: 'success', title: 'Settings Saved' });

    if (user?.id && isSupabaseConfigured && supabase && user?.id) {
      try {
        const { error } = await supabase.from('user_settings').upsert({
          user_id: user.id,
          gate_exam_date: updated.gate_exam_date,
          daily_study_goal_hours: updated.daily_study_goal_hours,
          pomodoro_focus_mins: updated.pomodoro_focus_mins,
          pomodoro_break_mins: updated.pomodoro_break_mins,
          updated_at: new Date().toISOString(),
        });
        if (error) throw error;
      } catch (err: unknown) {
        const error = err as Error;
        setData((prev) => ({ ...prev, settings: prevSettings }));
        showToast({ type: 'error', title: 'Error saving settings', message: error.message });
      }
    }
  };

  const exportData = (formatType: 'json' | 'csv') => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmm');
    if (formatType === 'json') {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker_backup_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'JSON Backup Downloaded' });
    } else {
      // Export topics as CSV
      const headers = ['Subject', 'Topic Name', 'Status', 'Covered Date', 'Confidence (1-5)', 'PYQs Solved', 'Study Hours', 'Revision Count', 'Next Revision Date', 'Notes'];
      const subjectMap = new Map<string, string>();
      data.subjects.forEach((s) => subjectMap.set(s.id, s.name));

      const rows = data.topics.map((t) => [
        `"${(subjectMap.get(t.subject_id) || 'Unknown').replace(/"/g, '""')}"`,
        `"${t.topic_name.replace(/"/g, '""')}"`,
        `"${t.status}"`,
        `"${t.covered_date || ''}"`,
        t.confidence,
        t.pyqs_solved,
        t.study_hours,
        t.revision_count,
        `"${t.next_revision_date || ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tracker_gate_topics_${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: 'success', title: 'CSV Topics Exported' });
    }
  };

  // Helper for Calendar Day Drawer
  const getDayDetailData = useCallback(
    (targetDate: string): DayDetailData => {
      const logsMap = new Map<string, HabitLog>();
      data.habitLogs
        .filter((l) => l.log_date === targetDate)
        .forEach((l) => logsMap.set(l.habit_id, l));

      const habits = data.habits
        .filter((h) => h.is_active)
        .map((h) => ({
          habit: h,
          completed: Boolean(logsMap.get(h.id)?.completed),
        }));

      const tasks = data.tasks.filter((t) => t.task_date === targetDate);
      const topicsCovered = data.topics.filter((t) => t.covered_date === targetDate);

      const topicMap = new Map<string, GateTopic>();
      data.topics.forEach((t) => topicMap.set(t.id, t));
      const subjectMap = new Map<string, GateSubject>();
      data.subjects.forEach((s) => subjectMap.set(s.id, s));

      const revisions = data.revisions
        .filter((r) => r.revised_on === targetDate)
        .map((r) => {
          const topic = topicMap.get(r.topic_id);
          const subject = topic ? subjectMap.get(topic.subject_id) : undefined;
          return {
            revision: r,
            topicName: topic?.topic_name || 'Unknown Topic',
            subjectName: subject?.name,
            subjectColor: subject?.color,
          };
        });

      const daySessions = data.sessions.filter((s) => s.session_date === targetDate);
      const totalMinutes = daySessions.reduce((acc, curr) => acc + (curr.duration_minutes || 0), 0);
      const totalStudyHours = Math.round((totalMinutes / 60) * 10) / 10;

      return {
        date: targetDate,
        habits,
        tasks,
        topicsCovered,
        revisions,
        studySessions: daySessions,
        totalStudyHours,
      };
    },
    [data]
  );

  return (
    <DataContext.Provider
      value={{
        loading,
        selectedDate,
        setSelectedDate,
        goToToday,
        goToPrevDay,
        goToNextDay,
        settings: data.settings,
        habits: data.habits,
        habitLogs: data.habitLogs,
        tasks: data.tasks,
        subjects: data.subjects,
        topics: data.topics,
        revisions: data.revisions,
        sessions: data.sessions,
        mockTests: data.mockTests,
        mistakes: data.mistakes,
        flashcards: data.flashcards,
        selectedDateHabits,
        selectedDateTasks,
        selectedDateStudyHours,
        selectedDateProgress,
        activeStreak,
        toggleHabit,
        addHabit,
        updateHabit,
        deleteHabit,
        reorderHabits,
        addTask,
        toggleTask,
        deleteTask,
        addSubject,
        updateSubject,
        deleteSubject,
        seedPresetSubjects,
        addTopic,
        updateTopic,
        deleteTopic,
        markTopicRevised,
        logStudySession,
        addMockTest,
        deleteMockTest,
        addMistake,
        toggleMistakeResolved,
        deleteMistake,
        addFlashcard,
        toggleFlashcardReview,
        deleteFlashcard,
        updateSettings,
        exportData,
        getDayDetailData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
