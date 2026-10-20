import React, { useState, useMemo } from 'react';
import { MaintenanceTask } from '../../types';
import { Search, ChevronLeft, ChevronRight, Eye, Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ScheduleListViewProps {
  tasks: MaintenanceTask[];
  onSelectTask: (task: MaintenanceTask) => void;
}

const PRIORITY_BADGES: Record<string, string> = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH:     'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM:   'bg-amber-50 text-amber-700 border-amber-200',
  LOW:      'bg-blue-50 text-blue-700 border-blue-200',
};

const STATUS_BADGES: Record<string, string> = {
  QUEUED:            'bg-slate-100 text-slate-700',
  SCHEDULED:         'bg-blue-50 text-blue-700 border border-blue-200',
  IN_PROGRESS:       'bg-cyan-50 text-cyan-800 border border-cyan-200',
  COMPLETED:         'bg-emerald-50 text-emerald-800 border border-emerald-200',
  WAITING_FOR_SPARE: 'bg-amber-50 text-amber-800 border border-amber-200',
};

export const ScheduleListView: React.FC<ScheduleListViewProps> = ({ tasks, onSelectTask }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch =
        searchTerm === '' ||
        t.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.aircraft_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.task_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.technician_id && t.technician_id.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchSearch;
    });
  }, [tasks, searchTerm]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search & Counter Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks, aircraft, tech..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-800">{paginatedTasks.length}</span> of{' '}
          <span className="font-semibold text-slate-800">{filteredTasks.length}</span> filtered tasks
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="px-4 py-3">Task ID</th>
              <th className="px-4 py-3">Aircraft</th>
              <th className="px-4 py-3">Task Name</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Time Slot</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Technician</th>
              <th className="px-4 py-3">Spare Status</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  No maintenance tasks match your query.
                </td>
              </tr>
            ) : (
              paginatedTasks.map(task => {
                const priorityBadge = PRIORITY_BADGES[task.priority] ?? 'bg-slate-50 text-slate-600';
                const statusBadge = STATUS_BADGES[task.status] ?? 'bg-slate-100 text-slate-600';
                const startHour = (6 + (task.start_time_slot % 24)) % 24;
                const endHour = (6 + (task.end_time_slot % 24)) % 24;

                return (
                  <tr
                    key={task.task_id}
                    onClick={() => onSelectTask(task)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      {task.task_id}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {task.aircraft_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                      {task.task_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityBadge}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      +{task.start_time_slot}h → +{task.end_time_slot}h
                      <span className="text-[10px] text-slate-400 block font-sans">
                        ({startHour}:00 - {endHour}:00)
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {task.duration_hours}h
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {task.technician_id || <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      {task.required_part_id ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          task.spare_available !== false ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${task.spare_available !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {task.spare_available !== false ? 'In Stock' : 'Awaiting'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${statusBadge}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTask(task);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
