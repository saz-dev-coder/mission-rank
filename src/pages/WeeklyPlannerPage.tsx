import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { 
  getTodayDateString, 
  getWeekDays, 
  formatDateReadable, 
  formatTime12h, 
  timeToMinutes,
  addDaysToDateString,
  getNextWeekendDates
} from '../utils/dateUtils';
import { calculateDailyScore } from '../utils/scoreCalculator';
import { getSubjectColor, getPriorityBadge } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { PartialCompletionModal } from '../components/PartialCompletionModal';
import { SplitTaskModal, RescheduleModal } from '../components/TaskActionModals';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Target, 
  Sparkles, 
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';

export const WeeklyPlannerPage: React.FC = () => {
  const { tasks, startFocusSession, rescheduleTask, skipTask } = useApp();

  const todayStr = getTodayDateString();
  const [selectedReferenceDate, setSelectedReferenceDate] = useState<string>(todayStr);
  const [activeDayDate, setActiveDayDate] = useState<string>(todayStr);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(todayStr);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [splitTaskTarget, setSplitTaskTarget] = useState<Task | null>(null);
  const [rescheduleTaskTarget, setRescheduleTaskTarget] = useState<Task | null>(null);

  // Auto-rebalance modal
  const [showAutoRebalanceModal, setShowAutoRebalanceModal] = useState(false);

  // 7 days of current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    return getWeekDays(selectedReferenceDate);
  }, [selectedReferenceDate]);

  // Navigate weeks
  const handlePrevWeek = () => {
    setSelectedReferenceDate(prev => addDaysToDateString(prev, -7));
  };

  const handleNextWeek = () => {
    setSelectedReferenceDate(prev => addDaysToDateString(prev, 7));
  };

  const handleCurrentWeek = () => {
    setSelectedReferenceDate(todayStr);
    setActiveDayDate(todayStr);
  };

  // Group tasks by day
  const tasksByDay = useMemo(() => {
    const map: { [dateStr: string]: Task[] } = {};
    weekDays.forEach(wd => {
      map[wd.dateStr] = tasks.filter(t => t.plannedDate === wd.dateStr);
    });
    return map;
  }, [weekDays, tasks]);

  // Backlog tasks (Overdue from before the current week or before today)
  const backlogTasks = useMemo(() => {
    return tasks.filter(
      t => t.plannedDate < todayStr && t.category !== 'availability_block' && t.status !== 'Completed' && t.status !== 'Skipped'
    );
  }, [tasks, todayStr]);

  // Weekly stats
  const weeklyStats = useMemo(() => {
    let plannedMin = 0;
    let actualMin = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    weekDays.forEach(wd => {
      const dayTasks = (tasksByDay[wd.dateStr] || []).filter(t => t.category !== 'availability_block');
      dayTasks.forEach(t => {
        totalTasks++;
        plannedMin += t.plannedDurationMinutes || 0;
        actualMin += t.actualCompletedDurationMinutes || 0;
        if (t.status === 'Completed') completedTasks++;
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { plannedMin, actualMin, totalTasks, completedTasks, completionRate };
  }, [weekDays, tasksByDay]);

  // Rebalance suggestions
  const weekendDates = getNextWeekendDates();

  const handleAutoRebalanceApply = (decision: 'tomorrow' | 'weekend' | 'simplify') => {
    backlogTasks.forEach((t, idx) => {
      if (decision === 'tomorrow') {
        rescheduleTask(t.id, addDaysToDateString(todayStr, 1));
      } else if (decision === 'weekend') {
        const targetDate = idx % 2 === 0 ? weekendDates.saturday : weekendDates.sunday;
        rescheduleTask(t.id, targetDate);
      } else {
        // simplify: must do to tomorrow, others to weekend
        if (t.priority === 'Must do') {
          rescheduleTask(t.id, addDaysToDateString(todayStr, 1));
        } else {
          rescheduleTask(t.id, weekendDates.saturday);
        }
      }
    });
    setShowAutoRebalanceModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with week navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-400" />
            <span>Weekly Study Planner</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDateReadable(weekDays[0].dateStr)} – {formatDateReadable(weekDays[6].dateStr)}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center rounded-xl bg-[#141C32] border border-[#273450] p-0.5">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentWeek}
              className="px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {backlogTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowAutoRebalanceModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto Rebalance ({backlogTasks.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setModalDate(activeDayDate);
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Weekly Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#141C32] border border-[#273450] text-xs card-depth-3d">
        <div>
          <span className="text-slate-400 block text-[11px]">Tasks Planned</span>
          <span className="text-base font-bold text-white font-mono-numbers">
            {weeklyStats.completedTasks} / {weeklyStats.totalTasks}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Weekly Completion</span>
          <span className="text-base font-bold text-emerald-400 font-mono-numbers">
            {weeklyStats.completionRate}%
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Planned Focus</span>
          <span className="text-base font-bold text-sky-400 font-mono-numbers">
            {Math.round(weeklyStats.plannedMin / 60)} hrs
          </span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">Actual Focus Completed</span>
          <span className="text-base font-bold text-pink-400 font-mono-numbers">
            {Math.round(weeklyStats.actualMin / 60)} hrs
          </span>
        </div>
      </div>

      {/* Mobile Day Selector Bar (Horizontally scrollable) */}
      <div className="flex sm:hidden overflow-x-auto gap-2 pb-1 scrollbar-none">
        {weekDays.map(wd => {
          const isSelected = wd.dateStr === activeDayDate;
          const dayTasks = tasksByDay[wd.dateStr] || [];
          const completedCount = dayTasks.filter(t => t.status === 'Completed').length;

          return (
            <button
              key={wd.dateStr}
              type="button"
              onClick={() => setActiveDayDate(wd.dateStr)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-pink-600 to-indigo-600 border-transparent text-white font-bold shadow-md'
                  : wd.isToday
                  ? 'bg-[#141C32] border-indigo-500/50 text-indigo-300'
                  : 'bg-[#141C32]/60 border-[#273450] text-slate-400'
              }`}
            >
              <div className="text-[10px] uppercase font-semibold">{wd.dayName}</div>
              <div className="text-sm font-mono-numbers font-extrabold">{wd.dayNumber}</div>
              <div className="text-[9px] text-slate-300 opacity-80 mt-0.5">
                {completedCount}/{dayTasks.length}
              </div>
            </button>
          );
        })}
      </div>

      {/* Desktop 7-Day Grid View */}
      <div className="hidden sm:grid sm:grid-cols-7 gap-3">
        {weekDays.map(wd => {
          const dayTasks = tasksByDay[wd.dateStr] || [];
          const timed = dayTasks
            .filter(t => !t.isFlexible && t.startTime && t.endTime && t.category !== 'availability_block')
            .sort((a, b) => timeToMinutes(a.startTime || '') - timeToMinutes(b.startTime || ''));
          const flexible = dayTasks.filter(t => (t.isFlexible || !t.startTime) && t.category !== 'availability_block');
          const availBlocks = dayTasks.filter(t => t.category === 'availability_block');

          // Daily score calculation
          const score = calculateDailyScore(dayTasks, wd.dateStr, tasks);

          return (
            <div
              key={wd.dateStr}
              className={`rounded-2xl border p-3 flex flex-col justify-between min-h-[460px] transition-all card-depth-3d ${
                wd.isToday
                  ? 'bg-[#141C32] border-indigo-500/50 shadow-indigo-500/10 shadow-lg'
                  : 'bg-[#141C32]/70 border-[#273450]'
              }`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between border-b border-[#273450]/60 pb-2 mb-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      {wd.dayName}
                    </span>
                    <h4 className="text-base font-extrabold text-white font-mono-numbers">
                      {wd.dayNumber}
                    </h4>
                  </div>
                  {score.hasTasks && (
                    <span className="text-xs font-mono-numbers font-bold text-slate-300 bg-[#0B1020] px-1.5 py-0.5 rounded border border-[#273450]">
                      {score.total} pts
                    </span>
                  )}
                </div>

                {/* Availability Blocks subtle badge */}
                {availBlocks.length > 0 && (
                  <div className="mb-2 p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[10px] text-sky-300">
                    Window: {formatTime12h(availBlocks[0].startTime || '')}–{formatTime12h(availBlocks[0].endTime || '')}
                  </div>
                )}

                {/* Timed Tasks */}
                <div className="space-y-1.5">
                  {timed.map(task => {
                    const theme = getSubjectColor(task.subject);
                    const isMock = task.taskType === 'Mock test' || task.taskType === 'Mock analysis';
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setTaskToEdit(task);
                          setIsTaskModalOpen(true);
                        }}
                        className={`p-2 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] ${
                          task.status === 'Completed'
                            ? 'bg-[#0B1020]/40 border-slate-800 opacity-60 line-through'
                            : isMock
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-[#0B1020] border-[#273450]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-numbers mb-0.5">
                          <span>{formatTime12h(task.startTime || '')}</span>
                          <span className={`px-1 rounded text-[9px] ${theme.bg} ${theme.text}`}>
                            {task.subject}
                          </span>
                        </div>
                        <h5 className="font-semibold text-white truncate text-[11px]">
                          {task.title}
                        </h5>
                      </div>
                    );
                  })}

                  {/* Flexible Tasks */}
                  {flexible.map(task => {
                    const theme = getSubjectColor(task.subject);
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          setTaskToEdit(task);
                          setIsTaskModalOpen(true);
                        }}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-all hover:scale-[1.02] ${
                          task.status === 'Completed'
                            ? 'bg-[#0B1020]/40 border-slate-800 opacity-60 line-through'
                            : 'bg-[#0B1020]/60 border-[#273450]/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                          <span className="text-[9px] text-slate-500">Anytime</span>
                          <span className={`px-1 rounded text-[9px] ${theme.bg} ${theme.text}`}>
                            {task.subject}
                          </span>
                        </div>
                        <h5 className="font-medium text-slate-200 truncate text-[11px]">
                          {task.title}
                        </h5>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add task button for this specific day */}
              <button
                type="button"
                onClick={() => {
                  setModalDate(wd.dateStr);
                  setTaskToEdit(null);
                  setIsTaskModalOpen(true);
                }}
                className="mt-3 w-full py-1.5 rounded-xl border border-dashed border-[#273450] hover:border-indigo-400/50 hover:bg-[#0B1020] text-slate-400 hover:text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile Single Day View for selected tab */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{formatDateReadable(activeDayDate)}</span>
            {activeDayDate === todayStr && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 font-bold">
                Today
              </span>
            )}
          </h3>
          <button
            type="button"
            onClick={() => {
              setModalDate(activeDayDate);
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add Task</span>
          </button>
        </div>

        {tasksByDay[activeDayDate]?.length > 0 ? (
          <div className="space-y-2.5">
            {tasksByDay[activeDayDate].map(t => {
              const theme = getSubjectColor(t.subject);
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    setTaskToEdit(t);
                    setIsTaskModalOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-[#141C32] border border-[#273450] flex items-center justify-between gap-3 cursor-pointer card-depth-3d"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}>
                        {t.subject}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white truncate">{t.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono-numbers">
                      {t.startTime && t.endTime ? `${formatTime12h(t.startTime)}–${formatTime12h(t.endTime)}` : 'Anytime'} • {t.plannedDurationMinutes}m
                    </p>
                  </div>

                  {t.status !== 'Completed' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startFocusSession(t.id);
                      }}
                      className="p-2 rounded-lg bg-gradient-to-r from-pink-600 to-indigo-600 text-white shrink-0"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#141C32]/60 border border-dashed border-[#273450] text-center text-xs text-slate-400">
            No study tasks planned for this day yet.
          </div>
        )}
      </div>

      {/* Overdue Backlog Area */}
      {backlogTasks.length > 0 && (
        <div className="p-5 rounded-2xl bg-[#0F172A] border border-amber-500/30 space-y-3 card-depth-3d">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Study Backlog (Unfinished Past Tasks)</span>
              <span className="font-mono-numbers px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                {backlogTasks.length}
              </span>
            </h4>
            <button
              type="button"
              onClick={() => setShowAutoRebalanceModal(true)}
              className="text-xs text-indigo-400 hover:text-white font-semibold cursor-pointer"
            >
              Rebalance options →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {backlogTasks.map(t => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#141C32] border border-[#273450] flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] text-rose-400 font-bold block mb-1">
                    Past due ({formatDateReadable(t.plannedDate)})
                  </span>
                  <h5 className="text-xs font-bold text-white truncate">{t.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {t.targetValue > 0 ? `${t.targetValue} ${t.targetUnit}` : `${t.plannedDurationMinutes}m`}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#273450]/60">
                  <button
                    type="button"
                    onClick={() => rescheduleTask(t.id, todayStr)}
                    className="flex-1 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-semibold transition-colors"
                  >
                    Move to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => skipTask(t.id, 'Deferred by student')}
                    className="py-1 px-2 rounded bg-slate-800 text-slate-400 hover:text-amber-300 text-[11px]"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auto-Rebalance Suggestions Modal */}
      {showAutoRebalanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#273450] pb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-white">Auto Rebalance Suggestions</h3>
                <p className="text-xs text-slate-400">
                  Mission Rank will never move tasks without your direct confirmation.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You have <strong>{backlogTasks.length} unfinished tasks</strong> in your backlog. Choose how you would like to redistribute them:
            </p>

            <div className="space-y-2 text-xs">
              <button
                type="button"
                onClick={() => handleAutoRebalanceApply('tomorrow')}
                className="w-full text-left p-3 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h5 className="font-bold text-white group-hover:text-indigo-400">Move all to Tomorrow</h5>
                  <p className="text-[11px] text-slate-400">Reschedules unfinished tasks for tomorrow's study window</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAutoRebalanceApply('weekend')}
                className="w-full text-left p-3 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h5 className="font-bold text-white group-hover:text-purple-400">Distribute across Upcoming Weekend</h5>
                  <p className="text-[11px] text-slate-400">Places tasks on Saturday ({weekendDates.saturday}) & Sunday ({weekendDates.sunday})</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleAutoRebalanceApply('simplify')}
                className="w-full text-left p-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 border border-pink-500/30 flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <h5 className="font-bold text-white">Smart Simplify</h5>
                  <p className="text-[11px] text-slate-300">Moves "Must do" priority to tomorrow, defers "Should" and "Optional" to weekend</p>
                </div>
                <Sparkles className="w-4 h-4 text-pink-400" />
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAutoRebalanceModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
        initialDate={modalDate}
      />

      {/* Partial Completion Modal */}
      {partialTask && (
        <PartialCompletionModal
          task={partialTask}
          isOpen={Boolean(partialTask)}
          onClose={() => setPartialTask(null)}
          onContinueFocus={() => {
            const taskId = partialTask.id;
            setPartialTask(null);
            startFocusSession(taskId);
          }}
        />
      )}

      {/* Split Task Modal */}
      {splitTaskTarget && (
        <SplitTaskModal
          task={splitTaskTarget}
          isOpen={Boolean(splitTaskTarget)}
          onClose={() => setSplitTaskTarget(null)}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleTaskTarget && (
        <RescheduleModal
          task={rescheduleTaskTarget}
          isOpen={Boolean(rescheduleTaskTarget)}
          onClose={() => setRescheduleTaskTarget(null)}
        />
      )}
    </div>
  );
};
