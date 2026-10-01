import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { getTodayDateString, formatDateReadable, formatTime12h, timeToMinutes } from '../utils/dateUtils';
import { calculateDailyScore } from '../utils/scoreCalculator';
import { DailyScoreOrb } from '../components/DailyScoreOrb';
import { TaskCard, getSubjectColor } from '../components/TaskCard';
import { OverdueRecoveryCard } from '../components/OverdueRecoveryCard';
import { TaskModal } from '../components/TaskModal';
import { PartialCompletionModal } from '../components/PartialCompletionModal';
import { SplitTaskModal, RescheduleModal } from '../components/TaskActionModals';
import { 
  Play, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Target, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  Layers,
  ArrowRight,
  BarChart3,
  MessageSquare
} from 'lucide-react';

export const TodayDashboard: React.FC = () => {
  const { profile, tasks, startFocusSession, setCurrentView } = useApp();

  const todayStr = getTodayDateString();

  // Modals state
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [splitTaskTarget, setSplitTaskTarget] = useState<Task | null>(null);
  const [rescheduleTaskTarget, setRescheduleTaskTarget] = useState<Task | null>(null);
  const [completedCollapsed, setCompletedCollapsed] = useState(true);

  // Filter tasks for today
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.plannedDate === todayStr);
  }, [tasks, todayStr]);

  // Overdue tasks from previous days
  const overdueTasks = useMemo(() => {
    return tasks.filter(
      t => t.plannedDate < todayStr && t.category !== 'availability_block' && t.status !== 'Completed' && t.status !== 'Skipped'
    );
  }, [tasks, todayStr]);

  // Regular tasks for today
  const regularTasks = useMemo(() => {
    return todayTasks.filter(t => t.category !== 'availability_block');
  }, [todayTasks]);

  // Availability blocks for today
  const availabilityBlocks = useMemo(() => {
    return todayTasks.filter(t => t.category === 'availability_block');
  }, [todayTasks]);

  // Timed tasks sorted chronologically
  const timedTasks = useMemo(() => {
    return regularTasks
      .filter(t => !t.isFlexible && t.startTime && t.endTime)
      .sort((a, b) => timeToMinutes(a.startTime || '00:00') - timeToMinutes(b.startTime || '00:00'));
  }, [regularTasks]);

  // Flexible "Anytime today" tasks
  const flexibleTasks = useMemo(() => {
    return regularTasks.filter(t => t.isFlexible || !t.startTime || !t.endTime);
  }, [regularTasks]);

  // Priority groupings
  const mustDoTasks = regularTasks.filter(t => t.priority === 'Must do' && t.status !== 'Completed');
  const otherActiveTasks = regularTasks.filter(t => t.priority !== 'Must do' && t.status !== 'Completed');
  const completedTasks = regularTasks.filter(t => t.status === 'Completed');

  // Study times
  let plannedStudyMinutes = 0;
  let actualFocusMinutes = 0;
  regularTasks.forEach(t => {
    plannedStudyMinutes += t.plannedDurationMinutes || 0;
    actualFocusMinutes += t.actualCompletedDurationMinutes || 0;
  });

  // Calculate Daily Execution Score
  const scoreData = useMemo(() => {
    return calculateDailyScore(todayTasks, todayStr, tasks);
  }, [todayTasks, todayStr, tasks]);

  // Next up task calculation
  const nextUpTask = useMemo(() => {
    const uncompletedTimed = timedTasks.filter(t => t.status !== 'Completed' && t.status !== 'Skipped');
    if (uncompletedTimed.length > 0) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Check if any task is happening right now
      const current = uncompletedTimed.find(t => {
        const start = timeToMinutes(t.startTime || '');
        const end = timeToMinutes(t.endTime || '');
        return currentMinutes >= start && currentMinutes <= end;
      });
      if (current) return { task: current, statusLabel: 'Scheduled Now' };

      // Check upcoming today
      const upcoming = uncompletedTimed.find(t => timeToMinutes(t.startTime || '') > currentMinutes);
      if (upcoming) {
        const diff = timeToMinutes(upcoming.startTime || '') - currentMinutes;
        return { task: upcoming, statusLabel: `Starts in ${diff}m` };
      }

      // If all past their end time but incomplete
      return { task: uncompletedTimed[0], statusLabel: 'Next pending' };
    }

    // Fall back to highest priority flexible task
    const uncompletedFlexible = flexibleTasks.filter(t => t.status !== 'Completed' && t.status !== 'Skipped');
    const mustDo = uncompletedFlexible.find(t => t.priority === 'Must do');
    if (mustDo) return { task: mustDo, statusLabel: 'Priority next' };
    if (uncompletedFlexible.length > 0) return { task: uncompletedFlexible[0], statusLabel: 'Anytime today' };

    return null;
  }, [timedTasks, flexibleTasks]);

  // Supportive honest message based on real state
  const supportiveMessage = useMemo(() => {
    const name = profile?.firstName || 'Aspirant';
    const pendingCount = regularTasks.filter(t => t.status !== 'Completed' && t.status !== 'Skipped').length;
    const mustDoLeft = mustDoTasks.length;

    if (regularTasks.length === 0) {
      return `Welcome, ${name}. No tasks planned yet. Add one small task to start today.`;
    }
    if (pendingCount === 0) {
      return `Outstanding execution, ${name}! All planned tasks for today are completed.`;
    }
    if (mustDoLeft === 1) {
      return `${name}, you have one priority task left. Finish it and today stays on track.`;
    }
    if (mustDoLeft > 1) {
      return `${name}, you have ${mustDoLeft} priority tasks left today. Focus on one at a time.`;
    }
    return `Good progress, ${name}. ${pendingCount} ${pendingCount === 1 ? 'task' : 'tasks'} remaining today.`;
  }, [profile?.firstName, regularTasks, mustDoTasks.length]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Welcome & Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {profile?.firstName || 'Aspirant'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              {profile?.targetExam || 'Govt Exam'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatDateReadable(todayStr)} • {supportiveMessage}
          </p>
        </div>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={() => {
            setTaskToEdit(null);
            setIsTaskModalOpen(true);
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Study Task</span>
        </button>
      </div>

      {/* Quick Access to Progress Analytics & Daily Review */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setCurrentView('progress')}
          className="px-3 py-1.5 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
          <span>Analytics & Mocks</span>
        </button>
        <button
          type="button"
          onClick={() => setCurrentView('reviews')}
          className="px-3 py-1.5 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
          <span>Daily & Weekly Review</span>
        </button>
      </div>

      {/* Missed-Task Recovery Banner if overdue tasks exist */}
      {overdueTasks.length > 0 && (
        <OverdueRecoveryCard
          overdueTasks={overdueTasks}
          onOpenSplit={(t) => setSplitTaskTarget(t)}
        />
      )}

      {/* Daily Score Orb Card */}
      <DailyScoreOrb
        scoreData={scoreData}
        plannedMinutes={plannedStudyMinutes}
        actualMinutes={actualFocusMinutes}
      />

      {/* Main "Next Up" Highlight Card */}
      {nextUpTask && (
        <div className="relative rounded-2xl bg-gradient-to-r from-indigo-900/40 via-purple-900/30 to-pink-900/30 border border-indigo-500/40 p-5 shadow-xl backdrop-blur-md overflow-hidden card-depth-3d">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase tracking-wider">
                  Next Up
                </span>
                <span className="text-xs font-semibold text-indigo-300">
                  {nextUpTask.statusLabel}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white">
                {nextUpTask.task.title}
              </h3>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono-numbers">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  {nextUpTask.task.startTime && nextUpTask.task.endTime
                    ? `${formatTime12h(nextUpTask.task.startTime)} – ${formatTime12h(nextUpTask.task.endTime)}`
                    : `Duration: ${nextUpTask.task.plannedDurationMinutes}m`}
                </span>
                {nextUpTask.task.targetValue > 0 && (
                  <span className="flex items-center gap-1 text-pink-300">
                    <Target className="w-3.5 h-3.5" />
                    Target: {nextUpTask.task.targetValue} {nextUpTask.task.targetUnit}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => startFocusSession(nextUpTask.task.id)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500 hover:from-pink-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-pink-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Focus Session</span>
            </button>
          </div>
        </div>
      )}

      {/* Availability Windows banner */}
      {availabilityBlocks.length > 0 && (
        <div className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 flex items-center justify-between text-xs text-sky-300">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            <span>
              <strong>Study Availability Block:</strong>{' '}
              {availabilityBlocks.map(b => `${b.title} (${formatTime12h(b.startTime || '')}–${formatTime12h(b.endTime || '')})`).join(', ')}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Non-conflicting background window
          </span>
        </div>
      )}

      {/* Today's Schedule Timeline for Timed Tasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>Today's Time-Block Schedule</span>
            <span className="text-xs text-slate-400 font-normal font-mono-numbers">
              ({timedTasks.length})
            </span>
          </h3>
        </div>

        {timedTasks.length > 0 ? (
          <div className="space-y-3">
            {timedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onOpenEdit={(t) => {
                  setTaskToEdit(t);
                  setIsTaskModalOpen(true);
                }}
                onOpenPartial={(t) => setPartialTask(t)}
                onOpenSplit={(t) => setSplitTaskTarget(t)}
                onOpenReschedule={(t) => setRescheduleTaskTarget(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-5 rounded-xl bg-[#141C32]/50 border border-dashed border-[#273450] text-center text-xs text-slate-400">
            No timed tasks scheduled yet. Tasks with specific start & end times will appear here in chronological order.
          </div>
        )}
      </section>

      {/* Anytime Today Flexible Tasks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Anytime Today (Flexible)</span>
            <span className="text-xs text-slate-400 font-normal font-mono-numbers">
              ({flexibleTasks.length})
            </span>
          </h3>
        </div>

        {flexibleTasks.length > 0 ? (
          <div className="space-y-3">
            {flexibleTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onOpenEdit={(t) => {
                  setTaskToEdit(t);
                  setIsTaskModalOpen(true);
                }}
                onOpenPartial={(t) => setPartialTask(t)}
                onOpenSplit={(t) => setSplitTaskTarget(t)}
                onOpenReschedule={(t) => setRescheduleTaskTarget(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#141C32]/50 border border-dashed border-[#273450] text-center text-xs text-slate-400">
            No flexible anytime tasks. Add revision, mock analysis, or general practice to work on at any time.
          </div>
        )}
      </section>

      {/* Completed Tasks Accordion */}
      {completedTasks.length > 0 && (
        <section className="rounded-xl border border-[#273450] bg-[#141C32]/60 overflow-hidden">
          <button
            type="button"
            onClick={() => setCompletedCollapsed(!completedCollapsed)}
            className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Completed Tasks Today ({completedTasks.length})</span>
            </div>
            {completedCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {!completedCollapsed && (
            <div className="p-4 pt-0 space-y-3 border-t border-[#273450]/60">
              {completedTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onOpenEdit={(t) => {
                    setTaskToEdit(t);
                    setIsTaskModalOpen(true);
                  }}
                  onOpenPartial={(t) => setPartialTask(t)}
                  onOpenSplit={(t) => setSplitTaskTarget(t)}
                  onOpenReschedule={(t) => setRescheduleTaskTarget(t)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      {/* Partial Completion / Work Logging Modal */}
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
