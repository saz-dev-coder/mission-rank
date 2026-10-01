import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  StudentProfile,
  Task,
  TaskTemplate,
  ActiveFocusSession,
  CompletedFocusSession,
  AlarmPreferences,
  ReminderSettings,
  DailyReviewRecord,
  WeeklyReviewRecord,
  MockTestLog,
  InAppNotification,
  FeedbackSubmission,
  AppStateExport,
} from '../types';
import { generateStarterTasks, BUILT_IN_TEMPLATES } from '../utils/starterData';
import { getTodayDateString, calculateDurationFromTimes } from '../utils/dateUtils';
import { stopAlarmLoop } from '../utils/audio';

interface AppContextType {
  profile: StudentProfile | null;
  tasks: Task[];
  templates: TaskTemplate[];
  activeFocusSession: ActiveFocusSession | null;
  completedFocusSessions: CompletedFocusSession[];
  alarmPreferences: AlarmPreferences;
  reminderSettings: ReminderSettings;
  dailyReviews: DailyReviewRecord[];
  weeklyReviews: WeeklyReviewRecord[];
  mockTests: MockTestLog[];
  notifications: InAppNotification[];
  currentView: string;
  setCurrentView: (view: string) => void;
  activeFocusTaskId: string | null;
  setActiveFocusTaskId: (id: string | null) => void;
  lastSaved: string;
  
  // Profile actions
  saveProfile: (newProfile: StudentProfile) => void;
  updateProfile: (updates: Partial<StudentProfile>) => void;
  
  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdDate'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  duplicateTask: (taskId: string) => Task;
  splitTask: (taskId: string, part1Target: number, part2Target: number, part2Date?: string) => void;
  rescheduleTask: (taskId: string, newDate: string, newStartTime?: string, newEndTime?: string) => void;
  skipTask: (taskId: string, reason?: string) => void;
  completeTask: (
    taskId: string,
    completedValue: number,
    attempted?: number,
    correct?: number,
    actualDurationMinutes?: number,
    difficulty?: 'Easy' | 'Medium' | 'Hard'
  ) => void;

  // Focus actions
  startFocusSession: (taskId: string) => void;
  pauseFocusSession: () => void;
  resumeFocusSession: () => void;
  endFocusSession: (
    markComplete?: boolean,
    finalTargetAchieved?: number,
    attempted?: number,
    correct?: number
  ) => void;
  addFocusMinutes: (minutes: number) => void;
  updateSessionTargetProgress: (achieved: number, attempted?: number, correct?: number) => void;

  // Template actions
  saveTemplate: (template: Omit<TaskTemplate, 'id'>) => void;
  deleteTemplate: (templateId: string) => void;

  // Settings & Preferences
  updateAlarmPreferences: (updates: Partial<AlarmPreferences>) => void;
  updateReminderSettings: (updates: Partial<ReminderSettings>) => void;
  requestNotificationPermission: () => Promise<boolean>;

  // Reviews & Mock tests
  submitDailyReview: (review: Omit<DailyReviewRecord, 'id' | 'createdAt'>) => void;
  submitWeeklyReview: (review: Omit<WeeklyReviewRecord, 'id' | 'createdAt'>) => void;
  addMockTestLog: (log: Omit<MockTestLog, 'id'>) => void;
  dismissNotification: (id: string) => void;

  // Data persistence & backup
  exportData: () => string;
  validateImportJson: (jsonString: string) => { valid: boolean; error?: string; preview?: any; data?: AppStateExport };
  importData: (importedData: AppStateExport) => boolean;
  restoreLatestBackup: () => boolean;
  hasBackup: boolean;
  clearAllData: () => void;
  sendFeedbackLocally: (feedback: Omit<FeedbackSubmission, 'id' | 'timestamp' | 'page' | 'userAgent'>) => boolean;
}

const STORAGE_KEYS = {
  PROFILE: 'mission_rank_profile_v1',
  TASKS: 'mission_rank_tasks_v1',
  TEMPLATES: 'mission_rank_templates_v1',
  ACTIVE_FOCUS: 'mission_rank_active_focus_v1',
  FOCUS_SESSIONS: 'mission_rank_focus_sessions_v1',
  ALARM: 'mission_rank_alarm_v1',
  REMINDERS: 'mission_rank_reminders_v1',
  DAILY_REVIEWS: 'mission_rank_daily_reviews_v1',
  WEEKLY_REVIEWS: 'mission_rank_weekly_reviews_v1',
  MOCK_TESTS: 'mission_rank_mock_tests_v1',
  BACKUP: 'mission_rank_backup_v1',
  FEEDBACK: 'mission_rank_feedback_v1',
};

const DEFAULT_ALARM: AlarmPreferences = {
  enabled: true,
  volume: 60,
  sound: 'Soft bell',
  vibration: false,
  autoStopSeconds: 5,
};

const DEFAULT_REMINDERS: ReminderSettings = {
  dailyPlanReminder: true,
  taskStartReminder: true,
  leadTimeMinutes: 10,
  dailyWrapUpReminder: true,
  overdueReminder: true,
  reminderStyle: 'Gentle',
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  maxDailyFrequency: 3,
  browserNotificationsEnabled: false,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.length > 0 ? parsed : BUILT_IN_TEMPLATES;
      }
      return BUILT_IN_TEMPLATES;
    } catch {
      return BUILT_IN_TEMPLATES;
    }
  });

  const [activeFocusSession, setActiveFocusSession] = useState<ActiveFocusSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_FOCUS);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [completedFocusSessions, setCompletedFocusSessions] = useState<CompletedFocusSession[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FOCUS_SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [alarmPreferences, setAlarmPreferences] = useState<AlarmPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ALARM);
      return stored ? { ...DEFAULT_ALARM, ...JSON.parse(stored) } : DEFAULT_ALARM;
    } catch {
      return DEFAULT_ALARM;
    }
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      return stored ? { ...DEFAULT_REMINDERS, ...JSON.parse(stored) } : DEFAULT_REMINDERS;
    } catch {
      return DEFAULT_REMINDERS;
    }
  });

  const [dailyReviews, setDailyReviews] = useState<DailyReviewRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.DAILY_REVIEWS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReviewRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WEEKLY_REVIEWS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [mockTests, setMockTests] = useState<MockTestLog[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.MOCK_TESTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [currentView, setCurrentViewState] = useState<string>(() => {
    try {
      const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (!storedProfile) return 'welcome';
      const storedView = localStorage.getItem('mission_rank_active_view_v1');
      if (storedView) return storedView;
      return 'today';
    } catch {
      return 'today';
    }
  });

  const setCurrentView = useCallback((view: string) => {
    setCurrentViewState(view);
    try {
      localStorage.setItem('mission_rank_active_view_v1', view);
    } catch {
      // ignore
    }
  }, []);
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_FOCUS);
      return stored ? JSON.parse(stored).taskId : null;
    } catch {
      return null;
    }
  });
  const [lastSaved, setLastSaved] = useState<string>(() => new Date().toLocaleTimeString());
  const [hasBackup, setHasBackup] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(STORAGE_KEYS.BACKUP));
  });

  // Apply Theme & Reduced Motion
  useEffect(() => {
    const root = document.documentElement;
    if (profile?.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    if (profile?.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      document.body.style.backgroundColor = '#F7F8FC';
      document.body.style.color = '#172033';
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      document.body.style.backgroundColor = '#0B1020';
      document.body.style.color = '#F8FAFC';
    }
  }, [profile?.theme, profile?.reduceMotion]);

  // Sync to localStorage
  const persist = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      setLastSaved(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Storage write error:', e);
    }
  }, []);

  const saveProfile = useCallback((newProfile: StudentProfile) => {
    setProfile(newProfile);
    persist(STORAGE_KEYS.PROFILE, newProfile);

    // If initial creation, create starter tasks if no tasks exist
    if (tasks.length === 0) {
      const starter = generateStarterTasks(newProfile.targetExam);
      setTasks(starter);
      persist(STORAGE_KEYS.TASKS, starter);
    }
    setCurrentView('today');
  }, [tasks.length, persist]);

  const updateProfile = useCallback((updates: Partial<StudentProfile>) => {
    setProfile(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      persist(STORAGE_KEYS.PROFILE, updated);
      return updated;
    });
  }, [persist]);

  const addTask = useCallback((taskData: Omit<Task, 'id' | 'createdDate'>): Task => {
    const today = getTodayDateString();
    let duration = taskData.plannedDurationMinutes;
    if (taskData.startTime && taskData.endTime) {
      duration = calculateDurationFromTimes(taskData.startTime, taskData.endTime);
    }

    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      plannedDurationMinutes: duration || 30,
      createdDate: today,
      status: taskData.status || 'Pending',
      currentCompletedValue: taskData.currentCompletedValue || 0,
      actualCompletedDurationMinutes: taskData.actualCompletedDurationMinutes || 0,
    };

    setTasks(prev => {
      const updated = [newTask, ...prev];
      persist(STORAGE_KEYS.TASKS, updated);
      return updated;
    });

    return newTask;
  }, [persist]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prev => {
      const updated = prev.map(t => {
        if (t.id !== taskId) return t;
        const merged = { ...t, ...updates };
        if (updates.startTime && updates.endTime) {
          merged.plannedDurationMinutes = calculateDurationFromTimes(updates.startTime, updates.endTime);
        }
        return merged;
      });
      persist(STORAGE_KEYS.TASKS, updated);
      return updated;
    });
  }, [persist]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const updated = prev.filter(t => t.id !== taskId);
      persist(STORAGE_KEYS.TASKS, updated);
      return updated;
    });

    if (activeFocusSession?.taskId === taskId) {
      setActiveFocusSession(null);
      setActiveFocusTaskId(null);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_FOCUS);
      stopAlarmLoop();
    }
  }, [activeFocusSession?.taskId, persist]);

  const duplicateTask = useCallback((taskId: string): Task => {
    const original = tasks.find(t => t.id === taskId);
    if (!original) throw new Error('Task not found');
    const { id, createdDate, completedDate, ...rest } = original;
    const duplicated = addTask({
      ...rest,
      title: `${original.title} (Copy)`,
      status: 'Pending',
      currentCompletedValue: 0,
      actualCompletedDurationMinutes: 0,
    });
    return duplicated;
  }, [tasks, addTask]);

  const splitTask = useCallback((taskId: string, part1Target: number, part2Target: number, part2Date?: string) => {
    const original = tasks.find(t => t.id === taskId);
    if (!original) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultPart2Date = tomorrow.toISOString().split('T')[0];

    // Part 1 remains as original task with part1Target
    updateTask(taskId, {
      targetValue: part1Target,
      notes: `${original.notes ? original.notes + '\n' : ''}[Split Part 1]`,
    });

    // Part 2 is created as follow-up
    addTask({
      title: `${original.title} (Part 2)`,
      subject: original.subject,
      subtopic: original.subtopic,
      category: original.category,
      taskType: original.taskType,
      priority: original.priority,
      plannedDate: part2Date || defaultPart2Date,
      isFlexible: true,
      plannedDurationMinutes: Math.round(original.plannedDurationMinutes / 2),
      reminderLeadMinutes: original.reminderLeadMinutes,
      targetValue: part2Target,
      targetUnit: original.targetUnit,
      currentCompletedValue: 0,
      accuracyTarget: original.accuracyTarget,
      difficulty: original.difficulty,
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      notes: `Split from: ${original.title}`,
      parentTaskId: original.id,
    });
  }, [tasks, updateTask, addTask]);

  const rescheduleTask = useCallback((taskId: string, newDate: string, newStartTime?: string, newEndTime?: string) => {
    let duration: number | undefined = undefined;
    if (newStartTime && newEndTime) {
      const calc = calculateDurationFromTimes(newStartTime, newEndTime);
      if (calc > 0) duration = calc;
    }
    updateTask(taskId, {
      plannedDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      plannedDurationMinutes: duration,
      isFlexible: !newStartTime,
      status: 'Pending',
    });
  }, [updateTask]);

  const skipTask = useCallback((taskId: string, reason?: string) => {
    updateTask(taskId, {
      status: 'Skipped',
      skippedReason: reason || 'Skipped intentionally by student',
    });
  }, [updateTask]);

  const completeTask = useCallback((
    taskId: string,
    completedValue: number,
    attempted?: number,
    correct?: number,
    actualDurationMinutes?: number,
    difficulty?: 'Easy' | 'Medium' | 'Hard'
  ) => {
    const today = getTodayDateString();
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let accuracy: number | undefined = undefined;
    if (attempted && attempted > 0 && correct !== undefined) {
      accuracy = Math.round((Math.min(correct, attempted) / attempted) * 100 * 10) / 10;
    }

    const isReverting = completedValue === 0;
    const isPartial = !isReverting && task.targetValue > 0 && completedValue < task.targetValue;
    const newStatus = isReverting ? 'Pending' : isPartial ? 'Partially complete' : 'Completed';

    updateTask(taskId, {
      currentCompletedValue: completedValue,
      attemptedQuestions: attempted,
      correctAnswers: correct,
      calculatedAccuracy: accuracy,
      actualCompletedDurationMinutes: actualDurationMinutes ?? task.plannedDurationMinutes,
      difficulty: difficulty ?? task.difficulty,
      status: newStatus,
      completedDate: newStatus === 'Completed' ? today : undefined,
    });
  }, [tasks, updateTask]);

  // Focus Session Management
  const startFocusSession = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSession: ActiveFocusSession = {
      taskId,
      startTimestamp: Date.now(),
      isPaused: false,
      accumulatedActiveSeconds: 0,
      plannedDurationMinutes: task.plannedDurationMinutes || 25,
      currentTargetProgress: task.currentCompletedValue || 0,
      attemptedQuestions: task.attemptedQuestions,
      correctAnswers: task.correctAnswers,
    };

    setActiveFocusSession(newSession);
    setActiveFocusTaskId(taskId);
    persist(STORAGE_KEYS.ACTIVE_FOCUS, newSession);
    setCurrentView('focus');
  }, [tasks, persist]);

  const pauseFocusSession = useCallback(() => {
    setActiveFocusSession(prev => {
      if (!prev || prev.isPaused) return prev;
      const now = Date.now();
      const elapsedSinceStart = Math.floor((now - prev.startTimestamp) / 1000);
      const updated: ActiveFocusSession = {
        ...prev,
        isPaused: true,
        pauseTimestamp: now,
        accumulatedActiveSeconds: prev.accumulatedActiveSeconds + elapsedSinceStart,
      };
      persist(STORAGE_KEYS.ACTIVE_FOCUS, updated);
      return updated;
    });
  }, [persist]);

  const resumeFocusSession = useCallback(() => {
    setActiveFocusSession(prev => {
      if (!prev || !prev.isPaused) return prev;
      const updated: ActiveFocusSession = {
        ...prev,
        isPaused: false,
        startTimestamp: Date.now(),
        pauseTimestamp: undefined,
      };
      persist(STORAGE_KEYS.ACTIVE_FOCUS, updated);
      return updated;
    });
  }, [persist]);

  const addFocusMinutes = useCallback((minutes: number) => {
    setActiveFocusSession(prev => {
      if (!prev) return null;
      const updated: ActiveFocusSession = {
        ...prev,
        plannedDurationMinutes: prev.plannedDurationMinutes + minutes,
      };
      persist(STORAGE_KEYS.ACTIVE_FOCUS, updated);
      return updated;
    });
  }, [persist]);

  const updateSessionTargetProgress = useCallback((achieved: number, attempted?: number, correct?: number) => {
    setActiveFocusSession(prev => {
      if (!prev) return null;
      const updated: ActiveFocusSession = {
        ...prev,
        currentTargetProgress: achieved,
        attemptedQuestions: attempted,
        correctAnswers: correct,
      };
      persist(STORAGE_KEYS.ACTIVE_FOCUS, updated);
      return updated;
    });

    if (activeFocusTaskId) {
      updateTask(activeFocusTaskId, {
        currentCompletedValue: achieved,
        attemptedQuestions: attempted,
        correctAnswers: correct,
      });
    }
  }, [activeFocusTaskId, updateTask, persist]);

  const endFocusSession = useCallback((
    markComplete: boolean = false,
    finalTargetAchieved?: number,
    attempted?: number,
    correct?: number
  ) => {
    if (!activeFocusSession) return;
    stopAlarmLoop();

    const now = Date.now();
    let totalSeconds = activeFocusSession.accumulatedActiveSeconds;
    if (!activeFocusSession.isPaused) {
      totalSeconds += Math.floor((now - activeFocusSession.startTimestamp) / 1000);
    }
    const totalMinutes = Math.max(1, Math.round(totalSeconds / 60));

    const task = tasks.find(t => t.id === activeFocusSession.taskId);
    const achieved = finalTargetAchieved !== undefined ? finalTargetAchieved : activeFocusSession.currentTargetProgress;
    const finalAttempted = attempted !== undefined ? attempted : activeFocusSession.attemptedQuestions;
    const finalCorrect = correct !== undefined ? correct : activeFocusSession.correctAnswers;

    let accuracy: number | undefined = undefined;
    if (finalAttempted && finalAttempted > 0 && finalCorrect !== undefined) {
      accuracy = Math.round((Math.min(finalCorrect, finalAttempted) / finalAttempted) * 100 * 10) / 10;
    }

    if (task) {
      const isPartial = task.targetValue > 0 && achieved < task.targetValue && !markComplete;
      const status = markComplete ? 'Completed' : isPartial ? 'Partially complete' : (achieved >= task.targetValue && task.targetValue > 0) ? 'Completed' : 'Pending';

      updateTask(task.id, {
        currentCompletedValue: achieved,
        attemptedQuestions: finalAttempted,
        correctAnswers: finalCorrect,
        calculatedAccuracy: accuracy,
        actualCompletedDurationMinutes: (task.actualCompletedDurationMinutes || 0) + totalMinutes,
        status,
        completedDate: status === 'Completed' ? getTodayDateString() : undefined,
      });

      // Save to completed focus sessions history
      const sessionRecord: CompletedFocusSession = {
        id: `foc-${Date.now()}`,
        taskId: task.id,
        taskTitle: task.title,
        subject: task.subject,
        startTime: new Date(now - totalSeconds * 1000).toISOString(),
        endTime: new Date(now).toISOString(),
        durationSeconds: totalSeconds,
        targetAchieved: achieved,
        attemptedQuestions: finalAttempted,
        correctAnswers: finalCorrect,
        accuracy,
        date: getTodayDateString(),
      };

      setCompletedFocusSessions(prev => {
        const updated = [sessionRecord, ...prev];
        persist(STORAGE_KEYS.FOCUS_SESSIONS, updated);
        return updated;
      });
    }

    setActiveFocusSession(null);
    setActiveFocusTaskId(null);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_FOCUS);
  }, [activeFocusSession, tasks, updateTask, persist]);

  // Templates
  const saveTemplate = useCallback((templateData: Omit<TaskTemplate, 'id'>) => {
    const newTemplate: TaskTemplate = {
      ...templateData,
      id: `tmpl-custom-${Date.now()}`,
      isCustom: true,
    };
    setTemplates(prev => {
      const updated = [...prev, newTemplate];
      persist(STORAGE_KEYS.TEMPLATES, updated);
      return updated;
    });
  }, [persist]);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => {
      const updated = prev.filter(t => t.id !== templateId);
      persist(STORAGE_KEYS.TEMPLATES, updated);
      return updated;
    });
  }, [persist]);

  // Preferences
  const updateAlarmPreferences = useCallback((updates: Partial<AlarmPreferences>) => {
    setAlarmPreferences(prev => {
      const updated = { ...prev, ...updates };
      persist(STORAGE_KEYS.ALARM, updated);
      return updated;
    });
  }, [persist]);

  const updateReminderSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setReminderSettings(prev => {
      const updated = { ...prev, ...updates };
      persist(STORAGE_KEYS.REMINDERS, updated);
      return updated;
    });
  }, [persist]);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      updateReminderSettings({ browserNotificationsEnabled: granted });
      return granted;
    } catch {
      return false;
    }
  }, [updateReminderSettings]);

  // Reviews & Mock tests
  const submitDailyReview = useCallback((reviewData: Omit<DailyReviewRecord, 'id' | 'createdAt'>) => {
    const newReview: DailyReviewRecord = {
      ...reviewData,
      id: `drev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setDailyReviews(prev => {
      const updated = [newReview, ...prev.filter(r => r.date !== reviewData.date)];
      persist(STORAGE_KEYS.DAILY_REVIEWS, updated);
      return updated;
    });
  }, [persist]);

  const submitWeeklyReview = useCallback((reviewData: Omit<WeeklyReviewRecord, 'id' | 'createdAt'>) => {
    const newReview: WeeklyReviewRecord = {
      ...reviewData,
      id: `wrev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWeeklyReviews(prev => {
      const updated = [newReview, ...prev.filter(r => r.weekStartDate !== reviewData.weekStartDate)];
      persist(STORAGE_KEYS.WEEKLY_REVIEWS, updated);
      return updated;
    });
  }, [persist]);

  const addMockTestLog = useCallback((logData: Omit<MockTestLog, 'id'>) => {
    const newLog: MockTestLog = {
      ...logData,
      id: `mock-${Date.now()}`,
    };
    setMockTests(prev => {
      const updated = [newLog, ...prev];
      persist(STORAGE_KEYS.MOCK_TESTS, updated);
      return updated;
    });
  }, [persist]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Export / Import / Backup
  const exportData = useCallback((): string => {
    const data: AppStateExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      tasks,
      templates,
      focusSessions: completedFocusSessions,
      dailyReviews,
      weeklyReviews,
      alarmPreferences,
      reminderSettings,
      mockTests,
    };
    return JSON.stringify(data, null, 2);
  }, [profile, tasks, templates, completedFocusSessions, dailyReviews, weeklyReviews, alarmPreferences, reminderSettings, mockTests]);

  const validateImportJson = useCallback((jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'File is not a valid JSON object.' };
      }
      if (!Array.isArray(data.tasks)) {
        return { valid: false, error: 'Missing or invalid tasks array in backup.' };
      }

      const preview = {
        studentName: data.profile?.firstName || 'Unknown',
        taskCount: data.tasks.length,
        focusSessionsCount: data.focusSessions?.length || 0,
        exportedAt: data.exportedAt || 'Unknown date',
      };

      return { valid: true, preview, data: data as AppStateExport };
    } catch {
      return { valid: false, error: 'Malformed JSON syntax. Please check the backup file.' };
    }
  }, []);

  const importData = useCallback((importedData: AppStateExport): boolean => {
    try {
      // 1. Save automatic backup before destructive import
      const currentBackup = exportData();
      localStorage.setItem(STORAGE_KEYS.BACKUP, currentBackup);
      setHasBackup(true);

      // 2. Set restored states
      if (importedData.profile) {
        setProfile(importedData.profile);
        persist(STORAGE_KEYS.PROFILE, importedData.profile);
      }
      if (Array.isArray(importedData.tasks)) {
        // Validate / sanitize tasks
        const sanitizedTasks = importedData.tasks.map(t => ({
          ...t,
          targetValue: Math.max(0, Number(t.targetValue) || 0),
          currentCompletedValue: Math.max(0, Number(t.currentCompletedValue) || 0),
          plannedDurationMinutes: Math.max(1, Number(t.plannedDurationMinutes) || 30),
        }));
        setTasks(sanitizedTasks);
        persist(STORAGE_KEYS.TASKS, sanitizedTasks);
      }
      if (Array.isArray(importedData.templates)) {
        setTemplates(importedData.templates);
        persist(STORAGE_KEYS.TEMPLATES, importedData.templates);
      }
      if (Array.isArray(importedData.focusSessions)) {
        setCompletedFocusSessions(importedData.focusSessions);
        persist(STORAGE_KEYS.FOCUS_SESSIONS, importedData.focusSessions);
      }
      if (importedData.alarmPreferences) {
        setAlarmPreferences(importedData.alarmPreferences);
        persist(STORAGE_KEYS.ALARM, importedData.alarmPreferences);
      }
      if (importedData.reminderSettings) {
        setReminderSettings(importedData.reminderSettings);
        persist(STORAGE_KEYS.REMINDERS, importedData.reminderSettings);
      }
      if (Array.isArray(importedData.dailyReviews)) {
        setDailyReviews(importedData.dailyReviews);
        persist(STORAGE_KEYS.DAILY_REVIEWS, importedData.dailyReviews);
      }
      if (Array.isArray(importedData.weeklyReviews)) {
        setWeeklyReviews(importedData.weeklyReviews);
        persist(STORAGE_KEYS.WEEKLY_REVIEWS, importedData.weeklyReviews);
      }
      if (Array.isArray(importedData.mockTests)) {
        setMockTests(importedData.mockTests);
        persist(STORAGE_KEYS.MOCK_TESTS, importedData.mockTests);
      }

      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }, [exportData, persist]);

  const restoreLatestBackup = useCallback((): boolean => {
    try {
      const storedBackup = localStorage.getItem(STORAGE_KEYS.BACKUP);
      if (!storedBackup) return false;
      const { valid, data } = validateImportJson(storedBackup);
      if (valid && data) {
        return importData(data);
      }
      return false;
    } catch {
      return false;
    }
  }, [validateImportJson, importData]);

  const clearAllData = useCallback(() => {
    stopAlarmLoop();
    localStorage.clear();
    setProfile(null);
    setTasks([]);
    setTemplates(BUILT_IN_TEMPLATES);
    setActiveFocusSession(null);
    setActiveFocusTaskId(null);
    setCompletedFocusSessions([]);
    setDailyReviews([]);
    setWeeklyReviews([]);
    setMockTests([]);
    setNotifications([]);
    setCurrentView('welcome');
    setHasBackup(false);
  }, []);

  const sendFeedbackLocally = useCallback((feedback: Omit<FeedbackSubmission, 'id' | 'timestamp' | 'page' | 'userAgent'>): boolean => {
    try {
      const submission: FeedbackSubmission = {
        ...feedback,
        id: `fb-${Date.now()}`,
        timestamp: new Date().toISOString(),
        page: currentView,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };
      const existing = localStorage.getItem(STORAGE_KEYS.FEEDBACK);
      const list = existing ? JSON.parse(existing) : [];
      list.push(submission);
      localStorage.setItem(STORAGE_KEYS.FEEDBACK, JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  }, [currentView]);

  return (
    <AppContext.Provider
      value={{
        profile,
        tasks,
        templates,
        activeFocusSession,
        completedFocusSessions,
        alarmPreferences,
        reminderSettings,
        dailyReviews,
        weeklyReviews,
        mockTests,
        notifications,
        currentView,
        setCurrentView,
        activeFocusTaskId,
        setActiveFocusTaskId,
        lastSaved,
        saveProfile,
        updateProfile,
        addTask,
        updateTask,
        deleteTask,
        duplicateTask,
        splitTask,
        rescheduleTask,
        skipTask,
        completeTask,
        startFocusSession,
        pauseFocusSession,
        resumeFocusSession,
        endFocusSession,
        addFocusMinutes,
        updateSessionTargetProgress,
        saveTemplate,
        deleteTemplate,
        updateAlarmPreferences,
        updateReminderSettings,
        requestNotificationPermission,
        submitDailyReview,
        submitWeeklyReview,
        addMockTestLog,
        dismissNotification,
        exportData,
        validateImportJson,
        importData,
        restoreLatestBackup,
        hasBackup,
        clearAllData,
        sendFeedbackLocally,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
