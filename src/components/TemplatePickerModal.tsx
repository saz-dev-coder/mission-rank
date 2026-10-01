import React from 'react';
import { TaskTemplate, Priority } from '../types';
import { useApp } from '../context/AppContext';
import { getSubjectColor, getPriorityBadge } from './TaskCard';
import { X, Bookmark, Clock, Target, Trash2, Plus } from 'lucide-react';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
}

export const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { templates, deleteTemplate } = useApp();

  if (!isOpen) return null;

  const builtIn = templates.filter(t => !t.isCustom);
  const custom = templates.filter(t => t.isCustom);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 rounded-2xl bg-[#141C32] border border-[#273450] shadow-2xl text-slate-200 overflow-hidden card-depth-3d">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#273450] bg-[#0E1527]">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Study Task Templates</h3>
              <p className="text-xs text-slate-400">Pick a preset to quickly add to your plan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Custom Templates */}
          {custom.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider mb-2">
                Your Personal Templates
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {custom.map(tmpl => {
                  const theme = getSubjectColor(tmpl.subject);
                  return (
                    <div
                      key={tmpl.id}
                      className="p-3 rounded-xl bg-[#0B1020] border border-[#273450] hover:border-pink-500/50 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${theme.bg} ${theme.text} ${theme.border}`}>
                            {tmpl.subject}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(tmpl.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h5 className="text-xs font-bold text-white">{tmpl.title}</h5>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {tmpl.durationMinutes}m
                          </span>
                          {tmpl.targetValue > 0 && (
                            <span className="flex items-center gap-0.5">
                              <Target className="w-3 h-3 text-pink-400" />
                              {tmpl.targetValue} {tmpl.targetUnit}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTemplate(tmpl);
                          onClose();
                        }}
                        className="mt-3 w-full py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600 text-pink-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Use Template</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Built-in Templates */}
          <div>
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              Govt Exam Standard Templates
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {builtIn.map(tmpl => {
                const theme = getSubjectColor(tmpl.subject);
                return (
                  <div
                    key={tmpl.id}
                    className="p-3 rounded-xl bg-[#0B1020] border border-[#273450] hover:border-indigo-500/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${theme.bg} ${theme.text} ${theme.border}`}>
                          {tmpl.subject}
                        </span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] ${getPriorityBadge(tmpl.priority)}`}>
                          {tmpl.priority}
                        </span>
                      </div>
                      <h5 className="text-xs font-bold text-white">{tmpl.title}</h5>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-0.5 font-mono-numbers">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {tmpl.durationMinutes}m
                        </span>
                        {tmpl.targetValue > 0 && (
                          <span className="flex items-center gap-0.5 font-mono-numbers">
                            <Target className="w-3 h-3 text-pink-400" />
                            {tmpl.targetValue} {tmpl.targetUnit}
                          </span>
                        )}
                        {tmpl.accuracyTarget && (
                          <span className="text-[10px] text-emerald-400 font-mono-numbers">
                            {tmpl.accuracyTarget}% acc
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTemplate(tmpl);
                        onClose();
                      }}
                      className="mt-3 w-full py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Use Template</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
