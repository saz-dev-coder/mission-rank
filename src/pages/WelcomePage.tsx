import React from 'react';
import { useApp } from '../context/AppContext';
import { Compass, Target, Clock, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export const WelcomePage: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Top Brand Bar */}
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-pink-500/20">
            MR
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Mission Rank</h1>
            <p className="text-[11px] text-slate-400">Govt Exam Study System</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
          SSC • Railway • Banking
        </div>
      </header>

      {/* Main Hero */}
      <main className="my-auto py-10 space-y-8">
        <div className="space-y-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141C32] border border-[#273450] text-xs font-medium text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Built for serious exam aspirants</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your exam prep, planned{' '}
            <span className="gradient-text-vibrant">
              one day at a time.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Mission Rank tells you exactly what to study next, when to study it, what measurable target to complete, and how your daily effort is progressing — without shame, fake motivation, or confusing complexity.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-[#141C32]/90 border border-[#273450] space-y-2 card-depth-3d">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Measurable Targets</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track 50 words, 30 questions with accuracy %, or GK chapters instead of vague task lists.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141C32]/90 border border-[#273450] space-y-2 card-depth-3d">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Realistic Time-Blocks</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Define study windows, detect scheduling conflicts, and run precision distraction-free focus sessions.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141C32]/90 border border-[#273450] space-y-2 card-depth-3d">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Zero-Shame Recovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Missed a session? Rebalance tasks gracefully to tomorrow or the weekend without guilt or broken streak shaming.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="button"
            onClick={() => setCurrentView('onboarding')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Set Up Your Study Plan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-400">
            Takes under 2 minutes • 100% stored securely on your device
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#273450]/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>© {new Date().getFullYear()} Mission Rank • Privacy-first Local Storage</span>
        <span>Independent study companion for government exam aspirants</span>
      </footer>
    </div>
  );
};
