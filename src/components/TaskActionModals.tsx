import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { addDaysToDateString, getTodayDateString, formatTime12h, calculateDurationFromTimes } from '../utils/dateUtils';
import { X, Scissors, Calendar, AlertCircle } from 'lucide-react';

interface SplitTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const SplitTaskModal: React.FC<SplitTaskModalProps> = ({ task, isOpen, onClose }) => {
  const { splitTask } = useApp();

  const total = task.targetValue || 20;
  const defaultPart1 = Math.ceil(total / 2);
  const [part1, setPart1] = useState<number>(defaultPart1);
  const [part2Date, setPart2Date] = useState<string>(addDaysToDateString(getTodayDateString(), 1));

  if (!isOpen) return null;

  const part2 = Math.max(1, total - part1);

  const handleSplit = () => {
    splitTask(task.id, part1, part2, part2Date);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Split Task</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Divide <strong>{task.title}</strong> into two manageable portions without losing track of your target.
        </p>

        <div className="p-4 rounded-xl bg-[#0B1020] border border-[#273450] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Total target:</span>
            <span className="font-bold text-white font-mono-numbers">{total} {task.targetUnit}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="splitPart1" className="block text-[11px] text-slate-400 mb-1">Part 1 (Today)</label>
              <input
                id="splitPart1"
                type="number"
                min="1"
                max={total - 1}
                value={part1}
                onChange={(e) => setPart1(Math.min(total - 1, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-sm font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Part 2 (Remainder)</label>
              <div className="w-full px-3 py-1.5 rounded-lg bg-[#141C32]/60 border border-[#273450] text-slate-300 text-sm font-mono-numbers">
                {part2} {task.targetUnit}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="splitPart2Date" className="block text-[11px] text-slate-400 mb-1">Schedule Part 2 on</label>
            <input
              id="splitPart2Date"
              type="date"
              value={part2Date}
              onChange={(e) => setPart2Date(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#141C32] border border-[#273450] text-white text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">
            Cancel
          </button>
          <button
            onClick={handleSplit}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow cursor-pointer"
          >
            Split Task
          </button>
        </div>
      </div>
    </div>
  );
};

interface RescheduleModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ task, isOpen, onClose }) => {
  const { rescheduleTask } = useApp();

  const [date, setDate] = useState(task.plannedDate);
  const [startTime, setStartTime] = useState(task.startTime || '');
  const [endTime, setEndTime] = useState(task.endTime || '');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReschedule = () => {
    if (!date) {
      setError('Please select a date.');
      return;
    }

    if ((startTime && !endTime) || (!startTime && endTime)) {
      setError('Please specify both start and end time, or leave both empty for anytime scheduling.');
      return;
    }

    if (startTime && endTime) {
      const dur = calculateDurationFromTimes(startTime, endTime);
      if (dur <= 0) {
        setError('End time must be strictly after start time.');
        return;
      }
    }

    setError(null);
    rescheduleTask(task.id, date, startTime || undefined, endTime || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#141C32] border border-[#273450] p-6 shadow-2xl text-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-[#273450] pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Reschedule Task</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Rescheduling <strong>{task.title}</strong>
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="reschedDate" className="block text-xs font-semibold text-slate-300 mb-1">New Date</label>
            <input
              id="reschedDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reschedStart" className="block text-xs font-medium text-slate-400 mb-1">Start Time (Optional)</label>
              <input
                id="reschedStart"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
              />
            </div>
            <div>
              <label htmlFor="reschedEnd" className="block text-xs font-medium text-slate-400 mb-1">End Time (Optional)</label>
              <input
                id="reschedEnd"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs font-mono-numbers"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white text-xs font-bold shadow cursor-pointer"
          >
            Confirm Date
          </button>
        </div>
      </div>
    </div>
  );
};
