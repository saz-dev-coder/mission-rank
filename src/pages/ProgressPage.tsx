import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { SubjectType, MockTestLog } from '../types';
import { getTodayDateString, formatDateReadable, addDaysToDateString } from '../utils/dateUtils';
import { calculateDailyScore } from '../utils/scoreCalculator';
import { getSubjectColor } from '../components/TaskCard';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar, 
  Award, 
  Plus, 
  AlertCircle,
  FileCheck2,
  X
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { profile, tasks, completedFocusSessions, mockTests, addMockTestLog } = useApp();

  const [trendRange, setTrendRange] = useState<7 | 30>(7);
  const [showAddMockModal, setShowAddMockModal] = useState(false);

  // New mock form state
  const [mockTitle, setMockTitle] = useState('');
  const [mockScore, setMockScore] = useState(130);
  const [mockMaxScore, setMockMaxScore] = useState(200);
  const [mockAccuracy, setMockAccuracy] = useState(82);
  const [mockNotes, setMockNotes] = useState('');
  const [mockDate, setMockDate] = useState(getTodayDateString());

  const todayStr = getTodayDateString();

  // Days list for trend
  const trendDays = useMemo(() => {
    const list = [];
    for (let i = trendRange - 1; i >= 0; i--) {
      const dStr = addDaysToDateString(todayStr, -i);
      const dayTasks = tasks.filter(t => t.plannedDate === dStr);
      const score = calculateDailyScore(dayTasks, dStr, tasks);

      let plannedM = 0;
      let actualM = 0;
      dayTasks.forEach(t => {
        if (t.category !== 'availability_block') {
          plannedM += t.plannedDurationMinutes || 0;
          actualM += t.actualCompletedDurationMinutes || 0;
        }
      });

      list.push({
        date: dStr,
        label: dStr.slice(5), // MM-DD
        score: score.hasTasks ? score.total : null,
        plannedM,
        actualM,
      });
    }
    return list;
  }, [tasks, trendRange, todayStr]);

  // Overall Task Completion stats
  const taskStats = useMemo(() => {
    const regular = tasks.filter(t => t.category !== 'availability_block');
    const total = regular.length;
    const completed = regular.filter(t => t.status === 'Completed').length;
    const partial = regular.filter(t => t.status === 'Partially complete').length;
    const skipped = regular.filter(t => t.status === 'Skipped').length;
    const overdue = regular.filter(t => t.plannedDate < todayStr && t.status !== 'Completed' && t.status !== 'Skipped').length;

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, partial, skipped, overdue, rate };
  }, [tasks, todayStr]);

  // Subject-wise stats
  const subjectStats = useMemo(() => {
    const subjects: SubjectType[] = ['Quant', 'English', 'Reasoning', 'General Awareness', 'Computer', 'Mock Test', 'Revision'];
    return subjects.map(sub => {
      const subTasks = tasks.filter(t => t.subject === sub && t.category !== 'availability_block');
      const total = subTasks.length;
      const completed = subTasks.filter(t => t.status === 'Completed').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Accuracy
      const practiceTasks = subTasks.filter(t => (t.attemptedQuestions || 0) > 0);
      let avgAcc = 0;
      if (practiceTasks.length > 0) {
        const sumAcc = practiceTasks.reduce((acc, t) => acc + (t.calculatedAccuracy || 0), 0);
        avgAcc = Math.round(sumAcc / practiceTasks.length);
      }

      return {
        subject: sub,
        total,
        completed,
        rate,
        avgAcc: practiceTasks.length > 0 ? avgAcc : null,
      };
    }).filter(s => s.total > 0);
  }, [tasks]);

  // Streak (secondary information)
  const streakDays = useMemo(() => {
    let streak = 0;
    let checkDate = todayStr;
    for (let i = 0; i < 30; i++) {
      const dayTasks = tasks.filter(t => t.plannedDate === checkDate && t.status === 'Completed');
      if (dayTasks.length > 0) {
        streak++;
        checkDate = addDaysToDateString(checkDate, -1);
      } else {
        // If today has no completed tasks yet, don't break yesterday's streak
        if (i === 0) {
          checkDate = addDaysToDateString(checkDate, -1);
          continue;
        }
        break;
      }
    }
    return streak;
  }, [tasks, todayStr]);

  const handleSaveMockTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mockTitle.trim()) return;

    addMockTestLog({
      title: mockTitle.trim(),
      score: mockScore,
      maxScore: mockMaxScore,
      accuracy: mockAccuracy,
      notes: mockNotes.trim(),
      date: mockDate,
    });

    setShowAddMockModal(false);
    setMockTitle('');
    setMockNotes('');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-400" />
            <span>Progress Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Objective data on your consistency, focus adherence, and exam readiness
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddMockModal(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 hover:from-amber-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Mock Test</span>
        </button>
      </div>

      {/* Honest Diagnostic Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 leading-relaxed flex items-start gap-2.5">
        <Award className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <span>
          <strong>Analytical Principle:</strong> Task completion tracks study consistency. Full mock test performance and timed practice accuracy are far better indicators of actual exam readiness than task streaks.
        </span>
      </div>

      {/* Key Metric Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#141C32] border border-[#273450] space-y-1 card-depth-3d">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Completion Rate</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono-numbers">
            {taskStats.rate}%
          </div>
          <span className="text-[11px] text-slate-500">
            {taskStats.completed} of {taskStats.total} tasks
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141C32] border border-[#273450] space-y-1 card-depth-3d">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Current Backlog</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono-numbers">
            {taskStats.overdue}
          </div>
          <span className="text-[11px] text-slate-500">
            Overdue tasks needing rebalance
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141C32] border border-[#273450] space-y-1 card-depth-3d">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Study Streak</span>
          <div className="text-2xl font-extrabold text-pink-400 font-mono-numbers">
            {streakDays} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Secondary consistency signal
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-[#141C32] border border-[#273450] space-y-1 card-depth-3d">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Mocks Logged</span>
          <div className="text-2xl font-extrabold text-sky-400 font-mono-numbers">
            {mockTests.length}
          </div>
          <span className="text-[11px] text-slate-500">
            Full length / sectional tests
          </span>
        </div>
      </div>

      {/* Daily Score Trend 2D SVG Chart */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Daily Execution Score Trend</span>
            </h3>
            <p className="text-xs text-slate-400">Tracks daily planning hygiene and task execution</p>
          </div>

          <div className="flex items-center rounded-xl bg-[#0B1020] border border-[#273450] p-0.5">
            <button
              type="button"
              onClick={() => setTrendRange(7)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                trendRange === 7 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTrendRange(30)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                trendRange === 30 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* 2D Bar & Line Chart Representation */}
        <div className="pt-2">
          <div className="h-44 flex items-end justify-between gap-1 sm:gap-2 px-1 border-b border-[#273450]">
            {trendDays.map((item, idx) => {
              const heightPercent = item.score !== null ? Math.max(8, item.score) : 4;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-white whitespace-nowrap font-mono-numbers">
                      {item.score !== null ? `${item.score}/100` : 'No plan'} • {item.actualM}m
                    </span>
                  </div>

                  <div
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${
                      item.score === null
                        ? 'bg-slate-800'
                        : item.score >= 80
                        ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                        : item.score >= 60
                        ? 'bg-gradient-to-t from-sky-600 to-indigo-400'
                        : 'bg-gradient-to-t from-pink-600 to-rose-400'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[9px] font-mono-numbers text-slate-400 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 px-1">
            <span>Score (0 to 100)</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-400" /> 80+ Excellent</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-sky-400" /> 60-79 On Track</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-400" /> &lt;60 Recoverable</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-Wise Mastery & Practice Accuracy */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-pink-400" />
          <span>Subject-Wise Performance & Accuracy</span>
        </h3>

        {subjectStats.length > 0 ? (
          <div className="space-y-3">
            {subjectStats.map(s => {
              const theme = getSubjectColor(s.subject);
              return (
                <div key={s.subject} className="p-3 rounded-xl bg-[#0B1020] border border-[#273450] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}>
                      {s.subject}
                    </span>

                    <div className="flex items-center gap-3 font-mono-numbers">
                      {s.avgAcc !== null && (
                        <span className="text-emerald-400 font-bold">
                          {s.avgAcc}% accuracy
                        </span>
                      )}
                      <span className="text-slate-300">
                        {s.completed} / {s.total} completed ({s.rate}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 rounded-full bg-[#1F293D] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-pink-500 to-indigo-500"
                      style={{ width: `${s.rate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Complete tasks across Quant, English, Reasoning, and GK to see your subject breakdown.
          </p>
        )}
      </div>

      {/* Mock Test Performance Tracker */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Mock Test History</span>
            </h3>
            <p className="text-xs text-slate-400">Track full test scores, sectional speed, and mistakes</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddMockModal(true)}
            className="text-xs text-indigo-400 hover:text-white font-semibold cursor-pointer"
          >
            + Add result
          </button>
        </div>

        {mockTests.length > 0 ? (
          <div className="space-y-2.5">
            {mockTests.map(mock => (
              <div
                key={mock.id}
                className="p-3.5 rounded-xl bg-[#0B1020] border border-[#273450] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-white">{mock.title}</h5>
                    <span className="text-[10px] text-slate-500 font-mono-numbers">
                      {formatDateReadable(mock.date)}
                    </span>
                  </div>
                  {mock.notes && (
                    <p className="text-[11px] text-slate-400 italic mt-0.5">
                      "{mock.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono-numbers self-end sm:self-auto">
                  <span className="text-white font-bold">
                    Score: {mock.score} / {mock.maxScore}
                  </span>
                  <span className="text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {mock.accuracy}% Acc
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-[#0B1020]/60 border border-dashed border-[#273450] text-center text-xs text-slate-400 space-y-1">
            <p>Add your first mock test result to begin tracking exam readiness.</p>
          </div>
        )}
      </div>

      {/* Log Mock Test Modal */}
      {showAddMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-[#273450] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Log Mock Test Result</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMockModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMockTest} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Test Title / Series
                </label>
                <input
                  type="text"
                  value={mockTitle}
                  onChange={(e) => setMockTitle(e.target.value)}
                  placeholder="e.g. SSC CGL Full Mock #12 (Testbook/Oliveboard)"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Score
                  </label>
                  <input
                    type="number"
                    value={mockScore}
                    onChange={(e) => setMockScore(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    value={mockMaxScore}
                    onChange={(e) => setMockMaxScore(parseFloat(e.target.value) || 200)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Accuracy (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={mockAccuracy}
                    onChange={(e) => setMockAccuracy(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={mockDate}
                    onChange={(e) => setMockDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mistake Notes / Analysis
                </label>
                <input
                  type="text"
                  value={mockNotes}
                  onChange={(e) => setMockNotes(e.target.value)}
                  placeholder="e.g. Lost 8 marks in Geometry; English vocab was strong"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-pink-600 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
