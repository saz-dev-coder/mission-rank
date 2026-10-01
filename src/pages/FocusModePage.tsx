import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { formatSecondsToHHMMSS, formatTime12h, getTodayDateString } from '../utils/dateUtils';
import { playSoundTone, startAlarmLoop, stopAlarmLoop, getIsAlarmPlaying } from '../utils/audio';
import { getSubjectColor } from '../components/TaskCard';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Minus, 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  ArrowLeft, 
  Clock, 
  Target, 
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export const FocusModePage: React.FC = () => {
  const {
    tasks,
    activeFocusSession,
    activeFocusTaskId,
    startFocusSession,
    pauseFocusSession,
    resumeFocusSession,
    endFocusSession,
    addFocusMinutes,
    updateSessionTargetProgress,
    alarmPreferences,
    updateAlarmPreferences,
    setCurrentView,
  } = useApp();

  const [tick, setTick] = useState(0);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showAlarmConfig, setShowAlarmConfig] = useState(false);

  // Interval timer tick for UI refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 500);
    return () => clearInterval(timer);
  }, []);

  const currentTask = tasks.find(t => t.id === (activeFocusSession?.taskId || activeFocusTaskId));

  // Timestamp-based calculation:
  // Elapsed seconds:
  let elapsedSeconds = 0;
  if (activeFocusSession) {
    elapsedSeconds = activeFocusSession.accumulatedActiveSeconds;
    if (!activeFocusSession.isPaused) {
      const now = Date.now();
      const currentSpan = Math.floor((now - activeFocusSession.startTimestamp) / 1000);
      elapsedSeconds += Math.max(0, currentSpan);
    }
  }

  const plannedSeconds = (activeFocusSession?.plannedDurationMinutes || currentTask?.plannedDurationMinutes || 25) * 60;
  const remainingSeconds = Math.max(0, plannedSeconds - elapsedSeconds);

  // Check if countdown expired
  useEffect(() => {
    if (activeFocusSession && !activeFocusSession.isPaused && remainingSeconds === 0 && !alarmTriggered) {
      setAlarmTriggered(true);
      if (alarmPreferences.enabled) {
        startAlarmLoop(
          alarmPreferences.sound,
          alarmPreferences.volume,
          alarmPreferences.vibration,
          alarmPreferences.autoStopSeconds,
          () => {
            // Callback on auto-stop
          }
        );
      }
    }
  }, [activeFocusSession, remainingSeconds, alarmTriggered, alarmPreferences]);

  // Clean up alarm on unmount
  useEffect(() => {
    return () => {
      stopAlarmLoop();
    };
  }, []);

  const handleStopAlarm = () => {
    stopAlarmLoop();
    setAlarmTriggered(false);
  };

  const handleBack = () => {
    if (activeFocusSession && !activeFocusSession.isPaused) {
      setShowExitConfirm(true);
    } else {
      setCurrentView('today');
    }
  };

  // If no active session or task, let user select from today's pending tasks
  if (!currentTask || !activeFocusSession) {
    const today = getTodayDateString();
    const availableTasks = tasks.filter(
      t => t.plannedDate === today && t.category !== 'availability_block' && t.status !== 'Completed' && t.status !== 'Skipped'
    );

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in p-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentView('today')}
            className="p-2 rounded-xl bg-[#141C32] border border-[#273450] text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white">Focus Mode</h2>
            <p className="text-xs text-slate-400">Select a study task to begin your distraction-free session</p>
          </div>
        </div>

        {availableTasks.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Tasks for Today
            </h3>
            <div className="grid grid-cols-1 gap-2.5">
              {availableTasks.map(t => {
                const theme = getSubjectColor(t.subject);
                return (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-[#141C32] border border-[#273450] hover:border-indigo-500/50 flex items-center justify-between gap-3 transition-all card-depth-3d"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${theme.bg} ${theme.text} ${theme.border}`}>
                          {t.subject}
                        </span>
                        <span className="text-xs font-mono-numbers text-slate-400">
                          {t.plannedDurationMinutes}m
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{t.title}</h4>
                      {t.targetValue > 0 && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          Target: {t.targetValue} {t.targetUnit}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => startFocusSession(t.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Focus</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-[#141C32] border border-[#273450] text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Pending Tasks</h3>
            <p className="text-xs text-slate-400">
              All tasks for today are completed or no tasks have been planned yet.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('today')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Return to Today
            </button>
          </div>
        )}
      </div>
    );
  }

  const subjectTheme = getSubjectColor(currentTask.subject);
  const targetTotal = currentTask.targetValue || 0;
  const currentProgress = activeFocusSession.currentTargetProgress;
  const attempted = activeFocusSession.attemptedQuestions ?? currentTask.attemptedQuestions ?? 0;
  const correct = activeFocusSession.correctAnswers ?? currentTask.correctAnswers ?? 0;
  const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in p-3 sm:p-4">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 rounded-xl bg-[#141C32] border border-[#273450] text-slate-300 hover:text-white transition-colors cursor-pointer"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 min-w-0">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${subjectTheme.bg} ${subjectTheme.text} ${subjectTheme.border}`}>
              {currentTask.subject}
            </span>
            {currentTask.subtopic && (
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[140px]">
                • {currentTask.subtopic}
              </span>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-bold text-white truncate px-2 mt-0.5">
            {currentTask.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowAlarmConfig(!showAlarmConfig)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            showAlarmConfig ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#141C32] border-[#273450] text-slate-300 hover:text-white'
          }`}
          aria-label="Alarm Settings"
        >
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Alarm Settings Flyout */}
      {showAlarmConfig && (
        <div className="p-4 rounded-2xl bg-[#0F172A] border border-[#273450] space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#273450] pb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-indigo-400" />
              Focus Alarm Controls
            </span>
            <button
              type="button"
              onClick={() => setShowAlarmConfig(false)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="alarmSoundSelect" className="block text-[11px] text-slate-400 mb-1">Alarm Sound</label>
              <select
                id="alarmSoundSelect"
                value={alarmPreferences.sound}
                onChange={(e) => updateAlarmPreferences({ sound: e.target.value as any })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs"
              >
                <option value="Soft bell">Soft bell</option>
                <option value="Clear chime">Clear chime</option>
                <option value="Digital beep">Digital beep</option>
              </select>
            </div>

            <div>
              <label htmlFor="volumeSlider" className="block text-[11px] text-slate-400 mb-1">
                Volume: {alarmPreferences.volume}%
              </label>
              <input
                id="volumeSlider"
                type="range"
                min="10"
                max="100"
                value={alarmPreferences.volume}
                onChange={(e) => updateAlarmPreferences({ volume: parseInt(e.target.value, 10) })}
                className="w-full accent-pink-500 cursor-pointer"
              />
            </div>

            <div>
              <label htmlFor="focusAutoStopSelect" className="block text-[11px] text-slate-400 mb-1">Auto-Stop</label>
              <select
                id="focusAutoStopSelect"
                value={alarmPreferences.autoStopSeconds || 5}
                onChange={(e) => updateAlarmPreferences({ autoStopSeconds: parseInt(e.target.value, 10) as 3 | 5 | 10 })}
                className="w-full px-2.5 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs"
              >
                <option value={3}>3 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => playSoundTone(alarmPreferences.sound, alarmPreferences.volume)}
                className="w-full py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold cursor-pointer"
              >
                Test Tone
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            For the most reliable timer and alarm, keep Mission Rank open during your session.
          </p>
        </div>
      )}

      {/* Alarm Fired Banner */}
      {alarmTriggered && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-indigo-500/20 border-2 border-rose-500 text-center space-y-3 animate-bounce shadow-2xl">
          <div className="flex items-center justify-center gap-2 text-rose-400 font-bold text-base">
            <Sparkles className="w-5 h-5 text-rose-400" />
            <span>Target Session Time Reached!</span>
          </div>
          <p className="text-xs text-slate-200">
            You completed your planned {activeFocusSession.plannedDurationMinutes} minutes of focus.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleStopAlarm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg cursor-pointer"
            >
              Stop Alarm
            </button>
            <button
              type="button"
              onClick={() => {
                handleStopAlarm();
                addFocusMinutes(5);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              +5 Minutes
            </button>
            <button
              type="button"
              onClick={() => {
                handleStopAlarm();
                addFocusMinutes(10);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
            >
              +10 Minutes
            </button>
          </div>
        </div>
      )}

      {/* Big Clocks Center Card */}
      <div className="relative rounded-3xl bg-[#141C32] border border-[#273450] p-6 sm:p-8 shadow-2xl text-center space-y-6 overflow-hidden card-depth-3d">
        {/* Subtle Ambient Glow Mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-pink-500/5 to-transparent pointer-events-none" />

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#0B1020] border border-[#273450]">
          <span className={`w-2 h-2 rounded-full ${activeFocusSession.isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
          <span className="text-slate-300">
            {activeFocusSession.isPaused ? 'Focus Paused' : 'Active Focus Session'}
          </span>
        </div>

        {/* Elapsed Active Focus Clock (Always HH:MM:SS) */}
        <div>
          <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold block mb-1">
            Active Focus Time
          </span>
          <div className="text-5xl sm:text-7xl font-extrabold tracking-tight font-mono-numbers text-white drop-shadow-lg">
            {formatSecondsToHHMMSS(elapsedSeconds)}
          </div>
        </div>

        {/* Remaining Countdown Display */}
        <div className="p-3 rounded-2xl bg-[#0B1020]/70 border border-[#273450] max-w-sm mx-auto flex items-center justify-between px-5">
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block font-medium">Session Countdown</span>
            <span className="text-lg font-bold font-mono-numbers text-sky-400">
              {formatSecondsToHHMMSS(remainingSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => addFocusMinutes(5)}
              className="px-2 py-1 rounded-lg bg-[#141C32] hover:bg-slate-800 text-[11px] font-mono-numbers text-slate-300 border border-[#273450] cursor-pointer"
              title="Add 5 minutes to countdown"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => addFocusMinutes(10)}
              className="px-2 py-1 rounded-lg bg-[#141C32] hover:bg-slate-800 text-[11px] font-mono-numbers text-slate-300 border border-[#273450] cursor-pointer"
              title="Add 10 minutes to countdown"
            >
              +10m
            </button>
          </div>
        </div>

        {/* Measurable Target Interactive Controls */}
        {targetTotal > 0 && (
          <div className="p-4 rounded-2xl bg-[#0B1020]/70 border border-[#273450] max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-pink-400" />
                Target Progress
              </span>
              <span className="text-slate-400 font-mono-numbers">
                <strong className="text-white text-sm">{currentProgress}</strong> / {targetTotal} {currentTask.targetUnit}
              </span>
            </div>

            {/* Target Increment / Decrement Buttons */}
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => updateSessionTargetProgress(Math.max(0, currentProgress - 1))}
                className="w-10 h-10 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Decrease target count"
              >
                <Minus className="w-5 h-5" />
              </button>

              <input
                type="number"
                min="0"
                value={currentProgress}
                onChange={(e) => updateSessionTargetProgress(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-24 text-center py-1.5 rounded-xl bg-[#141C32] border border-[#273450] text-xl font-bold font-mono-numbers text-white focus:outline-none focus:border-pink-500"
              />

              <button
                type="button"
                onClick={() => updateSessionTargetProgress(currentProgress + 1)}
                className="w-10 h-10 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                aria-label="Increase target count"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full h-2 rounded-full bg-[#1F293D] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-pink-500 via-rose-500 to-emerald-400"
                style={{ width: `${Math.min(100, (currentProgress / targetTotal) * 100)}%` }}
              />
            </div>

            {/* If Practice Task: Question Accuracy tracker */}
            {(currentTask.targetUnit === 'Questions' || currentTask.taskType === 'Practice') && (
              <div className="pt-2 border-t border-[#273450] flex items-center justify-between text-xs">
                <span className="text-slate-400">Questions:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Att"
                    value={attempted || ''}
                    onChange={(e) => updateSessionTargetProgress(currentProgress, parseInt(e.target.value, 10) || 0, correct)}
                    className="w-14 px-2 py-1 rounded bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers text-center"
                    title="Attempted questions"
                  />
                  <span className="text-slate-500">/</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Cor"
                    value={correct || ''}
                    onChange={(e) => updateSessionTargetProgress(currentProgress, attempted, parseInt(e.target.value, 10) || 0)}
                    className="w-14 px-2 py-1 rounded bg-[#141C32] border border-[#273450] text-white text-xs font-mono-numbers text-center"
                    title="Correct answers"
                  />
                  {attempted > 0 && (
                    <span className="font-bold text-emerald-400 font-mono-numbers ml-1">
                      {accuracy}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Primary Timer Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {activeFocusSession.isPaused ? (
            <button
              type="button"
              onClick={resumeFocusSession}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume Session</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseFocusSession}
              className="px-6 py-3 rounded-2xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] text-white font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Pause className="w-4 h-4" />
              <span>Pause Timer</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => endFocusSession(false, currentProgress, attempted, correct)}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Square className="w-4 h-4" />
            <span>End & Save Time</span>
          </button>

          <button
            type="button"
            onClick={() => {
              endFocusSession(true, currentProgress, attempted, correct);
              setCurrentView('today');
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Mark Complete</span>
          </button>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
            <h4 className="text-base font-bold text-white">Focus Session Active</h4>
            <p className="text-xs text-slate-300">
              Your timer is currently running. You can pause it or leave it running in the background. What would you like to do?
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  pauseFocusSession();
                  setShowExitConfirm(false);
                  setCurrentView('today');
                }}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Pause and return to Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  setCurrentView('today');
                }}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Keep running in background
              </button>
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="w-full py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Stay in Focus Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
