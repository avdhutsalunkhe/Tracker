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
} from '../types';
import { DEFAULT_GATE_EXAM_DATE, DEFAULT_DAILY_STUDY_GOAL_HOURS } from './constants';

const LOCAL_STORAGE_KEY = 'tracker_store_v2';
const LEGACY_DEMO_KEY_PREFIX = 'tracker_offline_store_v1';

export interface StorageData {
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
}

export const getEmptyUserData = (userId: string): StorageData => ({
  settings: {
    user_id: userId,
    gate_exam_date: DEFAULT_GATE_EXAM_DATE,
    daily_study_goal_hours: DEFAULT_DAILY_STUDY_GOAL_HOURS,
    pomodoro_focus_mins: 50,
    pomodoro_break_mins: 10,
    updated_at: new Date().toISOString(),
  },
  habits: [],
  habitLogs: [],
  tasks: [],
  subjects: [],
  topics: [],
  revisions: [],
  sessions: [],
  mockTests: [],
  mistakes: [],
  flashcards: [],
});

export const clearLegacyDemoStorage = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(LEGACY_DEMO_KEY_PREFIX) || key.includes('demo-user') || key.includes('demo-gate-aspirant'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore storage errors
  }
};

export const loadStoredData = (userId: string): StorageData => {
  if (!userId) return getEmptyUserData('');
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load local tracker data:', e);
  }
  return getEmptyUserData(userId);
};

export const saveStoredData = (userId: string, data: StorageData): void => {
  if (!userId) return;
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local tracker data:', e);
  }
};
