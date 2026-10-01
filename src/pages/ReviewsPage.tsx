import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  getTodayDateString, 
  formatDateReadable, 
  getWeekDays, 
  addDaysToDateString 
} from '../utils/dateUtils';
import { calculateDailyScore } from '../utils/scoreCalculator';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Sparkles, 
  MessageSquare, 
  ArrowRight, 
  HelpCircle 
} from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { 
    tasks, 
    dailyReviews, 
    weeklyReviews, 
    submitDailyReview, 
    submitWeeklyReview, 
    setCurrentView 
  } = useApp();

  const todayStr = getTodayDateString();

  // Daily Review States
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.plannedDate === todayStr && t.category !== 'availability_block');
  }, [tasks, todayStr]);

  const scoreData = useMemo(() => {
    return calculateDailyScore(todayTasks, todayStr, tasks);
  }, [todayTasks, todayStr, tasks]);

  const [selectedObstacle, setSelectedObstacle] = useState<string>('Plan was too large');
  const [dailyReflection, setDailyReflection] = useState<string>('');
  const [dailySubmitted, setDailySubmitted] = useState<boolean>(() => {
    return dailyReviews.some(r => r.date === todayStr);
  });

  // Weekly Review States
  const weekDays = useMemo(() => getWeekDays(todayStr), [todayStr]);
  const weekStartDate = weekDays[0].dateStr;
  const [whatWorked, setWhatWorked] = useState('');
  const [whatMissed, setWhatMissed] = useState('');
  const [weeklyDecision, setWeeklyDecision] = useState<'Keep my plan' | 'Simplify next week' | 'Increase study load slightly'>('Keep my plan');
  const [weeklySubmitted, setWeeklySubmitted] = useState<boolean>(() => {
    return weeklyReviews.some(r => r.weekStartDate === weekStartDate);
  });

  // Planned & actual minutes today
  let plannedToday = 0;
  let actualToday = 0;
  let completedTodayCount = 0;
  todayTasks.forEach(t => {
    plannedToday += t.plannedDurationMinutes || 0;
    actualToday += t.actualCompletedDurationMinutes || 0;
    if (t.status === 'Completed') completedTodayCount++;
  });

  const handleSaveDailyReview = (e: React.FormEvent) => {
    e.preventDefault();
    submitDailyReview({
      date: todayStr,
      completedTasksCount: completedTodayCount,
      plannedMinutes: plannedToday,
      actualMinutes: actualToday,
      score: scoreData.total,
      obstacle: selectedObstacle,
      reflection: dailyReflection.trim(),
    });
    setDailySubmitted(true);
  };

  const handleSaveWeeklyReview = (e: React.FormEvent) => {
    e.preventDefault();
    submitWeeklyReview({
      weekStartDate,
      whatWorked: whatWorked.trim(),
      whatMissed: whatMissed.trim(),
      decision: weeklyDecision,
    });
    setWeeklySubmitted(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <span>Daily & Weekly Reviews</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Fast, non-judgmental reflection to optimize your study stamina and prevent burnout
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Review Card */}
        <div className="p-6 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
          <div className="flex items-center justify-between border-b border-[#273450] pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Daily Reflection</span>
                <span className="text-xs font-mono-numbers font-medium text-slate-400">
                  ({formatDateReadable(todayStr)})
                </span>
              </h3>
              <p className="text-xs text-slate-400">Takes under 60 seconds</p>
            </div>
            {dailySubmitted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                Submitted
              </span>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-xl bg-[#0B1020] border border-[#273450]">
            <div>
              <span className="text-[10px] text-slate-400 block">Completed</span>
              <span className="text-sm font-bold text-white font-mono-numbers">
                {completedTodayCount} / {todayTasks.length}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Focus Time</span>
              <span className="text-sm font-bold text-sky-400 font-mono-numbers">
                {actualToday}m
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Score</span>
              <span className="text-sm font-bold text-pink-400 font-mono-numbers">
                {scoreData.total}/100
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveDailyReview} className="space-y-4">
            <div>
              <label htmlFor="dailyObstacleSelect" className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>What got in your way today? (Optional)</span>
              </label>
              <select
                id="dailyObstacleSelect"
                value={selectedObstacle}
                onChange={(e) => setSelectedObstacle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Nothing - smooth day">Nothing, went smoothly</option>
                <option value="Too tired">Too tired / Low energy</option>
                <option value="Too busy">Too busy / Work / Family commitments</option>
                <option value="Topic was difficult">Topic was unexpectedly difficult</option>
                <option value="Plan was too large">Planned too much / Overloaded schedule</option>
                <option value="Distracted">Distracted / Procrastination</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="dailyReflectionText" className="block text-xs font-semibold text-slate-300 mb-1">
                One takeaway for tomorrow
              </label>
              <input
                id="dailyReflectionText"
                type="text"
                value={dailyReflection}
                onChange={(e) => setDailyReflection(e.target.value)}
                placeholder="e.g. Start Quant in the morning when energy is high"
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {dailySubmitted ? 'Update Reflection' : 'Save Daily Review'}
              </button>

              <button
                type="button"
                onClick={() => setCurrentView('planner')}
                className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 font-semibold"
              >
                <span>Plan tomorrow</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Weekly Review Card */}
        <div className="p-6 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
          <div className="flex items-center justify-between border-b border-[#273450] pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Sunday Weekly Retrospective</span>
              </h3>
              <p className="text-xs text-slate-400">Calibrate study load for next week</p>
            </div>
            {weeklySubmitted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3.5 h-3.5" />
                Submitted
              </span>
            )}
          </div>

          <form onSubmit={handleSaveWeeklyReview} className="space-y-4">
            <div>
              <label htmlFor="weeklyWhatWorked" className="block text-xs font-semibold text-slate-300 mb-1">
                What worked well this week?
              </label>
              <input
                id="weeklyWhatWorked"
                type="text"
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                placeholder="e.g. Consistent 45 mins English vocab practice"
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="weeklyWhatMissed" className="block text-xs font-semibold text-slate-300 mb-1">
                What was missed or felt too heavy?
              </label>
              <input
                id="weeklyWhatMissed"
                type="text"
                value={whatMissed}
                onChange={(e) => setWhatMissed(e.target.value)}
                placeholder="e.g. Skipped 2 GK revision sets due to long Quant sessions"
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="weeklyDecisionSelect" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Next week's plan calibration:
              </label>
              <select
                id="weeklyDecisionSelect"
                value={weeklyDecision}
                onChange={(e) => setWeeklyDecision(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Keep my plan">Keep my plan as is (Pacing feels good)</option>
                <option value="Simplify next week">Simplify next week (Reduce target burden)</option>
                <option value="Increase study load slightly">Increase study load slightly (Ready for more)</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                {weeklySubmitted ? 'Update Weekly Review' : 'Save Weekly Calibration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
