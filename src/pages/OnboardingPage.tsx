import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ExamType, 
  CurrentStage, 
  SubjectType, 
  StudentProfile 
} from '../types';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const { saveProfile, setCurrentView } = useApp();

  // Form states
  const [firstName, setFirstName] = useState('');
  const [targetExam, setTargetExam] = useState<ExamType>('SSC CGL');
  const [targetYear, setTargetYear] = useState('2026');
  const [currentStage, setCurrentStage] = useState<CurrentStage>('Intermediate');
  const [strongestSubject, setStrongestSubject] = useState<SubjectType>('Reasoning');
  const [weakestSubject, setWeakestSubject] = useState<SubjectType>('General Awareness');
  
  // Availability
  const [weekdayStart, setWeekdayStart] = useState('17:00');
  const [weekdayEnd, setWeekdayEnd] = useState('21:30');
  const [weekdayHours, setWeekdayHours] = useState(4);
  const [weekdayFlexible, setWeekdayFlexible] = useState(false);

  const [weekendStart, setWeekendStart] = useState('09:00');
  const [weekendEnd, setWeekendEnd] = useState('18:00');
  const [weekendHours, setWeekendHours] = useState(7);
  const [weekendFlexible, setWeekendFlexible] = useState(false);

  // Preferences
  const [reminderTime, setReminderTime] = useState('07:30');
  const [reminderStyle, setReminderStyle] = useState<'Gentle' | 'Strict but respectful'>('Gentle');
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Validation
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!firstName.trim()) {
      errs.firstName = 'Please enter your first name so we can personalize your study plan.';
    } else if (firstName.trim().length < 2) {
      errs.firstName = 'Name must be at least 2 characters long.';
    }

    if (!targetExam) {
      errs.targetExam = 'Please select your target examination.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      // scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const newProfile: StudentProfile = {
      id: `std-${Date.now()}`,
      firstName: firstName.trim(),
      targetExam,
      targetYear: targetYear.trim() || undefined,
      currentStage,
      strongestSubject,
      weakestSubject,
      weekdayAvailability: {
        startTime: weekdayStart,
        endTime: weekdayEnd,
        flexibleHours: weekdayHours,
        isFlexible: weekdayFlexible,
      },
      weekendAvailability: {
        startTime: weekendStart,
        endTime: weekendEnd,
        flexibleHours: weekendHours,
        isFlexible: weekendFlexible,
      },
      preferredReminderTime: reminderTime,
      reminderStyle,
      theme,
      reduceMotion,
      createdAt: new Date().toISOString(),
    };

    saveProfile(newProfile);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 max-w-2xl mx-auto py-10 animate-fade-in">
      <div className="space-y-2 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
          MR
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Personalize Your Study Desk
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Tell Mission Rank about your exam and daily availability. All recommendations will be tailored to you and remain 100% editable.
        </p>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-bold">Please check the required fields:</p>
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              {Object.values(errors).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Identity & Exam Target */}
        <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 text-xs flex items-center justify-center font-mono-numbers">1</span>
            Exam & Profile
          </h3>

          <div>
            <label htmlFor="studentFirstName" className="block text-xs font-semibold text-slate-300 mb-1">
              Your First Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="studentFirstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Vikram or Priya"
              className={`w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border ${
                errors.firstName ? 'border-rose-500 focus:border-rose-500' : 'border-[#273450] focus:border-indigo-500'
              } text-white text-sm focus:outline-none transition-colors`}
            />
            {errors.firstName && (
              <p className="text-xs text-rose-400 mt-1">{errors.firstName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="targetExamSelect" className="block text-xs font-semibold text-slate-300 mb-1">
                Target Exam <span className="text-rose-400">*</span>
              </label>
              <select
                id="targetExamSelect"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value as ExamType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="SSC CGL">SSC CGL</option>
                <option value="SSC CHSL">SSC CHSL</option>
                <option value="SSC MTS">SSC MTS</option>
                <option value="SSC CPO">SSC CPO</option>
                <option value="Railway">Railway (RRB NTPC / Group D)</option>
                <option value="Banking">Banking (IBPS / SBI)</option>
                <option value="Other">Other Government Exam</option>
              </select>
            </div>

            <div>
              <label htmlFor="targetYearInput" className="block text-xs font-semibold text-slate-300 mb-1">
                Target Year (optional)
              </label>
              <input
                id="targetYearInput"
                type="text"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                placeholder="2026 / 2027"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500 font-mono-numbers"
              />
            </div>
          </div>

          <div>
            <label htmlFor="currentStageSelect" className="block text-xs font-semibold text-slate-300 mb-1">
              Current Preparation Stage
            </label>
            <select
              id="currentStageSelect"
              value={currentStage}
              onChange={(e) => setCurrentStage(e.target.value as CurrentStage)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner (Starting syllabus from scratch)</option>
              <option value="Restarting">Restarting (Returning to prep after gap)</option>
              <option value="Intermediate">Intermediate (Completed 40-70% syllabus)</option>
              <option value="Revision phase">Revision phase (Giving mocks & revising)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="strongestSubjectSelect" className="block text-xs font-semibold text-slate-300 mb-1">
                Strongest Subject
              </label>
              <select
                id="strongestSubjectSelect"
                value={strongestSubject}
                onChange={(e) => setStrongestSubject(e.target.value as SubjectType)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="Quant">Quant</option>
                <option value="English">English</option>
                <option value="Reasoning">Reasoning</option>
                <option value="General Awareness">General Awareness</option>
                <option value="Computer">Computer</option>
              </select>
            </div>

            <div>
              <label htmlFor="weakestSubjectSelect" className="block text-xs font-semibold text-slate-300 mb-1">
                Weakest Subject (Needs Attention)
              </label>
              <select
                id="weakestSubjectSelect"
                value={weakestSubject}
                onChange={(e) => setWeakestSubject(e.target.value as SubjectType)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="General Awareness">General Awareness</option>
                <option value="English">English</option>
                <option value="Quant">Quant</option>
                <option value="Reasoning">Reasoning</option>
                <option value="Computer">Computer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Study Availability */}
        <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 text-xs flex items-center justify-center font-mono-numbers">2</span>
            Daily Study Availability
          </h3>

          {/* Weekday Availability */}
          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#273450] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Weekday Study Window</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>Flexible hours</span>
                <input
                  type="checkbox"
                  checked={weekdayFlexible}
                  onChange={(e) => setWeekdayFlexible(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>
            </div>

            {!weekdayFlexible ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="weekdayStartTime" className="block text-[10px] text-slate-400 mb-1">Available From</label>
                  <input
                    id="weekdayStartTime"
                    type="time"
                    value={weekdayStart}
                    onChange={(e) => setWeekdayStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
                <div>
                  <label htmlFor="weekdayEndTime" className="block text-[10px] text-slate-400 mb-1">Available Until</label>
                  <input
                    id="weekdayEndTime"
                    type="time"
                    value={weekdayEnd}
                    onChange={(e) => setWeekdayEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="weekdayHoursInput" className="block text-[10px] text-slate-400 mb-1">Hours per weekday</label>
                <input
                  id="weekdayHoursInput"
                  type="number"
                  min="1"
                  max="14"
                  value={weekdayHours}
                  onChange={(e) => setWeekdayHours(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                />
              </div>
            )}
          </div>

          {/* Weekend Availability */}
          <div className="p-3.5 rounded-xl bg-[#0B1020] border border-[#273450] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Weekend Study Window</span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <span>Flexible hours</span>
                <input
                  type="checkbox"
                  checked={weekendFlexible}
                  onChange={(e) => setWeekendFlexible(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
              </label>
            </div>

            {!weekendFlexible ? (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="weekendStartTime" className="block text-[10px] text-slate-400 mb-1">Available From</label>
                  <input
                    id="weekendStartTime"
                    type="time"
                    value={weekendStart}
                    onChange={(e) => setWeekendStart(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
                <div>
                  <label htmlFor="weekendEndTime" className="block text-[10px] text-slate-400 mb-1">Available Until</label>
                  <input
                    id="weekendEndTime"
                    type="time"
                    value={weekendEnd}
                    onChange={(e) => setWeekendEnd(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label htmlFor="weekendHoursInput" className="block text-[10px] text-slate-400 mb-1">Hours per weekend day</label>
                <input
                  id="weekendHoursInput"
                  type="number"
                  min="1"
                  max="16"
                  value={weekendHours}
                  onChange={(e) => setWeekendHours(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Preferences & Reminders */}
        <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-mono-numbers">3</span>
            Reminders & App Experience
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="reminderTimeInput" className="block text-xs font-semibold text-slate-300 mb-1">
                Preferred Daily Reminder Time
              </label>
              <input
                id="reminderTimeInput"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
              />
            </div>

            <div>
              <label htmlFor="reminderStyleSelect" className="block text-xs font-semibold text-slate-300 mb-1">
                Reminder Tone
              </label>
              <select
                id="reminderStyleSelect"
                value={reminderStyle}
                onChange={(e) => setReminderStyle(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="Gentle">Gentle (Calm & supportive)</option>
                <option value="Strict but respectful">Strict but respectful (Direct execution)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label htmlFor="themeSelect" className="block text-xs font-semibold text-slate-300 mb-1">Theme</label>
              <select
                id="themeSelect"
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="dark">Dark Theme (Default)</option>
                <option value="light">Light Theme</option>
                <option value="system">Follow System</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <input
                id="reduceMotionInput"
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => setReduceMotion(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="reduceMotionInput" className="text-xs text-slate-300 cursor-pointer">
                Reduce motion (disable non-essential animations)
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setCurrentView('welcome')}
            className="text-xs text-slate-400 hover:text-white"
          >
            ← Back to overview
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Launch Mission Rank</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
