import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarClock, RefreshCw, Play, Filter, AlertTriangle,
  CheckCircle2, Wrench, Layers, Table, Calendar, Clock, RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import { MaintenanceTask, ScheduleOptimizationResult } from '../../types';
import { GanttChart } from '../../components/schedule/GanttChart';
import { CalendarView } from '../../components/schedule/CalendarView';
import { ScheduleListView } from '../../components/schedule/ScheduleListView';
import { TaskDetailPanel } from '../../components/schedule/TaskDetailPanel';
import { toast } from '../../components/ui/Toast';

interface MaintenanceTimetablePageProps {
  onSelectAircraft?: (aircraftId: string) => void;
}

export const MaintenanceTimetablePage: React.FC<MaintenanceTimetablePageProps> = ({ onSelectAircraft }) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active view: gantt | calendar | list
  const [viewMode, setViewMode] = useState<'gantt' | 'calendar' | 'list'>('gantt');
  const [groupBy, setGroupBy] = useState<'aircraft' | 'technician' | 'workshop'>('aircraft');

  // Selected task for modal detail view
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);

  // Filters
  const [filterAircraft, setFilterAircraft] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Fetch schedule tasks from backend
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getMaintenanceQueue();
      setTasks(res.tasks || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to load maintenance schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Run CP-SAT optimizer
  const handleOptimize = async () => {
    try {
      setIsOptimizing(true);
      const res: ScheduleOptimizationResult = await api.optimizeMaintenanceSchedule();
      toast.success(
        `Optimization Complete: ${res.conflicts_resolved} conflicts resolved, downtime reduced by ${res.downtime_reduction_hours.toFixed(1)}h!`
      );
      // Refresh tasks
      await fetchTasks();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to optimize maintenance schedule.');
    } finally {
      setIsOptimizing(false);
    }
  };

  // Conflict Detection Analysis
  const conflictReport = useMemo(() => {
    let conflicts = 0;
    const missingSpares = tasks.filter(t => t.required_part_id && t.spare_available === false).length;
    const completed = tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;

    // Check technician overlaps: tech assigned to 2 tasks overlapping in time slot
    const techSlots: Record<string, { start: number; end: number; taskId: string }[]> = {};
    tasks.forEach(t => {
      if (t.technician_id && t.status !== 'COMPLETED') {
        if (!techSlots[t.technician_id]) techSlots[t.technician_id] = [];
        techSlots[t.technician_id].push({ start: t.start_time_slot, end: t.end_time_slot, taskId: t.task_id });
      }
    });

    Object.values(techSlots).forEach(slots => {
      for (let i = 0; i < slots.length; i++) {
        for (let j = i + 1; j < slots.length; j++) {
          if (
            Math.max(slots[i].start, slots[j].start) <
            Math.min(slots[i].end, slots[j].end)
          ) {
            conflicts++;
          }
        }
      }
    });

    return {
      conflicts,
      missingSpares,
      completed,
      inProgress,
      total: tasks.length,
    };
  }, [tasks]);

  // Filtered task set
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterAircraft !== 'ALL' && t.aircraft_id !== filterAircraft) return false;
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, filterAircraft, filterPriority, filterStatus]);

  // Unique aircraft for filter dropdown
  const aircraftOptions = useMemo(() => {
    const set = new Set(tasks.map(t => t.aircraft_id));
    return Array.from(set).sort();
  }, [tasks]);

  const handleResetFilters = () => {
    setFilterAircraft('ALL');
    setFilterPriority('ALL');
    setFilterStatus('ALL');
  };

  const hasActiveFilters = filterAircraft !== 'ALL' || filterPriority !== 'ALL' || filterStatus !== 'ALL';

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Visual Maintenance Timetable
              </h1>
              <p className="text-xs text-slate-500">
                Gantt schedule and resource timeline driven by OR-Tools CP-SAT constraint optimization
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
          >
            <Play className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Solving CP-SAT Optimizer...' : 'Run Schedule Optimizer'}
          </button>
        </div>
      </div>

      {/* KPI & Conflict Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Scheduled Tasks</span>
            <CalendarClock className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{conflictReport.total}</p>
          <span className="text-[11px] text-slate-400">Total in timeline</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Resource Conflicts</span>
            <AlertTriangle className={`w-4 h-4 ${conflictReport.conflicts > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
          </div>
          <p className={`text-2xl font-bold ${conflictReport.conflicts > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {conflictReport.conflicts}
          </p>
          <span className="text-[11px] text-slate-400">
            {conflictReport.conflicts === 0 ? 'Optimal resource balance' : 'Overlapping technician slots'}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Missing Spares</span>
            <Wrench className={`w-4 h-4 ${conflictReport.missingSpares > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <p className={`text-2xl font-bold ${conflictReport.missingSpares > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {conflictReport.missingSpares}
          </p>
          <span className="text-[11px] text-slate-400">Awaiting inventory delivery</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>In Progress / Done</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {conflictReport.inProgress} / {conflictReport.completed}
          </p>
          <span className="text-[11px] text-slate-400">Active maintenance cycles</span>
        </div>
      </div>

      {/* Control Bar: View Mode Switcher, Grouping, and Filters */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* View Mode Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'gantt' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Gantt Timeline
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Schedule List
            </button>
          </div>

          {/* Grouping (for Gantt) */}
          {viewMode === 'gantt' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Group by:</span>
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="aircraft">Aircraft Unit</option>
                <option value="technician">Technician</option>
                <option value="workshop">Workshop</option>
              </select>
            </div>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-3 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Aircraft Filter */}
          <select
            value={filterAircraft}
            onChange={e => setFilterAircraft(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700"
          >
            <option value="ALL">All Aircraft</option>
            {aircraftOptions.map(id => (
              <option key={id} value={id}>Aircraft {id}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="WAITING_FOR_SPARE">Waiting for Spare</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-700 font-semibold text-sm">Loading Maintenance Schedule...</p>
          <p className="text-xs text-slate-400 mt-1">Fetching task queue and solver allocations</p>
        </div>
      ) : error ? (
        <div className="p-12 text-center bg-red-50 rounded-xl border border-red-200">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
          <p className="text-red-800 font-semibold text-sm">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Retry Loading
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-xl border border-slate-200">
          <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No maintenance schedule available yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Generate an optimized maintenance schedule using Google OR-Tools to assign slots, workshops, and technicians.
          </p>
          <button
            onClick={handleOptimize}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Run Schedule Optimizer Now
          </button>
        </div>
      ) : (
        <>
          {viewMode === 'gantt' && (
            <GanttChart
              tasks={filteredTasks}
              groupBy={groupBy}
              onSelectTask={task => setSelectedTask(task)}
            />
          )}

          {viewMode === 'calendar' && (
            <CalendarView
              tasks={filteredTasks}
              onSelectTask={task => setSelectedTask(task)}
            />
          )}

          {viewMode === 'list' && (
            <ScheduleListView
              tasks={filteredTasks}
              onSelectTask={task => setSelectedTask(task)}
            />
          )}
        </>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSelectAircraft={onSelectAircraft}
        />
      )}
    </div>
  );
};
