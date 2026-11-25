export type PriorityLevel = 'Low' | 'Medium' | 'High';
export type HabitTimeSlot = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';
export type TopicStatus = 'Not Started' | 'In Progress' | 'Completed';
export type TimerMode = 'Pomodoro' | 'Stopwatch';
export type PomodoroPhase = 'focus' | 'short_break' | 'long_break';
export type TestType = 'Full Length' | 'Subject Test' | 'PYQ Paper' | 'Topic Test';
export type MistakeCategory = 'Conceptual Gap' | 'Silly / Calculation' | 'Formula Forgotten' | 'Time Pressure';

export interface UserSettings {
  user_id: string;
  gate_exam_date: string; // YYYY-MM-DD
  daily_study_goal_hours: number;
  pomodoro_focus_mins: number;
  pomodoro_break_mins: number;
  updated_at?: string;
}

export interface DailyHabit {
  id: string;
  user_id: string;
  title: string;
  time_slot: HabitTimeSlot;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

export interface HabitLog {
  id: string;
  user_id: string;
  habit_id: string;
  log_date: string; // YYYY-MM-DD
  completed: boolean;
  completed_at?: string;
}

export interface DailyTask {
  id: string;
  user_id: string;
  title: string;
  task_date: string; // YYYY-MM-DD
  priority: PriorityLevel;
  completed: boolean;
  created_at?: string;
}

export interface GateSubject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface GateTopic {
  id: string;
  user_id: string;
  subject_id: string;
  topic_name: string;
  subtopic?: string | null;
  status: TopicStatus;
  covered_date?: string | null; // YYYY-MM-DD
  confidence: number; // 1 to 5
  pyqs_solved: number;
  study_hours: number;
  notes?: string | null;
  revision_count: number;
  next_revision_date?: string | null; // YYYY-MM-DD
  updated_at?: string;
}

export interface GateRevision {
  id: string;
  user_id: string;
  topic_id: string;
  revision_number: number;
  revised_on: string; // YYYY-MM-DD
  remarks?: string | null;
  created_at?: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  session_date: string; // YYYY-MM-DD
  duration_minutes: number;
  mode: TimerMode;
  created_at?: string;
}

export interface MockTest {
  id: string;
  user_id: string;
  title: string;
  test_type: TestType;
  subject_id?: string | null;
  test_date: string; // YYYY-MM-DD
  marks_scored: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  unattempted_count: number;
  negative_marks: number;
  notes?: string | null;
  created_at?: string;
}

export interface MistakeLog {
  id: string;
  user_id: string;
  subject_id?: string | null;
  mock_test_id?: string | null;
  title: string;
  category: MistakeCategory;
  fix_note?: string | null;
  is_resolved: boolean;
  created_at?: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id?: string | null;
  front_prompt: string;
  back_answer: string;
  needs_review: boolean;
  created_at?: string;
}

export interface DayDetailData {
  date: string;
  habits: {
    habit: DailyHabit;
    completed: boolean;
  }[];
  tasks: DailyTask[];
  topicsCovered: GateTopic[];
  revisions: {
    revision: GateRevision;
    topicName: string;
    subjectName?: string;
    subjectColor?: string;
  }[];
  studySessions: StudySession[];
  totalStudyHours: number;
}

