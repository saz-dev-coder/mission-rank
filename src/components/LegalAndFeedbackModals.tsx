import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FeedbackSubmission } from '../types';
import { X, Send, Shield, FileText, CheckCircle2 } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const { sendFeedbackLocally } = useApp();

  const [category, setCategory] = useState<'Bug' | 'Feature request' | 'Confusing experience' | 'General feedback'>('General feedback');
  const [whatTryingToDo, setWhatTryingToDo] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatTryingToDo.trim() || !whatHappened.trim()) return;

    sendFeedbackLocally({
      category,
      whatTryingToDo: whatTryingToDo.trim(),
      whatHappened: whatHappened.trim(),
      email: email.trim() || undefined,
    });

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-pink-400" />
            <h3 className="text-base font-bold text-white">Share App Feedback</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Feedback Recorded Locally</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thank you! Your feedback has been stored in your device's local log. Once a cloud feedback endpoint is configured, it will be automatically dispatched.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="fbCategory" className="block text-xs font-semibold text-slate-300 mb-1">Feedback Category</label>
              <select
                id="fbCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
              >
                <option value="Bug">Bug / Visual glitch</option>
                <option value="Feature request">Feature request / Suggestion</option>
                <option value="Confusing experience">Confusing experience</option>
                <option value="General feedback">General feedback</option>
              </select>
            </div>

            <div>
              <label htmlFor="fbTrying" className="block text-xs font-semibold text-slate-300 mb-1">
                What were you trying to do? <span className="text-rose-400">*</span>
              </label>
              <input
                id="fbTrying"
                type="text"
                value={whatTryingToDo}
                onChange={(e) => setWhatTryingToDo(e.target.value)}
                placeholder="e.g. Setting up a 45-min English vocabulary block"
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="fbHappened" className="block text-xs font-semibold text-slate-300 mb-1">
                What happened? <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="fbHappened"
                rows={3}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder="Describe your experience or suggestion..."
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none resize-none"
                required
              />
            </div>

            <div>
              <label htmlFor="fbEmail" className="block text-xs font-semibold text-slate-300 mb-1">
                Email for follow-up (optional)
              </label>
              <input
                id="fbEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#273450]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Save Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Privacy Policy</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
          <p>
            <strong>1. Local-First Data Storage:</strong> All your study plans, tasks, test scores, notes, and profile details are stored locally inside your browser’s localStorage. No personal study information is transmitted or sold to any external party.
          </p>
          <p>
            <strong>2. Data Backups:</strong> Because data is stored on this device, clearing browser cache or changing devices requires you to export your data. We offer JSON export and import options in the Settings tab.
          </p>
          <p>
            <strong>3. Audio & Alarms:</strong> Timers and audio bells use the Web Audio API synthesized entirely on your device. No audio recordings or external streaming occurs.
          </p>
          <p>
            <strong>4. Analytics:</strong> Mission Rank does not log your task names, notes, scores, or identities to remote tracking suites.
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const TermsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg my-8 rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Terms of Use & Disclaimer</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3 text-xs text-slate-300 max-h-[60vh] overflow-y-auto pr-2 leading-relaxed">
          <p>
            <strong>1. Personal Study Tool:</strong> Mission Rank is an independent personal organization system. It is not affiliated with the Staff Selection Commission (SSC), Railway Recruitment Board (RRB), IBPS, or any government body.
          </p>
          <p>
            <strong>2. No Outcome Guarantee:</strong> Mission Rank does not guarantee examination selection, specific exam score, rank, or job appointment. Scores generated within the app (such as the Daily Execution Score) reflect planning consistency only and do not predict official examination results.
          </p>
          <p>
            <strong>3. Student Autonomy:</strong> The user owns and controls all schedules, targets, and study commitments. Suggested starter tasks are editable templates provided for user convenience.
          </p>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
