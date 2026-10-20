import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Clock, CheckCircle2, AlertTriangle, Package, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { api } from '../../services/api';
import { MaintenanceTask } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../components/ui/Toast';

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-rose-100 text-rose-700 border-rose-200',
  HIGH:     'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  LOW:      'bg-slate-100 text-slate-600 border-slate-200',
};

const STATUS_COLORS: Record<string, string> = {
  QUEUED:            'bg-slate-100 text-slate-600',
  SCHEDULED:         'bg-blue-100 text-blue-700',
  IN_PROGRESS:       'bg-cyan-100 text-cyan-700',
  WAITING_FOR_SPARE: 'bg-amber-100 text-amber-700',
  COMPLETED:         'bg-emerald-100 text-emerald-700',
};

// Valid next statuses per current status
const VALID_TRANSITIONS: Record<string, string[]> = {
  QUEUED:            ['SCHEDULED', 'IN_PROGRESS'],
  SCHEDULED:         ['IN_PROGRESS', 'WAITING_FOR_SPARE'],
  IN_PROGRESS:       ['COMPLETED', 'WAITING_FOR_SPARE'],
  WAITING_FOR_SPARE: ['SCHEDULED', 'IN_PROGRESS'],
  COMPLETED:         [],
};

const FILTERS = ['All', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_SPARE', 'COMPLETED', 'QUEUED'];

interface TaskDetailPanelProps {
  task: MaintenanceTask;
  onClose: () => void;
  onStatusUpdate: (taskId: string, newStatus: string) => Promise<void>;
  updatingId: string | null;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({ task, onClose, onStatusUpdate, updatingId }) => {
  const nextStatuses = VALID_TRANSITIONS[task.status?.toUpperCase() || 'QUEUED'] || [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Task Details">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-aerospace-900">Task Details</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Task ID',    value: task.task_id },
              { label: 'Aircraft',   value: task.aircraft_id },
              { label: 'Component',  value: task.component_id },
              { label: 'Priority',   value: task.priority },
              { label: 'Duration',   value: `${task.duration_hours}h` },
              { label: 'RUL Deadline', value: `${task.rul_deadline_hours}h` },
              { label: 'Technician', value: task.technician_id || 'Unassigned' },
              { label: 'Workshop',   value: task.workshop_id || 'TBD' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-[10px] font-semibold text-slate-400 uppercase">{label}</div>
                <div className="text-xs font-medium text-slate-800 font-mono">{value}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Task</div>
            <div className="text-sm font-medium text-slate-800">{task.task_name}</div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Status</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${STATUS_COLORS[task.status?.toUpperCase()] || 'bg-slate-100 text-slate-600'}`}>
              {task.status}
            </span>
          </div>

          {task.required_part_id && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Required Spare</div>
              <div className="text-xs font-mono text-slate-700">{task.required_part_id}</div>
              <div className={`text-[10px] font-bold mt-1 ${task.spare_available === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                {task.spare_available === false ? '⚠ Spare not available' : '✓ Spare available'}
              </div>
            </div>
          )}

          {nextStatuses.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <div className="text-[10px] text-slate-400 font-semibold uppercase mb-2">Update Status</div>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => onStatusUpdate(task.task_id, status)}
                    disabled={updatingId === task.task_id}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                      status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100' :
                      status === 'IN_PROGRESS' ? 'bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100' :
                      'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {updatingId === task.task_id ? 'Updating...' : `→ ${status.replace(/_/g, ' ')}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const TechnicianDashboard: React.FC = () => {
  const { username } = useAuth();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const res = await api.getMaintenanceQueue();
      setTasks(res.tasks || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    setUpdatingId(taskId);
    try {
      const res = await api.updateTaskStatus(taskId, newStatus);
      toast.success('Status Updated', res.message);
      await fetchTasks();
      setSelectedTask(null);
    } catch (err: any) {
      toast.error('Update Failed', err?.response?.data?.detail || 'Unable to update task status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // KPIs
  const statusCounts = tasks.reduce((acc, t) => {
    const s = (t.status || 'QUEUED').toUpperCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpis = [
    { label: 'Total Tasks',       value: tasks.length,                                  color: 'text-aerospace-700', bg: 'bg-aerospace-50', border: 'border-aerospace-200' },
    { label: 'Scheduled',         value: statusCounts.SCHEDULED || 0,                   color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'In Progress',       value: statusCounts.IN_PROGRESS || 0,                 color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    { label: 'Completed',         value: statusCounts.COMPLETED || 0,                   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Awaiting Spares',   value: statusCounts.WAITING_FOR_SPARE || 0,           color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  ];

  const filteredTasks = tasks.filter(t =>
    filter === 'All' || (t.status || '').toUpperCase() === filter
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 animate-pulse" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-3" />
        <p className="text-sm text-slate-600 mb-4">Unable to load task data.</p>
        <button onClick={fetchTasks} className="bg-aerospace-900 text-white text-xs font-semibold px-4 py-2 rounded-lg">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-aerospace-900">Technician Workspace</h1>
            <p className="text-xs text-slate-500 mt-0.5">Assigned maintenance activities and work progress</p>
          </div>
          <button onClick={fetchTasks} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-aerospace-900 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-white rounded-xl border ${k.border} shadow-sm p-4`}>
            <div className={`text-2xl font-bold ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-bold text-aerospace-900">My Tasks</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-aerospace-600"
            aria-label="Filter tasks by status"
          >
            {FILTERS.map(f => <option key={f} value={f}>{f === 'All' ? 'All Tasks' : f.replace(/_/g, ' ')}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Task ID', 'Aircraft', 'Task', 'Priority', 'Slot', 'Duration', 'Spare', 'Status', 'Action'].map(h => (
                  <th key={h} className="py-2.5 px-3 text-slate-500 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-slate-400">No tasks match this filter.</td></tr>
              ) : filteredTasks.map((t) => (
                <tr
                  key={t.task_id}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTask(t)}
                >
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{t.task_id.slice(-6)}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-aerospace-900">{t.aircraft_id}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 max-w-[160px] truncate">{t.task_name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">{t.start_time_slot}–{t.end_time_slot}h</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.duration_hours}h</td>
                  <td className="py-2.5 px-3">
                    {t.required_part_id ? (
                      <span className={`text-[10px] font-bold ${t.spare_available === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {t.spare_available === false ? '⚠ Missing' : '✓ OK'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">None</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${STATUS_COLORS[t.status?.toUpperCase()] || 'bg-slate-100 text-slate-600'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                    {(VALID_TRANSITIONS[t.status?.toUpperCase() || ''] || []).length > 0 && (
                      <button
                        onClick={() => setSelectedTask(t)}
                        className="text-[10px] font-semibold text-aerospace-700 hover:text-aerospace-900 border border-aerospace-200 hover:bg-aerospace-50 px-2 py-1 rounded transition-colors"
                        aria-label={`Update status for task ${t.task_id}`}
                      >
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Detail Panel */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onStatusUpdate={handleStatusUpdate}
          updatingId={updatingId}
        />
      )}
    </div>
  );
};
