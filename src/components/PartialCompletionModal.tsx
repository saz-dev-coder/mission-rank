import React, { useState } from 'react';
import { Task, TaskDifficulty } from '../types';
import { useApp } from '../context/AppContext';
import { addDaysToDateString, getTodayDateString } from '../utils/dateUtils';
import { X, Target, CheckCircle, ArrowRight, Calendar, AlertCircle } from 'lucide-react';

interface PartialCompletionModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onContinueFocus?: () => void;
}

export const PartialCompletionModal: React.FC<PartialCompletionModalProps> = ({
  task,
  isOpen,
  onClose,
  onContinueFocus,
}) => {
  const { completeTask, addTask, updateTask } = useApp();

  const [completedValue, setCompletedValue] = useState<number>(
    task.currentCompletedValue > 0 ? task.currentCompletedValue : task.targetValue || 1
  );
  const [attempted, setAttempted] = useState<number | undefined>(task.attemptedQuestions);
  const [correct, setCorrect] = useState<number | undefined>(task.correctAnswers);
  const [actualMinutes, setActualMinutes] = useState<number>(
    task.actualCompletedDurationMinutes || task.plannedDurationMinutes || 30
  );
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task.difficulty || 'Medium');
  const [customFollowUpDate, setCustomFollowUpDate] = useState<string>(
    addDaysToDateString(getTodayDateString(), 1)
  );

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetTotal = task.targetValue || 1;
  const isTargetUnder = completedValue < targetTotal;
  const remainingValue = Math.max(0, targetTotal - completedValue);

  // Calculate Accuracy
  let calculatedAccuracy: number | null = null;
  if (attempted && attempted > 0 && correct !== undefined) {
    calculatedAccuracy = Math.round((Math.min(correct, attempted) / attempted) * 100 * 10) / 10;
  }

  const validate = (): boolean => {
    if (attempted !== undefined && attempted < 0) {
      setError('Attempted questions cannot be negative.');
      return false;
    }
    if (correct !== undefined && correct < 0) {
      setError('Correct answers cannot be negative.');
      return false;
    }
    if (attempted !== undefined && correct !== undefined) {
      if (correct > attempted) {
        setError('Correct answers cannot exceed attempted questions.');
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleMarkCompleteAnyway = () => {
    if (!validate()) return;
    completeTask(task.id, completedValue, attempted, correct, actualMinutes, difficulty);
    onClose();
  };

  const handleCarryRemainingToTomorrow = () => {
    if (!validate()) return;
    const tomorrowStr = addDaysToDateString(getTodayDateString(), 1);

    // Update current task as partially complete
    updateTask(task.id, {
      currentCompletedValue: completedValue,
      attemptedQuestions: attempted,
      correctAnswers: correct,
      calculatedAccuracy: calculatedAccuracy ?? undefined,
      actualCompletedDurationMinutes: actualMinutes,
      status: 'Partially complete',
      difficulty,
    });

    // Create follow-up task for remaining target
    addTask({
      title: `${task.title} (Remaining ${remainingValue} ${task.targetUnit})`,
      subject: task.subject,
      subtopic: task.subtopic,
      category: 'regular',
      taskType: task.taskType,
      priority: task.priority,
      plannedDate: tomorrowStr,
      isFlexible: true,
      plannedDurationMinutes: Math.max(15, Math.round((task.plannedDurationMinutes * remainingValue) / targetTotal)),
      reminderLeadMinutes: task.reminderLeadMinutes,
      targetValue: remainingValue,
      targetUnit: task.targetUnit,
      currentCompletedValue: 0,
      accuracyTarget: task.accuracyTarget,
      difficulty: task.difficulty,
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      notes: `Carried over from ${task.title}. Target: remaining ${remainingValue} ${task.targetUnit}.`,
      parentTaskId: task.id,
    });

    onClose();
  };

  const handleCreateCustomFollowUp = () => {
    if (!validate()) return;

    updateTask(task.id, {
      currentCompletedValue: completedValue,
      attemptedQuestions: attempted,
      correctAnswers: correct,
      calculatedAccuracy: calculatedAccuracy ?? undefined,
      actualCompletedDurationMinutes: actualMinutes,
      status: 'Partially complete',
      difficulty,
    });

    addTask({
      title: `${task.title} (Part 2 - ${remainingValue} ${task.targetUnit})`,
      subject: task.subject,
      subtopic: task.subtopic,
      category: 'regular',
      taskType: task.taskType,
      priority: task.priority,
      plannedDate: customFollowUpDate,
      isFlexible: true,
      plannedDurationMinutes: Math.max(15, Math.round((task.plannedDurationMinutes * remainingValue) / targetTotal)),
      reminderLeadMinutes: task.reminderLeadMinutes,
      targetValue: remainingValue,
      targetUnit: task.targetUnit,
      currentCompletedValue: 0,
      accuracyTarget: task.accuracyTarget,
      difficulty: task.difficulty,
      status: 'Pending',
      actualCompletedDurationMinutes: 0,
      notes: `Remaining ${remainingValue} ${task.targetUnit} from ${task.title}.`,
      parentTaskId: task.id,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-2xl bg-[#141C32] border border-[#273450] shadow-2xl text-slate-200 overflow-hidden card-depth-3d">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#273450] bg-[#0E1527]">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="text-base font-bold text-white">Log Work & Target</h3>
              <p className="text-xs text-slate-400 truncate max-w-[280px]">{task.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target input */}
          {task.targetValue > 0 && (
            <div className="p-4 rounded-xl bg-[#0B1020]/70 border border-[#273450] space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="completedInput" className="text-xs font-semibold text-slate-200">
                  Completed {task.targetUnit}
                </label>
                <span className="text-xs text-slate-400">
                  Planned Target: <strong className="text-white font-mono-numbers">{task.targetValue} {task.targetUnit}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="completedInput"
                  type="number"
                  min="0"
                  max={task.targetValue * 3}
                  value={completedValue}
                  onChange={(e) => setCompletedValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#141C32] border border-[#273450] text-white text-base font-bold font-mono-numbers focus:outline-none focus:border-indigo-500"
                />
                <span className="text-sm font-medium text-slate-300">{task.targetUnit}</span>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Progress</span>
                  <span className="font-mono-numbers">
                    {Math.round((completedValue / targetTotal) * 100)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1F293D] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400"
                    style={{ width: `${Math.min(100, (completedValue / targetTotal) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Practice Questions & Accuracy (Optional for question sets) */}
          {(task.targetUnit === 'Questions' || task.taskType === 'Practice' || task.taskType === 'Mock test') && (
            <div className="p-4 rounded-xl bg-[#0B1020]/70 border border-[#273450] space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>Practice Accuracy</span>
                {calculatedAccuracy !== null && (
                  <span className="text-xs font-bold font-mono-numbers text-emerald-400">
                    Accuracy: {calculatedAccuracy}%
                  </span>
                )}
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="attemptedQuestions" className="block text-[11px] text-slate-400 mb-1">
                    Questions Attempted
                  </label>
                  <input
                    id="attemptedQuestions"
                    type="number"
                    min="0"
                    value={attempted ?? ''}
                    onChange={(e) => setAttempted(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="e.g. 30"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label htmlFor="correctAnswers" className="block text-[11px] text-slate-400 mb-1">
                    Correct Answers
                  </label>
                  <input
                    id="correctAnswers"
                    type="number"
                    min="0"
                    value={correct ?? ''}
                    onChange={(e) => setCorrect(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    placeholder="e.g. 23"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Time & Difficulty */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="actualStudyTime" className="block text-xs font-medium text-slate-400 mb-1">
                Actual Study Time (mins)
              </label>
              <input
                id="actualStudyTime"
                type="number"
                min="1"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
              />
            </div>

            <div>
              <label htmlFor="difficultyRating" className="block text-xs font-medium text-slate-400 mb-1">
                Subject Difficulty
              </label>
              <select
                id="difficultyRating"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="Easy">Easy (Felt confident)</option>
                <option value="Medium">Medium (Balanced)</option>
                <option value="Hard">Hard (Needs more revision)</option>
              </select>
            </div>
          </div>

          {/* Partial Completion Choices (if completedValue < targetValue) */}
          {isTargetUnder && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-200">
                    You completed {completedValue} of {targetTotal} {task.targetUnit}
                  </p>
                  <p className="text-[11px] text-amber-300/80">
                    Remaining: {remainingValue} {task.targetUnit}. This is solid progress, not a failure. How would you like to handle the remainder?
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {onContinueFocus && (
                  <button
                    type="button"
                    onClick={onContinueFocus}
                    className="w-full text-left px-3 py-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-500/30 text-xs font-semibold text-white flex items-center justify-between"
                  >
                    <span>Continue studying now in Focus Mode</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCarryRemainingToTomorrow}
                  className="w-full text-left px-3 py-2 rounded-lg bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-xs font-medium text-slate-200 flex items-center justify-between cursor-pointer"
                >
                  <span>Carry remaining {remainingValue} {task.targetUnit} to tomorrow</span>
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="date"
                    value={customFollowUpDate}
                    onChange={(e) => setCustomFollowUpDate(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomFollowUp}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 whitespace-nowrap cursor-pointer"
                  >
                    Follow-up on date
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#273450]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleMarkCompleteAnyway}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isTargetUnder ? 'Save & Mark Complete' : 'Complete Task'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
