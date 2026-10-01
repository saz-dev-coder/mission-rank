import React, { useState } from 'react';
import { DailyScoreBreakdown } from '../types';
import { Info, X, CheckCircle2, Clock, Target, RotateCcw, ShieldCheck } from 'lucide-react';

interface DailyScoreOrbProps {
  scoreData: DailyScoreBreakdown;
  plannedMinutes: number;
  actualMinutes: number;
}

export const DailyScoreOrb: React.FC<DailyScoreOrbProps> = ({ scoreData, plannedMinutes, actualMinutes }) => {
  const [showExplanationModal, setShowExplanationModal] = useState(false);

  const { total, band, breakdown, hasTasks } = {
    total: scoreData.total,
    band: scoreData.band,
    breakdown: scoreData,
    hasTasks: scoreData.hasTasks,
  };

  // Color config based on score band with vibrant gradient accents
  const getBandStyles = () => {
    switch (band) {
      case 'Excellent':
        return {
          textColor: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          ringGradient: 'from-emerald-400 via-teal-400 to-green-500',
          glow: 'rgba(16, 185, 129, 0.25)',
        };
      case 'On track':
        return {
          textColor: 'text-sky-400',
          badgeBg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          ringGradient: 'from-sky-400 via-indigo-400 to-blue-500',
          glow: 'rgba(56, 189, 248, 0.25)',
        };
      case 'Recoverable':
        return {
          textColor: 'text-amber-400',
          badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          ringGradient: 'from-amber-400 via-orange-400 to-yellow-500',
          glow: 'rgba(245, 158, 11, 0.25)',
        };
      case 'At risk':
        return {
          textColor: 'text-rose-400',
          badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          ringGradient: 'from-rose-500 via-pink-500 to-red-600',
          glow: 'rgba(244, 63, 94, 0.25)',
        };
      default:
        return {
          textColor: 'text-slate-400',
          badgeBg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          ringGradient: 'from-slate-500 via-slate-600 to-slate-700',
          glow: 'rgba(148, 163, 184, 0.1)',
        };
    }
  };

  const bandStyle = getBandStyles();
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (hasTasks ? (total / 100) * circumference : 0);

  return (
    <>
      <div className="relative rounded-2xl bg-[#141C32]/90 border border-[#273450] p-5 shadow-xl backdrop-blur-md overflow-hidden card-depth-3d">
        {/* Subtle background ambient mesh */}
        <div 
          className="absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 opacity-30"
          style={{ background: bandStyle.glow }}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          {/* 3D Depth Score Orb */}
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32 -rotate-90 transform" viewBox="0 0 120 120">
              {/* Background Track with dark blue depth */}
              <circle
                cx="60"
                cy="60"
                r="52"
                className="text-[#1E293B]"
                strokeWidth="9"
                stroke="currentColor"
                fill="transparent"
              />
              {/* Animated Progress Gradient Ring */}
              <defs>
                <linearGradient id="scoreOrbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EC4899" />
                  <stop offset="35%" stopColor="#EF4444" />
                  <stop offset="70%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="52"
                stroke={hasTasks ? "url(#scoreOrbGradient)" : "#475569"}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Center Content with 3D inset shadow */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {hasTasks ? (
                <>
                  <span className="text-3xl font-extrabold tracking-tight font-mono-numbers text-white drop-shadow-md">
                    {total}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
                    / 100
                  </span>
                </>
              ) : (
                <span className="text-sm font-semibold text-slate-300 px-2 leading-tight">
                  No plan
                </span>
              )}
            </div>
          </div>

          {/* Details & Status */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${bandStyle.badgeBg}`}>
                {band}
              </span>
              <button
                type="button"
                onClick={() => setShowExplanationModal(true)}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded px-1"
                aria-label="How is this score calculated?"
              >
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>How is this calculated?</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 line-clamp-2">
              {scoreData.explanation}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  Study time: <strong className="text-white font-mono-numbers">{actualMinutes}m</strong>
                  {plannedMinutes > 0 && <span className="text-slate-500"> / {plannedMinutes}m</span>}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-[#273450] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-base">
                  MR
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Daily Execution Score</h3>
                  <p className="text-xs text-slate-400">Calculated strictly out of 100 points</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close explanation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown Items */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1020]/60 border border-[#273450]/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-white">Priority Task Completion</p>
                    <p className="text-[11px] text-slate-400">Must do tasks are weighted heavily over optional tasks</p>
                  </div>
                </div>
                <div className="font-mono-numbers font-bold text-white text-right">
                  {breakdown.mustDoScore} <span className="text-slate-500 font-normal">/ 45</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1020]/60 border border-[#273450]/60">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="font-semibold text-white">Study & Focus Time</p>
                    <p className="text-[11px] text-slate-400">Actual active focus time vs your planned commitment</p>
                  </div>
                </div>
                <div className="font-mono-numbers font-bold text-white text-right">
                  {breakdown.studyTimeScore} <span className="text-slate-500 font-normal">/ 25</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1020]/60 border border-[#273450]/60">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-pink-400" />
                  <div>
                    <p className="font-semibold text-white">Practice Quality & Accuracy</p>
                    <p className="text-[11px] text-slate-400">Measured by question accuracy and target milestone completion</p>
                  </div>
                </div>
                <div className="font-mono-numbers font-bold text-white text-right">
                  {breakdown.practiceScore} <span className="text-slate-500 font-normal">/ 15</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1020]/60 border border-[#273450]/60">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-semibold text-white">Revision Consistency</p>
                    <p className="text-[11px] text-slate-400">Scheduled revision tasks completed</p>
                  </div>
                </div>
                <div className="font-mono-numbers font-bold text-white text-right">
                  {breakdown.revisionScore} <span className="text-slate-500 font-normal">/ 10</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1020]/60 border border-[#273450]/60">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="font-semibold text-white">Planning Hygiene</p>
                    <p className="text-[11px] text-slate-400">Intentional scheduling and resolving overdue items</p>
                  </div>
                </div>
                <div className="font-mono-numbers font-bold text-white text-right">
                  {breakdown.planningHygieneScore} <span className="text-slate-500 font-normal">/ 5</span>
                </div>
              </div>
            </div>

            {/* Transparent Product Guarantee / Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 leading-relaxed">
              <strong>Transparent Notice:</strong> Daily execution score tracks planning and study consistency. It is not an exam-readiness score, SSC rank, or job selection prediction.
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExplanationModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
