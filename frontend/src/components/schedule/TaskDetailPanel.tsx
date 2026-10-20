import React from 'react';
import { X, Wrench, AlertTriangle, Clock, Calendar, CheckCircle2, User, Building, Package } from 'lucide-react';
import { MaintenanceTask } from '../../types';

interface TaskDetailPanelProps {
  task: MaintenanceTask | null;
  onClose: () => void;
  onSelectAircraft?: (aircraftId: string) => void;
}

const PRIORITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: 'bg-red-50 text-red-700', border: 'border-red-200', text: 'Critical Priority' },
  HIGH:     { bg: 'bg-orange-50 text-orange-700', border: 'border-orange-200', text: 'High Priority' },
  MEDIUM:   { bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200', text: 'Medium Priority' },
  LOW:      { bg: 'bg-blue-50 text-blue-700', border: 'border-blue-200', text: 'Low Priority' },
};

const STATUS_BADGES: Record<string, { bg: string; text: string }> = {
  QUEUED:        { bg: 'bg-slate-100 text-slate-700', text: 'Queued' },
  SCHEDULED:     { bg: 'bg-blue-100 text-blue-700', text: 'Scheduled' },
  IN_PROGRESS:   { bg: 'bg-cyan-100 text-cyan-800', text: 'In Progress' },
  COMPLETED:     { bg: 'bg-emerald-100 text-emerald-800', text: 'Completed' },
  WAITING_FOR_SPARE: { bg: 'bg-amber-100 text-amber-800', text: 'Awaiting Spare' },
};

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, onClose, onSelectAircraft }) => {
  if (!task) return null;

  const priorityMeta = PRIORITY_BADGES[task.priority] ?? {
    bg: 'bg-slate-50 text-slate-700',
    border: 'border-slate-200',
    text: task.priority,
  };
  const statusMeta = STATUS_BADGES[task.status] ?? {
    bg: 'bg-slate-100 text-slate-700',
    text: task.status,
  };

  const baselineHour = 6;
  const startHour = (baselineHour + task.start_time_slot) % 24;
  const endHour = (baselineHour + task.end_time_slot) % 24;
  const startDayOffset = Math.floor((baselineHour + task.start_time_slot) / 24);
  const endDayOffset = Math.floor((baselineHour + task.end_time_slot) / 24);

  const formatSlotTime = (dayOffset: number, hour: number) => {
    const dayLabel = dayOffset === 0 ? 'Today' : `Day +${dayOffset}`;
    const h = hour.toString().padStart(2, '0');
    return `${dayLabel} @ ${h}:00`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-labelledby="task-detail-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                {task.task_id}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${priorityMeta.bg} ${priorityMeta.border}`}>
                {priorityMeta.text}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${statusMeta.bg}`}>
                {statusMeta.text}
              </span>
            </div>
            <h3 id="task-detail-title" className="text-lg font-bold text-slate-900 leading-snug">
              {task.task_name}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Target Aircraft & Component */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-xs text-slate-500 font-medium">Target Aircraft</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-slate-900 text-base">{task.aircraft_id}</span>
                {onSelectAircraft && (
                  <button
                    onClick={() => {
                      onSelectAircraft(task.aircraft_id);
                      onClose();
                    }}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    View Twin →
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Target Component</p>
              <p className="font-mono text-sm font-semibold text-slate-800 mt-0.5">{task.component_id}</p>
            </div>
          </div>

          {/* Schedule Window */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule & Duration</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Start Window</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">{formatSlotTime(startDayOffset, startHour)}</p>
                <p className="text-[10px] text-slate-400 font-mono">Slot: +{task.start_time_slot}h</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Completion</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">{formatSlotTime(endDayOffset, endHour)}</p>
                <p className="text-[10px] text-slate-400 font-mono">Slot: +{task.end_time_slot}h</p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Est. Duration</span>
                </div>
                <p className="font-semibold text-slate-900 text-sm">{task.duration_hours} hours</p>
                <p className="text-[10px] text-slate-400">RUL: ≤ {task.rul_deadline_hours}h</p>
              </div>
            </div>
          </div>

          {/* Resources & Logistics */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Resource Assignment</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Assigned Technician:</span>
                </div>
                <span className="text-sm font-semibold font-mono text-slate-900">
                  {task.technician_id || 'Unassigned (Queue)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Assigned Workshop:</span>
                </div>
                <span className="text-sm font-semibold font-mono text-slate-900">
                  {task.workshop_id || 'Pending Allocation'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Wrench className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Required Skill:</span>
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  {task.required_skill || 'General Avionics'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Package className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">Required Spare Part:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-slate-800">
                    {task.required_part_id || 'None Required'}
                  </span>
                  {task.required_part_id && (
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      task.spare_available !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {task.spare_available !== false ? 'In Stock' : 'Missing'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Optimizer Note */}
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              {task.is_optimized
                ? `Schedule optimized by Google OR-Tools CP-SAT solver. Priority score: ${task.priority_score.toFixed(1)}.`
                : 'Task queued. Run the CP-SAT optimizer to assign time slots and technicians.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
