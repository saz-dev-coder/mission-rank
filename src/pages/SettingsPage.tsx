import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ExamType, CurrentStage, SubjectType } from '../types';
import { playSoundTone, startAlarmLoop, stopAlarmLoop } from '../utils/audio';
import { FeedbackModal, PrivacyModal, TermsModal } from '../components/LegalAndFeedbackModals';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Volume2, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Shield, 
  FileText, 
  MessageSquare, 
  Check, 
  AlertTriangle,
  Smartphone
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    profile,
    updateProfile,
    alarmPreferences,
    updateAlarmPreferences,
    reminderSettings,
    updateReminderSettings,
    requestNotificationPermission,
    exportData,
    validateImportJson,
    importData,
    restoreLatestBackup,
    hasBackup,
    clearAllData,
    lastSaved,
  } = useApp();

  // Profile form state
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [targetExam, setTargetExam] = useState<ExamType>(profile?.targetExam || 'SSC CGL');
  const [targetYear, setTargetYear] = useState(profile?.targetYear || '2026');
  const [currentStage, setCurrentStage] = useState<CurrentStage>(profile?.currentStage || 'Intermediate');
  const [strongestSubject, setStrongestSubject] = useState<SubjectType>(profile?.strongestSubject || 'Quant');
  const [weakestSubject, setWeakestSubject] = useState<SubjectType>(profile?.weakestSubject || 'General Awareness');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Import State
  const [importJsonText, setImportJsonText] = useState('');
  const [importPreview, setImportPreview] = useState<any>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isTestingAlarm, setIsTestingAlarm] = useState(false);

  useEffect(() => {
    return () => {
      stopAlarmLoop();
    };
  }, []);

  const handleTestAlarmLoop = () => {
    if (isTestingAlarm) {
      stopAlarmLoop();
      setIsTestingAlarm(false);
    } else {
      setIsTestingAlarm(true);
      startAlarmLoop(
        alarmPreferences.sound,
        alarmPreferences.volume,
        alarmPreferences.vibration,
        alarmPreferences.autoStopSeconds || 5,
        () => {
          setIsTestingAlarm(false);
        }
      );
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    updateProfile({
      firstName: firstName.trim(),
      targetExam,
      targetYear: targetYear.trim() || undefined,
      currentStage,
      strongestSubject,
      weakestSubject,
    });

    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 3000);
  };

  const handleDownloadExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mission_rank_backup_${firstName.toLowerCase() || 'student'}_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      const res = validateImportJson(text);
      if (res.valid) {
        setImportPreview(res.preview);
        setImportError(null);
      } else {
        setImportError(res.error || 'Invalid file format');
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    const res = validateImportJson(importJsonText);
    if (res.valid && res.data) {
      const success = importData(res.data);
      if (success) {
        setImportSuccess(true);
        setImportPreview(null);
        setImportJsonText('');
        setTimeout(() => setImportSuccess(false), 4000);
      } else {
        setImportError('Failed to import data safely.');
      }
    }
  };

  const handleRestoreBackup = () => {
    const success = restoreLatestBackup();
    if (success) {
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-indigo-400" />
          <span>App Settings & Data</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Local device storage • Last saved locally at <strong className="text-slate-300 font-mono-numbers">{lastSaved}</strong>
        </p>
      </div>

      {/* Profile Settings */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <User className="w-4 h-4 text-pink-400" />
            <span>Student Profile</span>
          </h3>
          {profileSavedMsg && (
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label htmlFor="settingsFirstName" className="block text-xs font-semibold text-slate-300 mb-1">
              First Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="settingsFirstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settingsExam" className="block text-xs font-semibold text-slate-300 mb-1">Target Exam</label>
              <select
                id="settingsExam"
                value={targetExam}
                onChange={(e) => setTargetExam(e.target.value as ExamType)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="SSC CGL">SSC CGL</option>
                <option value="SSC CHSL">SSC CHSL</option>
                <option value="SSC MTS">SSC MTS</option>
                <option value="SSC CPO">SSC CPO</option>
                <option value="Railway">Railway</option>
                <option value="Banking">Banking</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="settingsYear" className="block text-xs font-semibold text-slate-300 mb-1">Target Year</label>
              <input
                id="settingsYear"
                type="text"
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settingsStrong" className="block text-xs font-semibold text-slate-300 mb-1">Strongest Subject</label>
              <select
                id="settingsStrong"
                value={strongestSubject}
                onChange={(e) => setStrongestSubject(e.target.value as SubjectType)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="Quant">Quant</option>
                <option value="English">English</option>
                <option value="Reasoning">Reasoning</option>
                <option value="General Awareness">General Awareness</option>
                <option value="Computer">Computer</option>
              </select>
            </div>

            <div>
              <label htmlFor="settingsWeak" className="block text-xs font-semibold text-slate-300 mb-1">Weakest Subject</label>
              <select
                id="settingsWeak"
                value={weakestSubject}
                onChange={(e) => setWeakestSubject(e.target.value as SubjectType)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="General Awareness">General Awareness</option>
                <option value="English">English</option>
                <option value="Quant">Quant</option>
                <option value="Reasoning">Reasoning</option>
                <option value="Computer">Computer</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* Alarm Settings */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#273450] pb-3">
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>Timer & Alarm Sound Settings</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor="settingsAlarmSound" className="block text-xs font-semibold text-slate-300 mb-1">Sound Tone</label>
            <select
              id="settingsAlarmSound"
              value={alarmPreferences.sound}
              onChange={(e) => updateAlarmPreferences({ sound: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
            >
              <option value="Soft bell">Soft bell (Harmonic)</option>
              <option value="Clear chime">Clear chime (Dual-tone)</option>
              <option value="Digital beep">Digital beep (Sharp)</option>
            </select>
          </div>

          <div>
            <label htmlFor="settingsVolume" className="block text-xs font-semibold text-slate-300 mb-1">
              Alarm Volume: {alarmPreferences.volume}%
            </label>
            <input
              id="settingsVolume"
              type="range"
              min="10"
              max="100"
              value={alarmPreferences.volume}
              onChange={(e) => updateAlarmPreferences({ volume: parseInt(e.target.value, 10) })}
              className="w-full accent-pink-500 mt-2 cursor-pointer"
            />
          </div>

          <div>
            <label htmlFor="settingsAutoStop" className="block text-xs font-semibold text-slate-300 mb-1">
              Auto-Stop Alarm
            </label>
            <select
              id="settingsAutoStop"
              value={alarmPreferences.autoStopSeconds || 5}
              onChange={(e) => updateAlarmPreferences({ autoStopSeconds: parseInt(e.target.value, 10) as 3 | 5 | 10 })}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
            >
              <option value={3}>Auto-stop in 3 seconds</option>
              <option value={5}>Auto-stop in 5 seconds</option>
              <option value={10}>Auto-stop in 10 seconds</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleTestAlarmLoop}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
              isTestingAlarm
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>{isTestingAlarm ? 'Stop Test Alarm (Playing...)' : `Test Alarm Loop (${alarmPreferences.autoStopSeconds || 5}s auto-stop)`}</span>
          </button>

          <button
            type="button"
            onClick={() => playSoundTone(alarmPreferences.sound, alarmPreferences.volume)}
            className="px-3.5 py-2 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Play Single Tone
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            id="vibrationToggle"
            type="checkbox"
            checked={alarmPreferences.vibration}
            onChange={(e) => updateAlarmPreferences({ vibration: e.target.checked })}
            className="rounded text-indigo-600"
          />
          <label htmlFor="vibrationToggle" className="text-xs text-slate-300 cursor-pointer">
            Enable device vibration (on supported Android and mobile browsers)
          </label>
        </div>
      </div>

      {/* Reminders & Notifications */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#273450] pb-3">
          <Bell className="w-4 h-4 text-sky-400" />
          <span>Reminders & Notifications</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0B1020] border border-[#273450]">
            <div>
              <p className="font-semibold text-white">Browser Reminders</p>
              <p className="text-slate-400">Receive in-browser alerts 10 mins before timed study tasks</p>
            </div>
            <button
              type="button"
              onClick={requestNotificationPermission}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                reminderSettings.browserNotificationsEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {reminderSettings.browserNotificationsEnabled ? 'Permission Granted' : 'Enable browser reminders'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="settingsReminderStyle" className="block text-xs font-semibold text-slate-300 mb-1">Reminder Tone</label>
              <select
                id="settingsReminderStyle"
                value={reminderSettings.reminderStyle}
                onChange={(e) => updateReminderSettings({ reminderStyle: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="Gentle">Gentle (Encouraging)</option>
                <option value="Strict but respectful">Strict but respectful</option>
              </select>
            </div>

            <div>
              <label htmlFor="settingsLeadTime" className="block text-xs font-semibold text-slate-300 mb-1">Pre-task lead time (mins)</label>
              <input
                id="settingsLeadTime"
                type="number"
                min="5"
                max="30"
                value={reminderSettings.leadTimeMinutes}
                onChange={(e) => updateReminderSettings({ leadTimeMinutes: parseInt(e.target.value, 10) || 10 })}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme & Display */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#273450] pb-3">
          <Smartphone className="w-4 h-4 text-purple-400" />
          <span>Appearance & Accessibility</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="settingsTheme" className="block text-xs font-semibold text-slate-300 mb-1">App Theme</label>
            <select
              id="settingsTheme"
              value={profile?.theme || 'dark'}
              onChange={(e) => updateProfile({ theme: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
            >
              <option value="dark">Dark Theme (Default focused desk)</option>
              <option value="light">Light Theme</option>
              <option value="system">Follow System</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-6">
            <input
              id="settingsMotion"
              type="checkbox"
              checked={profile?.reduceMotion || false}
              onChange={(e) => updateProfile({ reduceMotion: e.target.checked })}
              className="rounded text-indigo-600"
            />
            <label htmlFor="settingsMotion" className="text-xs text-slate-300 cursor-pointer">
              Reduce motion (instant transitions)
            </label>
          </div>
        </div>
      </div>

      {/* Data Backup & Export / Import */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-amber-400" />
            <span>Data Export & Backup (Local-First)</span>
          </h3>
          <span className="text-[11px] text-slate-400">JSON Schema v1</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Your study plan is stored strictly on this device until cloud sync is enabled. Export your data regularly to prevent accidental browser cache loss.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadExport}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All App Data (JSON)</span>
          </button>

          {hasBackup && (
            <button
              type="button"
              onClick={handleRestoreBackup}
              className="px-4 py-2 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Restore Last Auto-Backup</span>
            </button>
          )}
        </div>

        {importSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Data successfully imported and verified!</span>
          </div>
        )}

        {/* Import JSON File */}
        <div className="p-4 rounded-xl bg-[#0B1020] border border-[#273450] space-y-3">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import Study Backup</span>
          </h4>
          <input
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
          />

          {importError && (
            <p className="text-xs text-rose-400">{importError}</p>
          )}

          {importPreview && (
            <div className="p-3 rounded-lg bg-[#141C32] border border-[#273450] text-xs space-y-2">
              <p className="font-bold text-white">Import Preview:</p>
              <ul className="text-slate-300 space-y-0.5">
                <li>Student Name: <strong>{importPreview.studentName}</strong></li>
                <li>Tasks Count: <strong>{importPreview.taskCount}</strong></li>
                <li>Focus Sessions: <strong>{importPreview.focusSessionsCount}</strong></li>
                <li>Exported At: <strong>{importPreview.exportedAt}</strong></li>
              </ul>
              <button
                type="button"
                onClick={handleExecuteImport}
                className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirm & Replace Current Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Feedback, Privacy, Legal & Reset */}
      <div className="p-5 rounded-2xl bg-[#141C32] border border-[#273450] space-y-4 card-depth-3d">
        <h3 className="text-sm font-bold text-white border-b border-[#273450] pb-3">
          App Support & Information
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
            <span>Send Feedback</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Privacy Policy</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTermsModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#0B1020] hover:bg-slate-800 border border-[#273450] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Terms & Disclaimer</span>
          </button>
        </div>

        {/* Clear Data Danger Zone */}
        <div className="pt-4 border-t border-[#273450]/80">
          {!showClearConfirm ? (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Local Data & Restart Onboarding</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs text-rose-200">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Are you sure you want to delete all local study records?
              </p>
              <p className="text-[11px] text-rose-300/80">
                This will delete your tasks, profile, and study history from this browser. This cannot be undone unless you exported a backup.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={clearAllData}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  Yes, Clear Everything
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};
