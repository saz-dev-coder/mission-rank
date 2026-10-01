import { Task, TaskTemplate, SubjectType, ExamType, TargetUnit, TaskType } from '../types';
import { getTodayDateString } from './dateUtils';

export const ENGLISH_SUBTOPICS = [
  'Vocabulary',
  'Grammar',
  'Error spotting',
  'Fill in the blanks',
  'Cloze test',
  'Reading comprehension',
  'Sentence improvement',
  'Synonyms and antonyms',
  'Idioms and phrases',
  'One-word substitution',
  'Active/passive voice',
  'Direct/indirect speech',
  'Spelling',
  'Para jumbles',
  'Previous-year questions',
  'Revision',
  'Other',
];

export const QUANT_SUBTOPICS = [
  'Percentage',
  'Profit & Loss',
  'Ratio & Proportion',
  'Time & Work',
  'Time, Speed & Distance',
  'Algebra',
  'Trigonometry',
  'Geometry',
  'Mensuration',
  'Number System',
  'Data Interpretation',
  'Simple & Compound Interest',
  'Averages',
  'Mixtures & Alligation',
  'Formulas Revision',
];

export const REASONING_SUBTOPICS = [
  'Coding-Decoding',
  'Analogy',
  'Classification',
  'Blood Relations',
  'Direction Sense',
  'Syllogism',
  'Series (Number/Alphabet)',
  'Non-Verbal & Pattern',
  'Matrix & Order Ranking',
  'Critical Reasoning',
  'Puzzles & Seating Arrangement',
];

export const GK_SUBTOPICS = [
  'Modern History',
  'Ancient & Medieval History',
  'Indian Polity & Constitution',
  'Physical & Indian Geography',
  'General Science (Bio/Chem/Physics)',
  'Indian Economy',
  'Current Affairs',
  'Static GK & Culture',
];

export const COMPUTER_SUBTOPICS = [
  'Basics of Computer & Hardware',
  'Operating Systems & Windows',
  'MS Word & Excel Shortcuts',
  'Internet & Networking',
  'Cyber Security & Viruses',
];

export function getSubtopicsForSubject(subject: SubjectType): string[] {
  switch (subject) {
    case 'English':
      return ENGLISH_SUBTOPICS;
    case 'Quant':
      return QUANT_SUBTOPICS;
    case 'Reasoning':
      return REASONING_SUBTOPICS;
    case 'General Awareness':
      return GK_SUBTOPICS;
    case 'Computer':
      return COMPUTER_SUBTOPICS;
    default:
      return ['General Practice', 'Chapter Revision', 'PYQ Solving', 'Mixed Questions'];
  }
}

export function getDefaultSuggestionsForSubject(subject: SubjectType, subtopic?: string): {
  taskType: TaskType;
  targetUnit: TargetUnit;
  targetValue: number;
  durationMinutes: number;
} {
  if (subject === 'English') {
    if (subtopic === 'Vocabulary' || subtopic === 'Synonyms and antonyms' || subtopic === 'Idioms and phrases' || subtopic === 'One-word substitution') {
      return { taskType: 'Learn', targetUnit: 'Words', targetValue: 50, durationMinutes: 45 };
    }
    if (subtopic === 'Error spotting' || subtopic === 'Grammar' || subtopic === 'Sentence improvement') {
      return { taskType: 'Practice', targetUnit: 'Questions', targetValue: 30, durationMinutes: 30 };
    }
    if (subtopic === 'Reading comprehension') {
      return { taskType: 'Practice', targetUnit: 'Passages', targetValue: 3, durationMinutes: 35 };
    }
    if (subtopic === 'Cloze test') {
      return { taskType: 'Practice', targetUnit: 'Sets', targetValue: 4, durationMinutes: 25 };
    }
    return { taskType: 'Practice', targetUnit: 'Questions', targetValue: 25, durationMinutes: 30 };
  }

  if (subject === 'Quant') {
    if (subtopic === 'Formulas Revision') {
      return { taskType: 'Revise', targetUnit: 'Minutes', targetValue: 20, durationMinutes: 20 };
    }
    return { taskType: 'Practice', targetUnit: 'Questions', targetValue: 25, durationMinutes: 40 };
  }

  if (subject === 'Reasoning') {
    return { taskType: 'Practice', targetUnit: 'Questions', targetValue: 20, durationMinutes: 30 };
  }

  if (subject === 'General Awareness') {
    return { taskType: 'Revise', targetUnit: 'Topics', targetValue: 1, durationMinutes: 25 };
  }

  if (subject === 'Mock Test') {
    return { taskType: 'Mock test', targetUnit: 'Mocks', targetValue: 1, durationMinutes: 90 };
  }

  return { taskType: 'Practice', targetUnit: 'Questions', targetValue: 20, durationMinutes: 30 };
}

export const BUILT_IN_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tmpl-quant-practice',
    title: 'Quant practice',
    subject: 'Quant',
    subtopic: 'Percentage',
    taskType: 'Practice',
    priority: 'Must do',
    durationMinutes: 40,
    targetValue: 25,
    targetUnit: 'Questions',
    accuracyTarget: 80,
    isCustom: false,
  },
  {
    id: 'tmpl-english-errors',
    title: 'English error spotting',
    subject: 'English',
    subtopic: 'Error spotting',
    taskType: 'Practice',
    priority: 'Should do',
    durationMinutes: 30,
    targetValue: 30,
    targetUnit: 'Questions',
    accuracyTarget: 75,
    isCustom: false,
  },
  {
    id: 'tmpl-reasoning-set',
    title: 'Reasoning timed set',
    subject: 'Reasoning',
    subtopic: 'Coding-Decoding',
    taskType: 'Practice',
    priority: 'Should do',
    durationMinutes: 30,
    targetValue: 20,
    targetUnit: 'Questions',
    accuracyTarget: 85,
    isCustom: false,
  },
  {
    id: 'tmpl-gk-revision',
    title: 'GK revision',
    subject: 'General Awareness',
    subtopic: 'Modern History',
    taskType: 'Revise',
    priority: 'Optional',
    durationMinutes: 25,
    targetValue: 1,
    targetUnit: 'Topics',
    isCustom: false,
  },
  {
    id: 'tmpl-vocab-rev',
    title: 'Vocabulary revision',
    subject: 'English',
    subtopic: 'Vocabulary',
    taskType: 'Learn',
    priority: 'Must do',
    durationMinutes: 20,
    targetValue: 30,
    targetUnit: 'Words',
    isCustom: false,
  },
  {
    id: 'tmpl-full-mock',
    title: 'Full mock test',
    subject: 'Mock Test',
    subtopic: 'Full Length Test',
    taskType: 'Mock test',
    priority: 'Must do',
    durationMinutes: 90,
    targetValue: 1,
    targetUnit: 'Mocks',
    accuracyTarget: 80,
    isCustom: false,
  },
  {
    id: 'tmpl-mock-analysis',
    title: 'Mock analysis',
    subject: 'Mock Test',
    subtopic: 'Mistake Diary & Analysis',
    taskType: 'Mock analysis',
    priority: 'Must do',
    durationMinutes: 45,
    targetValue: 15,
    targetUnit: 'Mistakes reviewed',
    isCustom: false,
  },
  {
    id: 'tmpl-formula-rev',
    title: 'Formula revision',
    subject: 'Quant',
    subtopic: 'Formulas Revision',
    taskType: 'Revise',
    priority: 'Optional',
    durationMinutes: 20,
    targetValue: 20,
    targetUnit: 'Minutes',
    isCustom: false,
  },
  {
    id: 'tmpl-typing-practice',
    title: 'Typing practice',
    subject: 'Computer',
    subtopic: 'Typing speed test',
    taskType: 'Typing practice',
    priority: 'Optional',
    durationMinutes: 30,
    targetValue: 30,
    targetUnit: 'Minutes',
    accuracyTarget: 95,
    isCustom: false,
  },
];

export function generateStarterTasks(exam: ExamType): Task[] {
  const today = getTodayDateString();

  return [
    {
      id: 'task-starter-1',
      title: 'Quant: Percentage practice',
      subject: 'Quant',
      subtopic: 'Percentage',
      category: 'regular',
      taskType: 'Practice',
      priority: 'Must do',
      plannedDate: today,
      startTime: '17:00',
      endTime: '17:40',
      plannedDurationMinutes: 40,
      isFlexible: false,
      reminderLeadMinutes: 10,
      targetValue: 25,
      targetUnit: 'Questions',
      currentCompletedValue: 0,
      accuracyTarget: 80,
      difficulty: 'Medium',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
      notes: 'Focus on calculation speed and fraction-to-percentage conversions.',
    },
    {
      id: 'task-starter-2',
      title: 'English: Error spotting practice',
      subject: 'English',
      subtopic: 'Error spotting',
      category: 'regular',
      taskType: 'Practice',
      priority: 'Should do',
      plannedDate: today,
      startTime: '18:00',
      endTime: '18:30',
      plannedDurationMinutes: 30,
      isFlexible: false,
      reminderLeadMinutes: 10,
      targetValue: 30,
      targetUnit: 'Questions',
      currentCompletedValue: 0,
      accuracyTarget: 75,
      difficulty: 'Medium',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
      notes: 'Review subject-verb agreement and preposition rules.',
    },
    {
      id: 'task-starter-3',
      title: 'Reasoning: Coding-decoding practice',
      subject: 'Reasoning',
      subtopic: 'Coding-Decoding',
      category: 'regular',
      taskType: 'Practice',
      priority: 'Should do',
      plannedDate: today,
      startTime: '19:00',
      endTime: '19:30',
      plannedDurationMinutes: 30,
      isFlexible: false,
      reminderLeadMinutes: 10,
      targetValue: 20,
      targetUnit: 'Questions',
      currentCompletedValue: 0,
      accuracyTarget: 85,
      difficulty: 'Medium',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
    },
    {
      id: 'task-starter-4',
      title: 'General Awareness: Modern History revision',
      subject: 'General Awareness',
      subtopic: 'Modern History',
      category: 'regular',
      taskType: 'Revise',
      priority: 'Optional',
      plannedDate: today,
      startTime: '20:00',
      endTime: '20:25',
      plannedDurationMinutes: 25,
      isFlexible: true,
      reminderLeadMinutes: 10,
      targetValue: 1,
      targetUnit: 'Topics',
      currentCompletedValue: 0,
      difficulty: 'Easy',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
      notes: '1857 Revolt & Governor Generals chronology.',
    },
    {
      id: 'task-starter-5',
      title: 'Mock Test: Sectional Speed Test',
      subject: 'Mock Test',
      subtopic: `${exam} Tier-1 Sectional`,
      category: 'regular',
      taskType: 'Mock test',
      priority: 'Must do',
      plannedDate: today,
      isFlexible: true,
      plannedDurationMinutes: 60,
      reminderLeadMinutes: 10,
      targetValue: 1,
      targetUnit: 'Mocks',
      currentCompletedValue: 0,
      accuracyTarget: 80,
      difficulty: 'Hard',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
      notes: 'Take test in exam conditions without interruptions.',
    },
    {
      id: 'task-starter-6',
      title: 'Mock Analysis: Mistake Review & Notes',
      subject: 'Mock Test',
      subtopic: 'Mock-Analysis',
      category: 'regular',
      taskType: 'Mock analysis',
      priority: 'Must do',
      plannedDate: today,
      isFlexible: true,
      plannedDurationMinutes: 45,
      reminderLeadMinutes: 10,
      targetValue: 15,
      targetUnit: 'Mistakes reviewed',
      currentCompletedValue: 0,
      difficulty: 'Medium',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
      notes: 'Log wrong attempts and unattempted questions in error diary.',
    },
    {
      id: 'task-starter-avail',
      title: 'Study Window: Evening Focus Block',
      subject: 'Other',
      category: 'availability_block',
      taskType: 'Other',
      priority: 'Optional',
      plannedDate: today,
      startTime: '16:30',
      endTime: '21:30',
      plannedDurationMinutes: 300,
      isFlexible: false,
      reminderLeadMinutes: 0,
      targetValue: 0,
      targetUnit: 'Minutes',
      currentCompletedValue: 0,
      difficulty: 'Easy',
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      createdDate: today,
      notes: 'Reserved dedicated study time window.',
    },
  ];
}
