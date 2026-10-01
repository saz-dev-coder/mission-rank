export type ExamType = 
  | 'SSC CGL'
  | 'SSC CHSL'
  | 'SSC MTS'
  | 'SSC CPO'
  | 'Railway'
  | 'Banking'
  | 'Other';

export type CurrentStage = 
  | 'Beginner'
  | 'Restarting'
  | 'Intermediate'
  | 'Revision phase';

export type SubjectType =
  | 'Quant'
  | 'English'
  | 'Reasoning'
  | 'General Awareness'
  | 'Computer'
  | 'Mock Test'
  | 'Revision'
  | 'Other';

export type TaskCategory = 'regular' | 'availability_block';

export type TaskType =
  | 'Learn'
  | 'Practice'
  | 'Revise'
  | 'Mock test'
  | 'Mock analysis'
  | 'Notes'
  | 'Typing practice'
  | 'Other';

export type Priority = 'Must do' | 'Should do' | 'Optional';

export type TaskStatus =
  | 'Pending'
  | 'In progress'
  | 'Partially complete'
  | 'Completed'
  | 'Skipped'
  | 'Overdue';

export type TargetUnit =
  | 'Words'
  | 'Questions'
  | 'Passages'
  | 'Sets'
  | 'Topics'
  | 'Pages'
  | 'Minutes'
  | 'Mocks'
  | 'Mistakes reviewed'
  | 'Items'
  | 'Custom';

export type TaskDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface StudentProfile {
  id: string;
  firstName: string;
  targetExam: ExamType;
  targetYear?: string;
  currentStage: CurrentStage;
  strongestSubject: SubjectType;
  weakestSubject: SubjectType;
  weekdayAvailability: {
    startTime: string; // "18:00"
    endTime: string;   // "22:00"
    flexibleHours: number; // e.g. 4
    isFlexible: boolean;
  };
  weekendAvailability: {
    startTime: string;
    endTime: string;
    flexibleHours: number;
    isFlexible: boolean;
  };
  preferredReminderTime: string; // "07:30"
  reminderStyle: 'Gentle' | 'Strict but respectful';
  theme: 'dark' | 'light' | 'system';
  reduceMotion: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  subject: SubjectType;
  subtopic?: string;
  category: TaskCategory;
  taskType: TaskType;
  priority: Priority;
  plannedDate: string; // YYYY-MM-DD
  startTime?: string;  // HH:mm (24-hour)
  endTime?: string;    // HH:mm (24-hour)
  plannedDurationMinutes: number;
  isFlexible: boolean;
  reminderLeadMinutes: number; // default 10
  targetCategory?: string;
  targetValue: number;
  targetUnit: TargetUnit;
  currentCompletedValue: number;
  attemptedQuestions?: number;
  correctAnswers?: number;
  accuracyTarget?: number;
  calculatedAccuracy?: number;
  difficulty: TaskDifficulty;
  status: TaskStatus;
  actualStartTime?: string;
  actualCompletedDurationMinutes: number;
  notes?: string;
  createdDate: string;
  completedDate?: string;
  skippedReason?: string;
  followUpTaskId?: string;
  parentTaskId?: string;
}

export interface TaskTemplate {
  id: string;
  title: string;
  subject: SubjectType;
  subtopic?: string;
  taskType: TaskType;
  priority: Priority;
  durationMinutes: number;
  targetValue: number;
  targetUnit: TargetUnit;
  accuracyTarget?: number;
  isCustom?: boolean;
}

export interface ActiveFocusSession {
  taskId: string;
  startTimestamp: number;
  isPaused: boolean;
  pauseTimestamp?: number;
  accumulatedActiveSeconds: number;
  plannedDurationMinutes: number;
  currentTargetProgress: number;
  attemptedQuestions?: number;
  correctAnswers?: number;
}

export interface CompletedFocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  subject: SubjectType;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  targetAchieved: number;
  attemptedQuestions?: number;
  correctAnswers?: number;
  accuracy?: number;
  date: string; // YYYY-MM-DD
}

export type ScoreBand = 'Excellent' | 'On track' | 'Recoverable' | 'At risk' | 'Fresh start / No plan yet';

export interface DailyScoreBreakdown {
  mustDoScore: number;      // max 45
  studyTimeScore: number;   // max 25
  practiceScore: number;    // max 15
  revisionScore: number;    // max 10
  planningHygieneScore: number; // max 5
  total: number;            // 0 - 100
  band: ScoreBand;
  explanation: string;
  hasTasks: boolean;
}

export interface DailyReviewRecord {
  id: string;
  date: string; // YYYY-MM-DD
  completedTasksCount: number;
  plannedMinutes: number;
  actualMinutes: number;
  score: number;
  obstacle?: string;
  reflection?: string;
  createdAt: string;
}

export interface WeeklyReviewRecord {
  id: string;
  weekStartDate: string;
  whatWorked: string;
  whatMissed: string;
  decision: 'Keep my plan' | 'Simplify next week' | 'Increase study load slightly';
  createdAt: string;
}

export interface AlarmPreferences {
  enabled: boolean;
  volume: number; // 0 - 100
  sound: 'Soft bell' | 'Clear chime' | 'Digital beep';
  vibration: boolean;
  autoStopSeconds: 3 | 5 | 10;
}

export interface ReminderSettings {
  dailyPlanReminder: boolean;
  taskStartReminder: boolean;
  leadTimeMinutes: number;
  dailyWrapUpReminder: boolean;
  overdueReminder: boolean;
  reminderStyle: 'Gentle' | 'Strict but respectful';
  quietHoursStart: string;
  quietHoursEnd: string;
  maxDailyFrequency: number;
  pausedUntilDate?: string;
  browserNotificationsEnabled: boolean;
}

export interface FeedbackSubmission {
  id: string;
  category: 'Bug' | 'Feature request' | 'Confusing experience' | 'General feedback';
  whatTryingToDo: string;
  whatHappened: string;
  email?: string;
  timestamp: string;
  page: string;
  userAgent: string;
}

export interface InAppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'reminder' | 'warning' | 'celebration';
  timestamp: string;
  read: boolean;
  taskId?: string;
}

export interface MockTestLog {
  id: string;
  title: string;
  date: string;
  score: number;
  maxScore: number;
  accuracy: number;
  notes?: string;
  subject?: SubjectType;
}

export interface AppStateExport {
  version: number;
  exportedAt: string;
  profile: StudentProfile | null;
  tasks: Task[];
  templates: TaskTemplate[];
  focusSessions: CompletedFocusSession[];
  dailyReviews: DailyReviewRecord[];
  weeklyReviews: WeeklyReviewRecord[];
  alarmPreferences: AlarmPreferences;
  reminderSettings: ReminderSettings;
  mockTests: MockTestLog[];
}
