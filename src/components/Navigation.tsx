import React from 'react';
import { useApp } from '../context/AppContext';
import { formatDateReadable, getTodayDateString } from '../utils/dateUtils';
import { 
  Compass, 
  Calendar, 
  Clock, 
  Layers, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Plus,
  Bell,
  Sparkles
} from 'lucide-react';

interface NavigationProps {
  onOpenQuickAdd: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onOpenQuickAdd }) => {
  const { currentView, setCurrentView, profile, activeFocusSession } = useApp();

  const isTimerRunning = Boolean(activeFocusSession && !activeFocusSession.isPaused);
  const firstLetter = profile?.firstName?.charAt(0).toUpperCase() || 'M';

  const navItems = [
    { id: 'today', label: 'Today', icon: Compass },
    { id: 'planner', label: 'Planner', icon: Calendar },
    { id: 'focus', label: 'Focus', icon: Clock, badge: isTimerRunning },
    { id: 'tasks', label: 'Tasks', icon: Layers },
    { id: 'progress', label: 'Progress', icon: BarChart3, desktopOnly: true },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, desktopOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#0E1527] border-r border-[#273450] z-30 select-none">
        {/* Brand */}
        <div className="p-5 border-b border-[#273450] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-pink-500/20">
              MR
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                Mission Rank
              </h1>
              <p className="text-[11px] text-slate-400 mt-1">Govt Exam Desk</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600/15 via-purple-600/15 to-indigo-600/20 text-white border border-pink-500/30 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Add Button in Sidebar */}
        <div className="p-3 border-t border-[#273450]">
          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add Study Task</span>
          </button>
        </div>

        {/* Student Profile snippet */}
        {profile && (
          <div className="p-3.5 border-t border-[#273450] bg-[#0A0F1E] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xs">
              {firstLetter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{profile.firstName}</p>
              <p className="text-[10px] text-slate-400 truncate">{profile.targetExam}</p>
            </div>
          </div>
        )}
      </aside>

      {/* Desktop Top Bar */}
      <header className="hidden lg:flex fixed top-0 right-0 left-64 h-16 bg-[#0E1527]/80 backdrop-blur-md border-b border-[#273450] z-20 items-center justify-between px-8">
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span className="font-semibold text-white">{formatDateReadable(getTodayDateString())}</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Targeting {profile?.targetExam || 'Government Exam'}</span>
        </div>

        <div className="flex items-center gap-4">
          {isTimerRunning && (
            <button
              type="button"
              onClick={() => setCurrentView('focus')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Timer Running</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQuickAdd}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Quick Add</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentView('settings')}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-extrabold text-xs cursor-pointer"
            aria-label="Profile Settings"
          >
            {firstLetter}
          </button>
        </div>
      </header>

      {/* Mobile Floating Quick Add Button */}
      <button
        type="button"
        onClick={onOpenQuickAdd}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-pink-600 via-rose-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/35 active:scale-90 transition-all cursor-pointer"
        aria-label="Create new study task"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Mobile Bottom Navigation Bar (5 clean items for 320px+ viewports) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E1527]/95 backdrop-blur-lg border-t border-[#273450] px-1 py-1.5 flex items-center justify-around">
        {navItems.filter(item => !item.desktopOnly).map(item => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentView(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-colors relative cursor-pointer ${
                isActive ? 'text-pink-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {item.badge && (
                <span className="absolute top-1 right-1/4 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
