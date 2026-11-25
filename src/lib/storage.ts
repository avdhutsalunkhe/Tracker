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
import { DEFAULT_GATE_EXAM_DATE, DEFAULT_DAILY_STUDY_GOAL_HOURS, DEFAULT_HABIT_TEMPLATES, GATE_BRANCH_PRESETS } from './constants';
import { format, subDays, addDays } from 'date-fns';

const LOCAL_STORAGE_KEY = 'tracker_offline_store_v1';

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

export const getInitialDefaultData = (userId: string = 'demo-user'): StorageData => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgoStr = format(subDays(new Date(), 2), 'yyyy-MM-dd');

  // Pre-seed default habits
  const habits: DailyHabit[] = DEFAULT_HABIT_TEMPLATES.map((h, i) => ({
    id: `habit-${i + 1}`,
    user_id: userId,
    title: h.title,
    time_slot: h.time_slot,
    is_active: true,
    sort_order: h.sort_order,
    created_at: new Date().toISOString(),
  }));

  // Pre-seed some habit logs for today and yesterday
  const habitLogs: HabitLog[] = [
    { id: 'hl-1', user_id: userId, habit_id: 'habit-1', log_date: todayStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-2', user_id: userId, habit_id: 'habit-2', log_date: todayStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-3', user_id: userId, habit_id: 'habit-1', log_date: yesterdayStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-4', user_id: userId, habit_id: 'habit-2', log_date: yesterdayStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-5', user_id: userId, habit_id: 'habit-3', log_date: yesterdayStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-6', user_id: userId, habit_id: 'habit-4', log_date: yesterdayStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-7', user_id: userId, habit_id: 'habit-1', log_date: twoDaysAgoStr, completed: true, completed_at: new Date().toISOString() },
    { id: 'hl-8', user_id: userId, habit_id: 'habit-4', log_date: twoDaysAgoStr, completed: true, completed_at: new Date().toISOString() },
  ];

  // Daily Tasks
  const tasks: DailyTask[] = [
    { id: 'task-1', user_id: userId, title: 'Revise Discrete Maths Logic & Quantifiers', task_date: todayStr, priority: 'High', completed: false, created_at: new Date().toISOString() },
    { id: 'task-2', user_id: userId, title: 'Solve 10 questions on Paging & TLB', task_date: todayStr, priority: 'Medium', completed: true, created_at: new Date().toISOString() },
    { id: 'task-3', user_id: userId, title: 'Submit Weekly Test Series Mock #3', task_date: todayStr, priority: 'High', completed: false, created_at: new Date().toISOString() },
  ];

  // Seed standard CS subjects
  const csPreset = GATE_BRANCH_PRESETS[0];
  const subjects: GateSubject[] = csPreset.subjects.slice(0, 5).map((s, idx) => ({
    id: `subj-${idx + 1}`,
    user_id: userId,
    name: s.name,
    color: s.color,
    created_at: new Date().toISOString(),
  }));

  // Topics
  const topics: GateTopic[] = [
    {
      id: 'topic-1',
      user_id: userId,
      subject_id: 'subj-1',
      topic_name: 'Propositional & First Order Logic',
      status: 'Completed',
      covered_date: subDays(new Date(), 4).toISOString().split('T')[0],
      confidence: 5,
      pyqs_solved: 35,
      study_hours: 6.5,
      notes: 'Remember: P -> Q is equivalent to ~P v Q. Tautology checks via truth table and resolution refutation.',
      revision_count: 2,
      next_revision_date: todayStr, // Due today!
      updated_at: new Date().toISOString(),
    },
    {
      id: 'topic-2',
      user_id: userId,
      subject_id: 'subj-4',
      topic_name: 'Binary Search Trees & AVL Rotations',
      status: 'Completed',
      covered_date: subDays(new Date(), 8).toISOString().split('T')[0],
      confidence: 4,
      pyqs_solved: 25,
      study_hours: 5.0,
      notes: 'Height of AVL tree: N(h) = N(h-1) + N(h-2) + 1. LL/RR single rotation, LR/RL double rotations.',
      revision_count: 1,
      next_revision_date: subDays(new Date(), 1).toISOString().split('T')[0], // Overdue!
      updated_at: new Date().toISOString(),
    },
    {
      id: 'topic-3',
      user_id: userId,
      subject_id: 'subj-5',
      topic_name: 'Dynamic Programming (Knapsack & LCS)',
      status: 'In Progress',
      covered_date: todayStr,
      confidence: 2,
      pyqs_solved: 12,
      study_hours: 4.0,
      notes: 'Matrix chain multiplication dimensions: cost calculation M[i,k] + M[k+1,j] + p_{i-1}p_k p_j.',
      revision_count: 0,
      next_revision_date: addDays(new Date(), 2).toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    },
    {
      id: 'topic-4',
      user_id: userId,
      subject_id: 'subj-2',
      topic_name: 'K-Map Minimization & Hazards',
      status: 'Completed',
      covered_date: subDays(new Date(), 12).toISOString().split('T')[0],
      confidence: 4,
      pyqs_solved: 20,
      study_hours: 3.5,
      notes: 'Static-1 hazard occurs in SOP when adjacent 1s are in different prime implicants without consensus term.',
      revision_count: 2,
      next_revision_date: addDays(new Date(), 4).toISOString().split('T')[0], // Upcoming
      updated_at: new Date().toISOString(),
    },
    {
      id: 'topic-5',
      user_id: userId,
      subject_id: 'subj-3',
      topic_name: 'Instruction Pipelining & Branch Hazards',
      status: 'Not Started',
      covered_date: null,
      confidence: 3,
      pyqs_solved: 0,
      study_hours: 0,
      notes: 'Speedup = non-pipelined time / pipelined time. CPI ideally 1.',
      revision_count: 0,
      next_revision_date: null,
      updated_at: new Date().toISOString(),
    }
  ];

  // Revisions history
  const revisions: GateRevision[] = [
    {
      id: 'rev-1',
      user_id: userId,
      topic_id: 'topic-1',
      revision_number: 1,
      revised_on: subDays(new Date(), 3).toISOString().split('T')[0],
      remarks: 'Practiced 5 GATE 2021 questions. Solid understanding.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'rev-2',
      user_id: userId,
      topic_id: 'topic-2',
      revision_number: 1,
      revised_on: subDays(new Date(), 6).toISOString().split('T')[0],
      remarks: 'Re-derived min nodes for AVL of height h.',
      created_at: new Date().toISOString(),
    }
  ];

  // Study sessions
  const sessions: StudySession[] = [
    {
      id: 'sess-1',
      user_id: userId,
      subject_id: 'subj-1',
      topic_id: 'topic-1',
      session_date: todayStr,
      duration_minutes: 50,
      mode: 'Pomodoro',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sess-2',
      user_id: userId,
      subject_id: 'subj-4',
      topic_id: 'topic-2',
      session_date: todayStr,
      duration_minutes: 60,
      mode: 'Stopwatch',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sess-3',
      user_id: userId,
      subject_id: 'subj-5',
      topic_id: 'topic-3',
      session_date: yesterdayStr,
      duration_minutes: 110,
      mode: 'Stopwatch',
      created_at: new Date().toISOString(),
    },
    {
      id: 'sess-4',
      user_id: userId,
      subject_id: 'subj-2',
      topic_id: 'topic-4',
      session_date: twoDaysAgoStr,
      duration_minutes: 75,
      mode: 'Pomodoro',
      created_at: new Date().toISOString(),
    }
  ];

  // Mock Tests
  const mockTests: MockTest[] = [
    {
      id: 'test-1',
      user_id: userId,
      title: 'MadeEasy Subject Test #1 — Discrete Mathematics',
      test_type: 'Subject Test',
      subject_id: 'subj-1',
      test_date: subDays(new Date(), 7).toISOString().split('T')[0],
      marks_scored: 42.5,
      total_marks: 50,
      correct_count: 22,
      wrong_count: 3,
      unattempted_count: 5,
      negative_marks: 1.0,
      notes: 'Made silly sign error on counting question. Relations part was 100% correct.',
      created_at: new Date().toISOString(),
    },
    {
      id: 'test-2',
      user_id: userId,
      title: 'GATE 2024 Official Paper Set-1 Simulation',
      test_type: 'Full Length',
      subject_id: null,
      test_date: subDays(new Date(), 2).toISOString().split('T')[0],
      marks_scored: 68.33,
      total_marks: 100,
      correct_count: 46,
      wrong_count: 8,
      unattempted_count: 11,
      negative_marks: 3.33,
      notes: 'Need to improve speed in Aptitude and avoid rushing in MSQs.',
      created_at: new Date().toISOString(),
    }
  ];

  // Mistakes
  const mistakes: MistakeLog[] = [
    {
      id: 'mst-1',
      user_id: userId,
      subject_id: 'subj-1',
      mock_test_id: 'test-1',
      title: 'Equivalence Relations Counting on Set of size n',
      category: 'Formula Forgotten',
      fix_note: 'Bell Numbers B_n count the number of equivalence relations (partitions) on a set of size n. B_0=1, B_1=1, B_2=2, B_3=5, B_4=15, B_5=52.',
      is_resolved: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mst-2',
      user_id: userId,
      subject_id: 'subj-4',
      mock_test_id: 'test-2',
      title: 'BST Postorder Reconstruction Traversal Ambiguity',
      category: 'Conceptual Gap',
      fix_note: 'In BST, Postorder alone is SUFFICIENT because sorting the keys gives Inorder automatically!',
      is_resolved: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'mst-3',
      user_id: userId,
      subject_id: 'subj-2',
      mock_test_id: null,
      title: 'Dual vs Complement of Boolean Expression',
      category: 'Silly / Calculation',
      fix_note: 'Dual replaces AND with OR, OR with AND, 0 with 1, 1 with 0. Complement ALSO inverts all variables.',
      is_resolved: true,
      created_at: new Date().toISOString(),
    }
  ];

  // Flashcards
  const flashcards: Flashcard[] = [
    {
      id: 'fc-1',
      user_id: userId,
      subject_id: 'subj-1',
      front_prompt: 'Euler totient formula phi(p^k) and properties?',
      back_answer: 'phi(p^k) = p^k - p^(k-1) = p^k * (1 - 1/p). If m, n are coprime, phi(mn) = phi(m)*phi(n).',
      needs_review: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'fc-2',
      user_id: userId,
      subject_id: 'subj-4',
      front_prompt: 'Minimum number of nodes in AVL tree of height h (h >= 0)?',
      back_answer: 'N(0) = 1, N(1) = 2, N(h) = N(h-1) + N(h-2) + 1. (Fibonacci style + 1)',
      needs_review: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 'fc-3',
      user_id: userId,
      subject_id: 'subj-5',
      front_prompt: 'Master Theorem for T(n) = a*T(n/b) + Theta(n^k * log^p(n))',
      back_answer: 'Compare log_b(a) with k:\n1. If log_b(a) > k -> Theta(n^(log_b(a)))\n2. If log_b(a) == k:\n   - p > -1: Theta(n^k * log^(p+1)(n))\n   - p == -1: Theta(n^k * log(log(n)))\n   - p < -1: Theta(n^k)\n3. If log_b(a) < k: Theta(n^k * log^p(n)) (regularity applies)',
      needs_review: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'fc-4',
      user_id: userId,
      subject_id: 'subj-2',
      front_prompt: 'Self-Complementing Codes condition & examples?',
      back_answer: 'Sum of weights must equal 9. Examples: 2421, 5211, Excess-3, 84-2-1.',
      needs_review: false,
      created_at: new Date().toISOString(),
    }
  ];

  return {
    settings: {
      user_id: userId,
      gate_exam_date: DEFAULT_GATE_EXAM_DATE,
      daily_study_goal_hours: DEFAULT_DAILY_STUDY_GOAL_HOURS,
      pomodoro_focus_mins: 50,
      pomodoro_break_mins: 10,
      updated_at: new Date().toISOString(),
    },
    habits,
    habitLogs,
    tasks,
    subjects,
    topics,
    revisions,
    sessions,
    mockTests,
    mistakes,
    flashcards,
  };
};

export const loadStoredData = (userId: string = 'demo-user'): StorageData => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load local tracker data:', e);
  }
  const defaultData = getInitialDefaultData(userId);
  saveStoredData(userId, defaultData);
  return defaultData;
};

export const saveStoredData = (userId: string, data: StorageData): void => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save local tracker data:', e);
  }
};
