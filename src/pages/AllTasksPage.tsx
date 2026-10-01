import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task, SubjectType, Priority, TaskType, TaskStatus } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { TaskCard } from '../components/TaskCard';
import { TaskModal } from '../components/TaskModal';
import { PartialCompletionModal } from '../components/PartialCompletionModal';
import { SplitTaskModal, RescheduleModal } from '../components/TaskActionModals';
import { TemplatePickerModal } from '../components/TemplatePickerModal';
import { 
  Plus, 
  Search, 
  Filter, 
  Bookmark, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

export const AllTasksPage: React.FC = () => {
  const { tasks, addTask, startFocusSession } = useApp();
  const todayStr = getTodayDateString();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Today' | 'Upcoming' | 'Overdue' | 'Completed' | 'Pending'>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [partialTask, setPartialTask] = useState<Task | null>(null);
  const [splitTaskTarget, setSplitTaskTarget] = useState<Task | null>(null);
  const [rescheduleTaskTarget, setRescheduleTaskTarget] = useState<Task | null>(null);

  // Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // Exclude availability blocks from regular task view
      if (t.category === 'availability_block') return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesSubject = t.subject.toLowerCase().includes(q);
        const matchesSubtopic = t.subtopic?.toLowerCase().includes(q);
        const matchesNotes = t.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSubject && !matchesSubtopic && !matchesNotes) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter === 'Today') {
        if (t.plannedDate !== todayStr) return false;
      } else if (statusFilter === 'Upcoming') {
        if (t.plannedDate <= todayStr || t.status === 'Completed') return false;
      } else if (statusFilter === 'Overdue') {
        if (t.plannedDate >= todayStr || t.status === 'Completed' || t.status === 'Skipped') return false;
      } else if (statusFilter === 'Completed') {
        if (t.status !== 'Completed') return false;
      } else if (statusFilter === 'Pending') {
        if (t.status === 'Completed' || t.status === 'Skipped') return false;
      }

      // Subject Filter
      if (subjectFilter !== 'All' && t.subject !== subjectFilter) {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== 'All' && t.priority !== priorityFilter) {
        return false;
      }

      // Type Filter
      if (typeFilter !== 'All' && t.taskType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, subjectFilter, priorityFilter, typeFilter, todayStr]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-pink-500" />
            <span>Task Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage your full study syllabus, practice drills, and mock tests
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#141C32] hover:bg-slate-800 border border-[#273450] text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
            <span>Templates</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTaskToEdit(null);
              setIsTaskModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-[#141C32] border border-[#273450] space-y-3 card-depth-3d">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject, subtopic, or notes..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0B1020] border border-[#273450] text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-slate-500 text-[11px] font-semibold uppercase flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter:
          </span>

          {['All', 'Today', 'Upcoming', 'Overdue', 'Completed', 'Pending'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[#0B1020] text-slate-400 hover:text-white border border-[#273450]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs"
            >
              <option value="All">All Subjects</option>
              <option value="Quant">Quant</option>
              <option value="English">English</option>
              <option value="Reasoning">Reasoning</option>
              <option value="General Awareness">General Awareness</option>
              <option value="Computer">Computer</option>
              <option value="Mock Test">Mock Test</option>
              <option value="Revision">Revision</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs"
            >
              <option value="All">All Priorities</option>
              <option value="Must do">Must do</option>
              <option value="Should do">Should do</option>
              <option value="Optional">Optional</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5">Task Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[#0B1020] border border-[#273450] text-white text-xs"
            >
              <option value="All">All Types</option>
              <option value="Learn">Learn</option>
              <option value="Practice">Practice</option>
              <option value="Revise">Revise</option>
              <option value="Mock test">Mock test</option>
              <option value="Mock analysis">Mock analysis</option>
              <option value="Typing practice">Typing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredTasks.length} tasks</span>
        </div>

        {filteredTasks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onOpenEdit={(t) => {
                  setTaskToEdit(t);
                  setIsTaskModalOpen(true);
                }}
                onOpenPartial={(t) => setPartialTask(t)}
                onOpenSplit={(t) => setSplitTaskTarget(t)}
                onOpenReschedule={(t) => setRescheduleTaskTarget(t)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-[#141C32] border border-[#273450] text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-white">No tasks match your filters</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search query or reset the filter selection to view all tasks.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('All');
                setSubjectFilter('All');
                setPriorityFilter('All');
                setTypeFilter('All');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        taskToEdit={taskToEdit}
      />

      {/* Template Picker */}
      <TemplatePickerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={(tmpl) => {
          addTask({
            title: tmpl.title,
            subject: tmpl.subject,
            subtopic: tmpl.subtopic,
            category: 'regular',
            taskType: tmpl.taskType,
            priority: tmpl.priority,
            plannedDate: todayStr,
            plannedDurationMinutes: tmpl.durationMinutes,
            isFlexible: true,
            reminderLeadMinutes: 10,
            targetValue: tmpl.targetValue,
            targetUnit: tmpl.targetUnit,
            currentCompletedValue: 0,
            accuracyTarget: tmpl.accuracyTarget,
            difficulty: 'Medium',
            status: 'Pending',
            actualCompletedDurationMinutes: 0,
          });
        }}
      />

      {/* Partial / Work Logging Modal */}
      {partialTask && (
        <PartialCompletionModal
          task={partialTask}
          isOpen={Boolean(partialTask)}
          onClose={() => setPartialTask(null)}
          onContinueFocus={() => {
            const taskId = partialTask.id;
            setPartialTask(null);
            startFocusSession(taskId);
          }}
        />
      )}

      {/* Split Task Modal */}
      {splitTaskTarget && (
        <SplitTaskModal
          task={splitTaskTarget}
          isOpen={Boolean(splitTaskTarget)}
          onClose={() => setSplitTaskTarget(null)}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleTaskTarget && (
        <RescheduleModal
          task={rescheduleTaskTarget}
          isOpen={Boolean(rescheduleTaskTarget)}
          onClose={() => setRescheduleTaskTarget(null)}
        />
      )}
    </div>
  );
};
