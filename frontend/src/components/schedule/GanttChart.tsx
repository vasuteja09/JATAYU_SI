import React, { useMemo } from 'react';
import { MaintenanceTask } from '../../types';
import { AlertCircle, Clock, CheckCircle2, Wrench, Package } from 'lucide-react';

interface GanttChartProps {
  tasks: MaintenanceTask[];
  groupBy: 'aircraft' | 'technician' | 'workshop';
  onSelectTask: (task: MaintenanceTask) => void;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  QUEUED:        { bg: 'bg-slate-200 hover:bg-slate-300', text: 'text-slate-800', border: 'border-slate-400', label: 'Queued' },
  SCHEDULED:     { bg: 'bg-blue-500 hover:bg-blue-600', text: 'text-white', border: 'border-blue-600', label: 'Scheduled' },
  IN_PROGRESS:   { bg: 'bg-cyan-600 hover:bg-cyan-700', text: 'text-white', border: 'border-cyan-700', label: 'In Progress' },
  COMPLETED:     { bg: 'bg-emerald-600 hover:bg-emerald-700', text: 'text-white', border: 'border-emerald-700', label: 'Completed' },
  WAITING_FOR_SPARE: { bg: 'bg-amber-500 hover:bg-amber-600', text: 'text-white', border: 'border-amber-600', label: 'Awaiting Spare' },
};

const PRIORITY_BADGE_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-600 text-white',
  HIGH:     'bg-orange-500 text-white',
  MEDIUM:   'bg-amber-500 text-white',
  LOW:      'bg-blue-400 text-white',
};

export const GanttChart: React.FC<GanttChartProps> = ({ tasks, groupBy, onSelectTask }) => {
  // Determine overall timeline range
  const { minSlot, maxSlot, totalSpan } = useMemo(() => {
    if (tasks.length === 0) return { minSlot: 0, maxSlot: 72, totalSpan: 72 };
    let min = 0;
    let max = 48; // minimum 48 hours window
    tasks.forEach(t => {
      if (t.start_time_slot !== undefined && t.start_time_slot < min) min = t.start_time_slot;
      if (t.end_time_slot !== undefined && t.end_time_slot > max) max = t.end_time_slot;
    });
    // Add margin
    max = Math.max(max + 6, 48);
    return { minSlot: min, maxSlot: max, totalSpan: max - min };
  }, [tasks]);

  // Group tasks by selected key
  const groupedTasks = useMemo(() => {
    const groups: Record<string, MaintenanceTask[]> = {};
    tasks.forEach(t => {
      let key = 'Unassigned';
      if (groupBy === 'aircraft') {
        key = t.aircraft_id || 'Unknown Aircraft';
      } else if (groupBy === 'technician') {
        key = t.technician_id || 'Unassigned Technician';
      } else if (groupBy === 'workshop') {
        key = t.workshop_id || 'General Workshop';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    // Sort group keys alphabetically
    return Object.keys(groups).sort().map(key => ({
      key,
      tasks: groups[key].sort((a, b) => a.start_time_slot - b.start_time_slot),
    }));
  }, [tasks, groupBy]);

  // Generate hourly scale ticks (every 6 hours)
  const timeTicks = useMemo(() => {
    const ticks = [];
    const step = totalSpan > 96 ? 12 : 6;
    for (let slot = minSlot; slot <= maxSlot; slot += step) {
      const day = Math.floor(slot / 24);
      const hour = (6 + (slot % 24)) % 24;
      ticks.push({
        slot,
        label: `+${slot}h`,
        subLabel: day === 0 ? `${hour}:00` : `D+${day} ${hour}:00`,
        leftPercent: ((slot - minSlot) / totalSpan) * 100,
      });
    }
    return ticks;
  }, [minSlot, maxSlot, totalSpan]);

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold text-base">No tasks available to visualize</p>
        <p className="text-xs text-slate-400 mt-1">Adjust filters or generate an optimized maintenance schedule.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Chart Legend */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 text-xs text-slate-600 flex-wrap gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-semibold text-slate-700">Status:</span>
          {Object.entries(STATUS_COLORS).map(([key, style]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-xs ${style.bg.split(' ')[0]} border ${style.border}`} />
              <span className="text-slate-600">{style.label}</span>
            </div>
          ))}
        </div>
        <div className="text-slate-400 text-[11px]">
          Baseline: Today 06:00 UTC | Timeline Span: {totalSpan} hrs
        </div>
      </div>

      {/* Gantt Viewport */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row with time scale */}
          <div className="flex border-b border-slate-200 bg-slate-100/80 sticky top-0 z-10">
            <div className="w-48 shrink-0 px-4 py-2.5 font-bold text-xs text-slate-700 uppercase tracking-wider border-r border-slate-200">
              {groupBy === 'aircraft' ? 'Aircraft Unit' : groupBy === 'technician' ? 'Technician' : 'Workshop'}
            </div>
            <div className="flex-1 relative h-10">
              {timeTicks.map(tick => (
                <div
                  key={tick.slot}
                  className="absolute top-0 bottom-0 border-l border-slate-200 pl-1.5 pt-1 text-[11px] leading-tight select-none"
                  style={{ left: `${tick.leftPercent}%` }}
                >
                  <span className="font-mono font-semibold text-slate-700 block">{tick.label}</span>
                  <span className="text-[10px] text-slate-400 block">{tick.subLabel}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Group Rows */}
          <div className="divide-y divide-slate-100">
            {groupedTasks.map(group => (
              <div key={group.key} className="flex hover:bg-slate-50/50 transition-colors">
                {/* Row label */}
                <div className="w-48 shrink-0 px-4 py-3 font-mono font-bold text-xs text-slate-800 border-r border-slate-200 flex items-center justify-between">
                  <span>{group.key}</span>
                  <span className="text-[10px] text-slate-400 font-sans font-medium px-1.5 py-0.5 rounded bg-slate-100">
                    {group.tasks.length} {group.tasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {/* Timeline row */}
                <div className="flex-1 relative h-14 bg-white">
                  {/* Grid background lines */}
                  {timeTicks.map(tick => (
                    <div
                      key={tick.slot}
                      className="absolute top-0 bottom-0 border-l border-slate-100 pointer-events-none"
                      style={{ left: `${tick.leftPercent}%` }}
                    />
                  ))}

                  {/* Task blocks */}
                  {group.tasks.map(task => {
                    const duration = Math.max(task.end_time_slot - task.start_time_slot, 1);
                    const left = ((task.start_time_slot - minSlot) / totalSpan) * 100;
                    const width = (duration / totalSpan) * 100;
                    const statusMeta = STATUS_COLORS[task.status] ?? STATUS_COLORS.QUEUED;
                    const priorityBadge = PRIORITY_BADGE_STYLE[task.priority] ?? 'bg-slate-500 text-white';

                    return (
                      <button
                        key={task.task_id}
                        onClick={() => onSelectTask(task)}
                        title={`${task.task_name} (${task.aircraft_id}) | +${task.start_time_slot}h to +${task.end_time_slot}h | ${task.status}`}
                        style={{
                          left: `${Math.max(left, 0.5)}%`,
                          width: `${Math.max(width, 3)}%`,
                        }}
                        className={`absolute top-2 bottom-2 rounded-lg px-2 py-1 text-left shadow-xs transition-all flex items-center justify-between overflow-hidden border cursor-pointer ${statusMeta.bg} ${statusMeta.border} ${statusMeta.text}`}
                      >
                        <div className="truncate flex items-center gap-1.5 text-xs font-semibold">
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 ${priorityBadge}`}>
                            {task.priority.slice(0, 3)}
                          </span>
                          <span className="truncate">{task.task_name}</span>
                        </div>
                        <div className="shrink-0 pl-1 text-[10px] font-mono opacity-80 hidden sm:block">
                          {duration}h
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
