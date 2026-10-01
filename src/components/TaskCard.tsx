import React, { useState } from 'react';
import { Task, SubjectType, Priority } from '../types';
import { useApp } from '../context/AppContext';
import { formatTime12h } from '../utils/dateUtils';
import { 
  Play, 
  Check, 
  MoreVertical, 
  Clock, 
  Target, 
  RotateCcw, 
  Scissors, 
  Copy, 
  Calendar, 
  Ban, 
  Trash2, 
  AlertCircle,
  FileCheck
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onOpenEdit: (task: Task) => void;
  onOpenPartial: (task: Task) => void;
  onOpenSplit: (task: Task) => void;
  onOpenReschedule: (task: Task) => void;
}

export const getSubjectColor = (subject: SubjectType): { bg: string; text: string; border: string; accent: string } => {
  switch (subject) {
    case 'Quant':
      return { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30', accent: '#38BDF8' };
    case 'English':
      return { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', accent: '#A78BFA' };
    case 'Reasoning':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', accent: '#FB923C' };
    case 'General Awareness':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', accent: '#34D399' };
    case 'Computer':
      return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30', accent: '#F472B6' };
    case 'Mock Test':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', accent: '#FBBF24' };
    case 'Revision':
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', accent: '#818CF8' };
    default:
      return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', accent: '#94A3B8' };
  }
};

export const getPriorityBadge = (priority: Priority) => {
  switch (priority) {
    case 'Must do':
      return 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold';
    case 'Should do':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
    case 'Optional':
      return 'bg-slate-500/15 text-slate-400 border border-slate-500/20';
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onOpenEdit,
  onOpenPartial,
  onOpenSplit,
  onOpenReschedule,
}) => {
  const { startFocusSession, duplicateTask, deleteTask, skipTask, completeTask } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const subjectTheme = getSubjectColor(task.subject);
  const isCompleted = task.status === 'Completed';
  const isPartial = task.status === 'Partially complete';
  const isSkipped = task.status === 'Skipped';

  // Target calculation
  const hasTarget = task.targetValue > 0;
  const progressPercent = hasTarget 
    ? Math.min(100, Math.round((task.currentCompletedValue / task.targetValue) * 100))
    : (isCompleted ? 100 : 0);

  const handleQuickComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      // Revert to pending
      completeTask(task.id, 0);
    } else {
      if (hasTarget) {
        // If task has measurable target, open partial/target dialog to confirm actual work
        onOpenPartial(task);
      } else {
        // Instant complete
        completeTask(task.id, 1, undefined, undefined, task.plannedDurationMinutes);
      }
    }
  };

  const handleDelete = () => {
    if (isDeleting) {
      deleteTask(task.id);
      setIsDeleting(false);
    } else {
      setIsDeleting(true);
      setTimeout(() => setIsDeleting(false), 4000);
    }
  };

  return (
    <div 
      className={`group relative rounded-xl border transition-all duration-200 card-depth-3d ${
        isCompleted 
          ? 'bg-[#141C32]/40 border-[#273450]/40 opacity-75' 
          : isSkipped
          ? 'bg-[#141C32]/30 border-dashed border-[#273450]/40 opacity-60'
          : 'bg-[#141C32] border-[#273450] hover:border-[#38486d]'
      } p-4`}
    >
      {/* Top row: Subject, Priority, Status, Actions Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span 
            className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${subjectTheme.bg} ${subjectTheme.text} ${subjectTheme.border}`}
          >
            {task.subject}
          </span>
          {task.subtopic && (
            <span className="text-[11px] text-slate-400 font-medium truncate max-w-[130px] sm:max-w-[180px]">
              • {task.subtopic}
            </span>
          )}
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] ${getPriorityBadge(task.priority)}`}>
            {task.priority}
          </span>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Task options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-7 z-50 w-44 rounded-xl bg-[#0F172A] border border-[#273450] shadow-xl py-1 text-xs text-slate-200 divide-y divide-[#273450]/60 animate-in fade-in zoom-in-95">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenEdit(task);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Edit task</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenPartial(task);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Log progress / target</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onOpenReschedule(task);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Reschedule</span>
                  </button>
                  {hasTarget && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        onOpenSplit(task);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Scissors className="w-3.5 h-3.5 text-amber-400" />
                      <span>Split task</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      duplicateTask(task.id);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5 text-purple-400" />
                    <span>Duplicate</span>
                  </button>
                  {!isSkipped && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowMenu(false);
                        skipTask(task.id);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-400 hover:text-amber-400"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Skip task</span>
                    </button>
                  )}
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Confirm delete?' : 'Delete task'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Task Title & clickable body */}
      <div 
        onClick={() => onOpenEdit(task)}
        className="cursor-pointer"
      >
        <div className="flex items-start gap-2.5">
          {/* Completion Checkmark Button */}
          <button
            type="button"
            onClick={handleQuickComplete}
            className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer ${
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : isPartial
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'border-[#3E4F73] hover:border-emerald-400 bg-transparent text-transparent hover:text-emerald-400/60'
            }`}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          <div className="flex-1 min-w-0">
            <h4 className={`text-sm font-semibold text-white leading-snug break-words ${isCompleted ? 'line-through text-slate-400' : ''}`}>
              {task.title}
            </h4>

            {/* Time / Duration row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-1 font-mono-numbers">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {task.startTime && task.endTime ? (
                  <span>
                    {formatTime12h(task.startTime)} – {formatTime12h(task.endTime)} ({task.plannedDurationMinutes}m)
                  </span>
                ) : (
                  <span>Anytime today ({task.plannedDurationMinutes}m)</span>
                )}
              </div>

              {task.status === 'Partially complete' && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Partial ({task.currentCompletedValue}/{task.targetValue} {task.targetUnit})
                </span>
              )}

              {task.status === 'Overdue' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 font-semibold">
                  <AlertCircle className="w-3 h-3" /> Overdue
                </span>
              )}
            </div>

            {/* Target & Accuracy Display */}
            {hasTarget && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Target className="w-3 h-3 text-pink-400" />
                    <span className="font-mono-numbers">
                      {task.currentCompletedValue} / {task.targetValue} {task.targetUnit}
                    </span>
                  </span>

                  {task.attemptedQuestions ? (
                    <span className="text-[11px] font-mono-numbers text-slate-300">
                      {task.correctAnswers ?? 0}/{task.attemptedQuestions} correct ({task.calculatedAccuracy ?? 0}%)
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono-numbers text-slate-400">
                      {progressPercent}%
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[#1F293D] overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {task.notes && (
              <p className="mt-1 text-[11px] text-slate-400 italic line-clamp-1">
                "{task.notes}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Quick Focus button */}
      {!isCompleted && !isSkipped && (
        <div className="mt-3 pt-2.5 border-t border-[#273450]/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            {task.actualCompletedDurationMinutes > 0 ? (
              <span>Focused: <strong className="text-slate-200 font-mono-numbers">{task.actualCompletedDurationMinutes}m</strong></span>
            ) : (
              <span>Estimated: {task.plannedDurationMinutes}m</span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              startFocusSession(task.id);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Focus Now</span>
          </button>
        </div>
      )}
    </div>
  );
};
