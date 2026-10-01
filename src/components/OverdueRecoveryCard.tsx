import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { getTodayDateString, addDaysToDateString, getNextWeekendDates, formatDateReadable } from '../utils/dateUtils';
import { Sparkles, Calendar, ArrowRight, Ban, CheckCheck, RefreshCw, X, Scissors, ChevronDown, ChevronUp } from 'lucide-react';

interface OverdueRecoveryCardProps {
  overdueTasks: Task[];
  onOpenSplit: (task: Task) => void;
}

export const OverdueRecoveryCard: React.FC<OverdueRecoveryCardProps> = ({ overdueTasks, onOpenSplit }) => {
  const { updateTask, rescheduleTask, skipTask } = useApp();
  const [showSimplifyDialog, setShowSimplifyDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (overdueTasks.length === 0 || dismissed) return null;

  const count = overdueTasks.length;
  const tomorrow = addDaysToDateString(getTodayDateString(), 1);
  const weekend = getNextWeekendDates();

  const handleMoveAllToTomorrow = () => {
    overdueTasks.forEach(t => {
      rescheduleTask(t.id, tomorrow);
    });
  };

  const handleMoveAllToWeekend = () => {
    overdueTasks.forEach((t, index) => {
      // Alternate between Saturday and Sunday
      const date = index % 2 === 0 ? weekend.saturday : weekend.sunday;
      rescheduleTask(t.id, date);
    });
  };

  const handleSkipAll = () => {
    overdueTasks.forEach(t => {
      skipTask(t.id, 'Clean slate reset by student');
    });
  };

  // "Simplify this week" action: Retain Must do tasks today/tomorrow, defer Should/Optional tasks to weekend
  const handleSimplifyWeek = () => {
    overdueTasks.forEach(t => {
      if (t.priority === 'Must do') {
        rescheduleTask(t.id, tomorrow);
      } else {
        rescheduleTask(t.id, weekend.saturday);
      }
    });
    setShowSimplifyDialog(false);
  };

  return (
    <>
      <div className="relative rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 p-4 sm:p-5 shadow-lg backdrop-blur-md overflow-hidden card-depth-3d">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <RefreshCw className="w-5 h-5 animate-spin-reverse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Unfinished Task Recovery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono-numbers">
                  {count} {count === 1 ? 'task' : 'tasks'}
                </span>
              </h4>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                You have {count} unfinished {count === 1 ? 'task' : 'tasks'} from previous days. Decide what happens next without pressure or stress.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
            aria-label="Dismiss recovery banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Recovery Actions */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleMoveAllToTomorrow}
            className="px-3 py-1.5 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            <span>Move to tomorrow</span>
          </button>

          <button
            type="button"
            onClick={handleMoveAllToWeekend}
            className="px-3 py-1.5 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-400" />
            <span>Move to weekend</span>
          </button>

          {count > 1 && (
            <button
              type="button"
              onClick={() => setShowSimplifyDialog(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simplify this week</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-3 py-1.5 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Review Tasks ({count})</span>
            {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={handleSkipAll}
            className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors ml-auto cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Mark skipped</span>
          </button>
        </div>

        {/* Expandable Per-Task Breakdown with Split action */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2">
            {overdueTasks.map(t => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-[#0B1020]/80 border border-[#273450] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{t.title}</span>
                    <span className="text-[10px] text-amber-300 font-mono-numbers">({formatDateReadable(t.plannedDate)})</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t.targetValue > 0 ? `Target: ${t.targetValue} ${t.targetUnit}` : `${t.plannedDurationMinutes}m`} • {t.priority}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  {t.targetValue > 0 && (
                    <button
                      type="button"
                      onClick={() => onOpenSplit(t)}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Split this task into two smaller sessions"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Split</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => rescheduleTask(t.id, tomorrow)}
                    className="px-2.5 py-1 rounded-lg bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-slate-200 text-[11px] font-medium cursor-pointer"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => skipTask(t.id, 'Deferred by student')}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-300 text-[11px] cursor-pointer"
                  >
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simplify Week Confirmation Dialog */}
      {showSimplifyDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-[#273450] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                <h3 className="text-base font-bold text-white">Simplify Your Week</h3>
              </div>
              <button onClick={() => setShowSimplifyDialog(false)} className="p-1 rounded-lg text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When study backlogs build up, trying to do everything at once causes overwhelm.
              <br /><br />
              <strong>Proposed rebalance:</strong>
              <br />
              • Keep <strong>Must do</strong> priority tasks for tomorrow.
              <br />
              • Move <strong>Should do</strong> and <strong>Optional</strong> tasks to the weekend where you have more bandwidth.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#273450]">
              <button
                type="button"
                onClick={() => setShowSimplifyDialog(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Keep as is
              </button>
              <button
                type="button"
                onClick={handleSimplifyWeek}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Apply Rebalance
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
