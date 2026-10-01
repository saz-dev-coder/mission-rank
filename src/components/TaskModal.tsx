import React, { useState, useEffect, useMemo } from 'react';
import { 
  Task, 
  SubjectType, 
  Priority, 
  TaskType, 
  TargetUnit, 
  TaskCategory, 
  TaskDifficulty 
} from '../types';
import { useApp } from '../context/AppContext';
import { 
  getSubtopicsForSubject, 
  getDefaultSuggestionsForSubject 
} from '../utils/starterData';
import { 
  getTodayDateString, 
  calculateDurationFromTimes, 
  checkTimeOverlap, 
  formatTime12h 
} from '../utils/dateUtils';
import { 
  X, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Target, 
  Bookmark, 
  Check,
  Calendar,
  Layers
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
  initialDate?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDate,
}) => {
  const { tasks, addTask, updateTask, saveTemplate } = useApp();

  const isEditing = Boolean(taskToEdit);

  // Form states
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectType>('Quant');
  const [category, setCategory] = useState<TaskCategory>('regular');
  const [subtopic, setSubtopic] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('Practice');
  const [priority, setPriority] = useState<Priority>('Must do');
  const [plannedDate, setPlannedDate] = useState(initialDate || getTodayDateString());
  const [isFlexible, setIsFlexible] = useState(false);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('17:45');
  const [durationMinutes, setDurationMinutes] = useState(45);
  
  // Target
  const [hasTarget, setHasTarget] = useState(true);
  const [targetValue, setTargetValue] = useState(25);
  const [targetUnit, setTargetUnit] = useState<TargetUnit>('Questions');
  const [accuracyTarget, setAccuracyTarget] = useState<number | undefined>(80);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('Medium');
  const [notes, setNotes] = useState('');
  const [reminderLeadMinutes, setReminderLeadMinutes] = useState(10);

  // UI helpers
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [templateSavedSuccess, setTemplateSavedSuccess] = useState(false);

  // Reset or fill form when modal opens or taskToEdit changes
  useEffect(() => {
    if (!isOpen) return;

    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setSubject(taskToEdit.subject);
      setCategory(taskToEdit.category);
      setSubtopic(taskToEdit.subtopic || '');
      setTaskType(taskToEdit.taskType);
      setPriority(taskToEdit.priority);
      setPlannedDate(taskToEdit.plannedDate);
      setIsFlexible(taskToEdit.isFlexible);
      setStartTime(taskToEdit.startTime || '17:00');
      setEndTime(taskToEdit.endTime || '17:45');
      setDurationMinutes(taskToEdit.plannedDurationMinutes || 45);
      setHasTarget(taskToEdit.targetValue > 0);
      setTargetValue(taskToEdit.targetValue || 25);
      setTargetUnit(taskToEdit.targetUnit || 'Questions');
      setAccuracyTarget(taskToEdit.accuracyTarget);
      setDifficulty(taskToEdit.difficulty);
      setNotes(taskToEdit.notes || '');
      setReminderLeadMinutes(taskToEdit.reminderLeadMinutes || 10);
    } else {
      // Default new task
      const defaultSubject: SubjectType = 'English';
      const defaultSubtopic = 'Vocabulary';
      const suggestions = getDefaultSuggestionsForSubject(defaultSubject, defaultSubtopic);

      setTitle('English: Vocabulary practice');
      setSubject(defaultSubject);
      setCategory('regular');
      setSubtopic(defaultSubtopic);
      setTaskType(suggestions.taskType);
      setPriority('Must do');
      setPlannedDate(initialDate || getTodayDateString());
      setIsFlexible(false);
      setStartTime('17:00');
      setEndTime('17:45');
      setDurationMinutes(45);
      setHasTarget(true);
      setTargetValue(suggestions.targetValue);
      setTargetUnit(suggestions.targetUnit);
      setAccuracyTarget(undefined);
      setDifficulty('Medium');
      setNotes('');
      setReminderLeadMinutes(10);
    }
    setErrors({});
    setTemplateSavedSuccess(false);
  }, [isOpen, taskToEdit, initialDate]);

  // Recalculate duration when start or end time changes
  useEffect(() => {
    if (!isFlexible && startTime && endTime) {
      const calculated = calculateDurationFromTimes(startTime, endTime);
      setDurationMinutes(calculated > 0 ? calculated : 0);
    }
  }, [startTime, endTime, isFlexible]);

  // Handle subject change: dynamically update subtopic and suggest sensible target/duration
  const handleSubjectChange = (newSubject: SubjectType) => {
    setSubject(newSubject);
    const subtopics = getSubtopicsForSubject(newSubject);
    const firstSub = subtopics[0] || '';
    setSubtopic(firstSub);

    const suggestions = getDefaultSuggestionsForSubject(newSubject, firstSub);
    setTaskType(suggestions.taskType);
    setTargetUnit(suggestions.targetUnit);
    setTargetValue(suggestions.targetValue);
    setDurationMinutes(suggestions.durationMinutes);

    // Default title suggestion
    if (!isEditing || title.includes(':')) {
      setTitle(`${newSubject}: ${firstSub}`);
    }
  };

  const handleSubtopicChange = (newSub: string) => {
    setSubtopic(newSub);
    const suggestions = getDefaultSuggestionsForSubject(subject, newSub);
    setTaskType(suggestions.taskType);
    setTargetUnit(suggestions.targetUnit);
    setTargetValue(suggestions.targetValue);
    if (!isEditing || title.includes(':')) {
      setTitle(`${subject}: ${newSub}`);
    }
  };

  // Overlap conflict detection
  const conflictingTask = useMemo(() => {
    if (isFlexible || category === 'availability_block' || !startTime || !endTime) {
      return null;
    }

    return tasks.find(t => {
      // Exclude self if editing
      if (taskToEdit && t.id === taskToEdit.id) return false;
      // Must be on the same date
      if (t.plannedDate !== plannedDate) return false;
      // Availability blocks NEVER conflict with tasks
      if (t.category === 'availability_block') return false;
      // Must be timed
      if (t.isFlexible || !t.startTime || !t.endTime) return false;
      // Skip completed or skipped tasks
      if (t.status === 'Completed' || t.status === 'Skipped') return false;

      return checkTimeOverlap(startTime, endTime, t.startTime, t.endTime);
    });
  }, [isFlexible, category, startTime, endTime, plannedDate, tasks, taskToEdit]);

  // Live Human-readable summary before saving
  const liveSummary = useMemo(() => {
    if (category === 'availability_block') {
      return `Availability Window • ${plannedDate} • ${formatTime12h(startTime)}–${formatTime12h(endTime)} (${durationMinutes}m)`;
    }

    const timePart = isFlexible 
      ? `Anytime (${durationMinutes}m)` 
      : `${formatTime12h(startTime)}–${formatTime12h(endTime)}`;
    
    const targetPart = hasTarget 
      ? `Target ${targetValue} ${targetUnit}` 
      : `Study ${durationMinutes} mins`;
      
    return `${subject} • ${subtopic || 'General'} • ${timePart} • ${targetPart} • ${priority}`;
  }, [category, plannedDate, startTime, endTime, durationMinutes, isFlexible, subject, subtopic, hasTarget, targetValue, targetUnit, priority]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!title.trim()) {
      errs.title = 'Task title is required.';
    }

    if (!isFlexible) {
      if (!startTime) errs.startTime = 'Start time is required.';
      if (!endTime) errs.endTime = 'End time is required.';
      if (startTime && endTime) {
        const diff = calculateDurationFromTimes(startTime, endTime);
        if (diff <= 0) {
          errs.endTime = 'End time must be after start time.';
        }
      }
    } else {
      if (durationMinutes <= 0) {
        errs.durationMinutes = 'Duration must be greater than 0 minutes.';
      }
    }

    if (hasTarget && targetValue <= 0) {
      errs.targetValue = 'Target must be greater than 0.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const taskPayload = {
      title: title.trim(),
      subject,
      subtopic: subtopic.trim(),
      category,
      taskType,
      priority,
      plannedDate,
      startTime: isFlexible ? undefined : startTime,
      endTime: isFlexible ? undefined : endTime,
      plannedDurationMinutes: durationMinutes,
      isFlexible,
      reminderLeadMinutes,
      targetValue: hasTarget ? targetValue : 0,
      targetUnit: hasTarget ? targetUnit : 'Minutes',
      currentCompletedValue: taskToEdit ? taskToEdit.currentCompletedValue : 0,
      accuracyTarget,
      difficulty,
      status: taskToEdit ? taskToEdit.status : 'Pending',
      actualCompletedDurationMinutes: taskToEdit ? taskToEdit.actualCompletedDurationMinutes : 0,
      notes: notes.trim(),
    };

    if (isEditing && taskToEdit) {
      updateTask(taskToEdit.id, taskPayload);
    } else {
      addTask(taskPayload);
    }

    onClose();
  };

  const handleSaveAsTemplate = () => {
    if (!title.trim()) {
      setErrors(prev => ({ ...prev, title: 'Title is required to save template.' }));
      return;
    }

    saveTemplate({
      title: title.trim(),
      subject,
      subtopic: subtopic.trim(),
      taskType,
      priority,
      durationMinutes,
      targetValue: hasTarget ? targetValue : 0,
      targetUnit: hasTarget ? targetUnit : 'Minutes',
      accuracyTarget,
    });

    setTemplateSavedSuccess(true);
    setTimeout(() => setTemplateSavedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-[#141C32] border border-[#273450] shadow-2xl text-slate-200 overflow-hidden card-depth-3d">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#273450] bg-[#0E1527]">
          <div>
            <h3 className="text-base font-bold text-white">
              {isEditing ? 'Edit Study Task' : 'Plan New Study Task'}
            </h3>
            <p className="text-xs text-slate-400">
              Customize subject, time blocks, and measurable targets
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Category Toggle: Regular Task vs Availability Window */}
          <div className="flex rounded-xl bg-[#0B1020] p-1 border border-[#273450]">
            <button
              type="button"
              onClick={() => setCategory('regular')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                category === 'regular'
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Study Task (Score & Target)
            </button>
            <button
              type="button"
              onClick={() => {
                setCategory('availability_block');
                setTitle('Study Window: Evening Study');
                setSubject('Other');
                setHasTarget(false);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                category === 'availability_block'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Study Window (Availability Block)
            </button>
          </div>

          {/* Task Title */}
          <div>
            <label htmlFor="taskTitle" className="block text-xs font-semibold text-slate-300 mb-1">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              id="taskTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. English: Error spotting practice"
              className={`w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border ${
                errors.title ? 'border-rose-500' : 'border-[#273450]'
              } text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors`}
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
          </div>

          {/* Subject & Subtopic Selection */}
          {category === 'regular' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="taskSubject" className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject <span className="text-rose-400">*</span>
                </label>
                <select
                  id="taskSubject"
                  value={subject}
                  onChange={(e) => handleSubjectChange(e.target.value as SubjectType)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Quant">Quant (Mathematics)</option>
                  <option value="English">English Language</option>
                  <option value="Reasoning">General Intelligence & Reasoning</option>
                  <option value="General Awareness">General Awareness / GK</option>
                  <option value="Computer">Computer Knowledge</option>
                  <option value="Mock Test">Mock Test / Analysis</option>
                  <option value="Revision">Revision</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="taskSubtopic" className="block text-xs font-semibold text-slate-300 mb-1">
                  Topic / Subtopic
                </label>
                <select
                  id="taskSubtopic"
                  value={subtopic}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {getSubtopicsForSubject(subject).map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Priority & Task Type */}
          {category === 'regular' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="taskPriority" className="block text-xs font-semibold text-slate-300 mb-1">
                  Priority <span className="text-rose-400">*</span>
                </label>
                <select
                  id="taskPriority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Must do">Must do (Highest Weight - 45% of score)</option>
                  <option value="Should do">Should do (Medium Priority)</option>
                  <option value="Optional">Optional (Bonus / Low Priority)</option>
                </select>
              </div>

              <div>
                <label htmlFor="taskType" className="block text-xs font-semibold text-slate-300 mb-1">
                  Task Type
                </label>
                <select
                  id="taskType"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value as TaskType)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Learn">Learn (New topic / concepts)</option>
                  <option value="Practice">Practice (Questions / Sets)</option>
                  <option value="Revise">Revise (Review formulas / notes)</option>
                  <option value="Mock test">Mock test (Timed test)</option>
                  <option value="Mock analysis">Mock analysis (Mistake diary)</option>
                  <option value="Typing practice">Typing practice</option>
                  <option value="Notes">Notes making</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Planned Date */}
          <div>
            <label htmlFor="taskDate" className="block text-xs font-semibold text-slate-300 mb-1">
              Planned Date <span className="text-rose-400">*</span>
            </label>
            <input
              id="taskDate"
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Time Scheduling Mode */}
          <div className="p-3.5 rounded-xl bg-[#0B1020]/60 border border-[#273450] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-400" />
                Time Block Scheduling
              </span>

              {category === 'regular' && (
                <div className="flex items-center gap-2">
                  <label htmlFor="flexibleToggle" className="text-xs text-slate-400 cursor-pointer">
                    Anytime today (flexible)
                  </label>
                  <input
                    id="flexibleToggle"
                    type="checkbox"
                    checked={isFlexible}
                    onChange={(e) => setIsFlexible(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {!isFlexible ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="startTime" className="block text-[11px] font-medium text-slate-400 mb-1">
                    Start Time (24h)
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg bg-[#141C32] border ${
                      errors.startTime ? 'border-rose-500' : 'border-[#273450]'
                    } text-white text-xs font-mono-numbers`}
                  />
                  {errors.startTime && <p className="text-[10px] text-rose-400">{errors.startTime}</p>}
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-[11px] font-medium text-slate-400 mb-1">
                    End Time (24h)
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`w-full px-3 py-1.5 rounded-lg bg-[#141C32] border ${
                      errors.endTime ? 'border-rose-500' : 'border-[#273450]'
                    } text-white text-xs font-mono-numbers`}
                  />
                  {errors.endTime && <p className="text-[10px] text-rose-400">{errors.endTime}</p>}
                </div>

                <div className="col-span-2 flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>
                    Calculated duration:{' '}
                    <strong className={`font-mono-numbers ${durationMinutes > 0 ? 'text-white' : 'text-rose-400 font-semibold'}`}>
                      {durationMinutes > 0 ? `${durationMinutes} minutes` : 'Invalid time range'}
                    </strong>
                  </span>
                  <span>12-hour: {formatTime12h(startTime)} – {formatTime12h(endTime)}</span>
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="durationMinutes" className="block text-[11px] font-medium text-slate-400 mb-1">
                  Planned Study Duration (minutes)
                </label>
                <input
                  id="durationMinutes"
                  type="number"
                  min="5"
                  max="480"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(5, parseInt(e.target.value, 10) || 5))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                />
              </div>
            )}

            {/* Overlap Conflict Warning */}
            {conflictingTask && (
              <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Schedule Conflict Detected</p>
                    <p className="text-[11px] text-amber-300/80">
                      This overlaps with "{conflictingTask.title}" scheduled from {formatTime12h(conflictingTask.startTime || '')} to {formatTime12h(conflictingTask.endTime || '')}.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFlexible(true)}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium"
                  >
                    Make this task flexible
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (conflictingTask.endTime) {
                        setStartTime(conflictingTask.endTime);
                        // add 45m
                        const [eh, em] = conflictingTask.endTime.split(':').map(Number);
                        const endM = eh * 60 + em + 45;
                        const nh = Math.floor(endM / 60) % 24;
                        const nm = endM % 60;
                        setEndTime(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);
                      }
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium"
                  >
                    Move after conflicting task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Measurable Target Section */}
          {category === 'regular' && (
            <div className="p-3.5 rounded-xl bg-[#0B1020]/60 border border-[#273450] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-pink-400" />
                  Measurable Study Target
                </span>
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                  <span>Has target</span>
                  <input
                    type="checkbox"
                    checked={hasTarget}
                    onChange={(e) => setHasTarget(e.target.checked)}
                    className="w-4 h-4 rounded text-pink-600 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

              {hasTarget && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label htmlFor="targetValue" className="block text-[11px] font-medium text-slate-400 mb-1">
                      Target Count
                    </label>
                    <input
                      id="targetValue"
                      type="number"
                      min="1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                    />
                    {errors.targetValue && <p className="text-[10px] text-rose-400">{errors.targetValue}</p>}
                  </div>

                  <div>
                    <label htmlFor="targetUnit" className="block text-[11px] font-medium text-slate-400 mb-1">
                      Unit
                    </label>
                    <select
                      id="targetUnit"
                      value={targetUnit}
                      onChange={(e) => setTargetUnit(e.target.value as TargetUnit)}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs"
                    >
                      <option value="Words">Words (Vocabulary)</option>
                      <option value="Questions">Questions</option>
                      <option value="Passages">Passages (RC)</option>
                      <option value="Sets">Sets (Cloze/Puzzles)</option>
                      <option value="Topics">Topics (GK / Theory)</option>
                      <option value="Pages">Pages</option>
                      <option value="Minutes">Minutes</option>
                      <option value="Mocks">Mocks</option>
                      <option value="Mistakes reviewed">Mistakes reviewed</option>
                      <option value="Items">Items</option>
                      <option value="Custom">Custom unit</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="accuracyTarget" className="block text-[11px] font-medium text-slate-400 mb-1">
                      Target Accuracy (%)
                    </label>
                    <input
                      id="accuracyTarget"
                      type="number"
                      min="1"
                      max="100"
                      value={accuracyTarget ?? ''}
                      onChange={(e) => setAccuracyTarget(e.target.value ? Math.min(100, Math.max(1, parseInt(e.target.value, 10))) : undefined)}
                      placeholder="e.g. 80"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="taskNotes" className="block text-xs font-semibold text-slate-300 mb-1">
              Notes / Strategy (optional)
            </label>
            <input
              id="taskNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Focus on previous year questions from 2022-2024"
              className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
            />
          </div>

          {/* Live Human-Readable Plan Summary Banner */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-500/30 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block mb-1">
              Summary Preview
            </span>
            <p className="text-white font-medium">
              {liveSummary}
            </p>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#273450]">
            <div>
              {category === 'regular' && (
                <button
                  type="button"
                  onClick={handleSaveAsTemplate}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 px-2 rounded hover:bg-slate-800 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{templateSavedSuccess ? 'Saved as template!' : 'Save as personal template'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Add to Plan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
