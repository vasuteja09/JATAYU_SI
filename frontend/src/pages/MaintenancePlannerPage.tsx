import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  UserCheck,
  Building2,
  Boxes
} from 'lucide-react';
import { api } from '../services/api';
import { MaintenanceTask, ScheduleOptimizationResult } from '../types';
import { DataProvenanceNote } from '../components/ui/DataProvenanceNote';
import { ApiError } from '../components/ui/ApiError';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';

export const MaintenancePlannerPage: React.FC = () => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<ScheduleOptimizationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState<string>('');

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const res = await api.getMaintenanceQueue();
      setTasks(res.tasks);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRunOptimizer = async () => {
    setOptimizing(true);
    setOptimizationStep('Analyzing airframe RUL deadlines & skill constraints...');
    
    setTimeout(() => {
      setOptimizationStep('Evaluating technician availability & workshop bays with CP-SAT...');
    }, 400);

    setTimeout(() => {
      setOptimizationStep('Minimizing downtime & resolving resource conflicts...');
    }, 800);

    try {
      const res = await api.optimizeMaintenanceSchedule();
      setOptimizationResult(res);
      setTasks(res.schedule);
      toast.success(
        'Schedule optimized',
        `OR-Tools CP-SAT resolved ${res.conflicts_resolved ?? 0} conflicts. Fleet availability: ${(res.projected_fleet_availability * 100).toFixed(1)}%`
      );
    } catch {
      toast.error('Optimizer failed', 'Unable to run the maintenance optimizer. Please try again.');
    } finally {
      setTimeout(() => {
        setOptimizing(false);
        setOptimizationStep('');
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-aerospace-900 tracking-tight">Maintenance Schedule Optimizer</h1>
            <span className="text-xs bg-aerospace-100 text-aerospace-800 font-semibold px-2 py-0.5 rounded border border-aerospace-200">
              OR-Tools CP-SAT
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Constraint programming engine balancing technician skill certifications, workshop bay capacities, spare part lead times, and RUL deadlines.
          </p>
        </div>

        <button
          onClick={handleRunOptimizer}
          disabled={optimizing}
          className="flex items-center gap-2 bg-aerospace-900 hover:bg-aerospace-800 disabled:bg-slate-400 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-all shadow-sm"
        >
          <Wrench className={`w-4 h-4 text-sky-400 ${optimizing ? 'animate-spin' : ''}`} />
          <span>{optimizing ? 'Solving Constraints...' : 'Run OR-Tools Optimizer'}</span>
        </button>
      </div>

      {/* Optimizing Progress Banner */}
      {optimizing && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 flex items-center gap-3 animate-pulse">
          <Cpu className="w-5 h-5 text-aerospace-700 animate-spin" />
          <div className="text-xs">
            <div className="font-bold text-aerospace-900">Constraint Programming Solver in Progress</div>
            <div className="text-slate-600">{optimizationStep}</div>
          </div>
        </div>
      )}

      {/* Before / After Impact Comparison (§24, §65) */}
      {optimizationResult && (
        <div className="aerospace-card p-5 bg-gradient-to-r from-white via-slate-50 to-white border-2 border-emerald-400/60 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-aerospace-900">
                OR-Tools CP-SAT Optimization Result
              </h3>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
              {optimizationResult.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Availability Impact */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Fleet Availability</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base text-slate-400 line-through font-mono">
                  {optimizationResult.baseline_fleet_availability}%
                </span>
                <span className="text-xl font-bold text-emerald-600 font-mono">
                  {optimizationResult.projected_fleet_availability}%
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +{optimizationResult.availability_improvement_percent}% Projected Availability
              </span>
            </div>

            {/* Downtime Reduction */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Fleet Downtime</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base text-slate-400 line-through font-mono">
                  {optimizationResult.baseline_downtime_hours}h
                </span>
                <span className="text-xl font-bold text-aerospace-900 font-mono">
                  {optimizationResult.optimized_downtime_hours}h
                </span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                -{optimizationResult.downtime_reduction_hours} hours downtime saved
              </span>
            </div>

            {/* Conflicts Resolved */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Conflicts Resolved</span>
              <div className="text-xl font-bold text-aerospace-900 font-mono mt-1">
                {optimizationResult.conflicts_resolved} Conflicts
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Technician & bay overlap eliminated
              </span>
            </div>

            {/* Tasks Sequenced */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Tasks Scheduled</span>
              <div className="text-xl font-bold text-aerospace-900 font-mono mt-1">
                {optimizationResult.schedule.length} Work Orders
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Prioritized by RUL deadlines
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Task Queue & Optimized Timeline */}
      <div className="aerospace-card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-semibold text-aerospace-900">
              Maintenance Task Queue & Horizon Sequencing
            </h3>
            <p className="text-xs text-slate-500">
              Tasks sorted deterministically by composite priority score (Failure Risk, RUL Urgency, Airframe Health).
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">{tasks.length} active tasks</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Airframe</th>
                <th className="py-2.5 px-3">Task Description</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Assigned Tech</th>
                <th className="py-2.5 px-3">Workshop Bay</th>
                <th className="py-2.5 px-3">Time Slot</th>
                <th className="py-2.5 px-3">RUL Deadline</th>
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.task_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-aerospace-900">{t.aircraft_id}</td>
                  <td className="py-3 px-3 font-medium text-slate-800">{t.task_name}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                      t.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                      t.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {t.priority} ({t.priority_score})
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-700">{t.duration_hours} hrs</td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.technician_id || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.workshop_id || 'Depot Alpha'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-800 font-semibold">
                    Hour {t.start_time_slot} → {t.end_time_slot}
                  </td>
                  <td className="py-3 px-3 font-mono text-rose-600 font-semibold">
                    {t.rul_deadline_hours}h
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                      t.is_optimized ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {t.is_optimized ? 'OPTIMIZED' : 'QUEUED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DataProvenanceNote />
    </div>
  );
};
