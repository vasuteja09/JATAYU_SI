import React, { useState, useMemo } from 'react';
import { MaintenanceTask } from '../../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Wrench } from 'lucide-react';

interface CalendarViewProps {
  tasks: MaintenanceTask[];
  onSelectTask: (task: MaintenanceTask) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH:     'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM:   'bg-amber-100 text-amber-800 border-amber-300',
  LOW:      'bg-blue-100 text-blue-800 border-blue-300',
};

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks, onSelectTask }) => {
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Map tasks to relative calendar days (Day 0 = Today, Day 1 = Tomorrow, etc.)
  const tasksByDay = useMemo(() => {
    const map: Record<number, MaintenanceTask[]> = {};
    tasks.forEach(t => {
      // baseline = 06:00 on Day 0
      const startTotalHours = 6 + (t.start_time_slot ?? 0);
      const dayOffset = Math.floor(startTotalHours / 24);
      if (!map[dayOffset]) map[dayOffset] = [];
      map[dayOffset].push(t);
    });
    // Sort tasks in each day by start hour
    Object.keys(map).forEach(key => {
      map[Number(key)].sort((a, b) => a.start_time_slot - b.start_time_slot);
    });
    return map;
  }, [tasks]);

  // Compute 7 days for the week view based on current offset
  const weekDays = useMemo(() => {
    const days = [];
    const baseDate = new Date();
    for (let i = 0; i < 7; i++) {
      const dayOffset = selectedDayOffset + i;
      const d = new Date(baseDate);
      d.setDate(d.getDate() + dayOffset);
      days.push({
        dayOffset,
        date: d,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isToday: dayOffset === 0,
      });
    }
    return days;
  }, [selectedDayOffset]);

  const handlePrev = () => {
    setSelectedDayOffset(prev => prev - (viewMode === 'week' ? 7 : 1));
  };

  const handleNext = () => {
    setSelectedDayOffset(prev => prev + (viewMode === 'week' ? 7 : 1));
  };

  const handleToday = () => {
    setSelectedDayOffset(0);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {viewMode === 'week' ? '7-Day Schedule View' : 'Single Day View'}
            </h3>
            <p className="text-xs text-slate-500">
              {selectedDayOffset === 0
                ? 'Showing from Today'
                : selectedDayOffset > 0
                ? `+${selectedDayOffset} days ahead`
                : `${Math.abs(selectedDayOffset)} days prior`}
            </p>
          </div>
        </div>

        {/* View mode toggle & navigation */}
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'day' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day View
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handlePrev}
              aria-label="Previous period"
              className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next period"
              className="p-1 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week Grid */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[420px]">
          {weekDays.map(day => {
            const dayTasks = tasksByDay[day.dayOffset] || [];
            return (
              <div key={day.dayOffset} className={`flex flex-col ${day.isToday ? 'bg-blue-50/20' : 'bg-white'}`}>
                {/* Day Header */}
                <div className={`p-3 text-center border-b border-slate-200 ${day.isToday ? 'bg-blue-50' : 'bg-slate-50'}`}>
                  <span className={`text-[11px] font-bold uppercase tracking-wider block ${day.isToday ? 'text-blue-700' : 'text-slate-500'}`}>
                    {day.dayName}
                  </span>
                  <span className={`text-sm font-semibold block ${day.isToday ? 'text-blue-900 font-bold' : 'text-slate-800'}`}>
                    {day.dateStr}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {/* Day Task List */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                  {dayTasks.length === 0 ? (
                    <div className="py-8 text-center text-[11px] text-slate-300">
                      No tasks
                    </div>
                  ) : (
                    dayTasks.map(task => {
                      const colorClass = PRIORITY_COLORS[task.priority] ?? 'bg-slate-100 text-slate-700 border-slate-200';
                      const startH = (6 + (task.start_time_slot % 24)) % 24;
                      return (
                        <button
                          key={task.task_id}
                          onClick={() => onSelectTask(task)}
                          className={`w-full text-left p-2.5 rounded-lg border text-xs shadow-2xs hover:shadow-sm transition-all cursor-pointer ${colorClass}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono font-bold text-[11px]">{task.aircraft_id}</span>
                            <span className="text-[10px] font-mono opacity-80">{startH}:00 ({task.duration_hours}h)</span>
                          </div>
                          <p className="font-medium truncate leading-tight text-slate-900">{task.task_name}</p>
                          <div className="mt-1 flex items-center justify-between text-[10px] opacity-75">
                            <span className="truncate">{task.technician_id || 'Tech queued'}</span>
                            <span className="capitalize">{task.status.toLowerCase()}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Single Day View */
        <div className="p-6">
          <div className="max-w-2xl mx-auto space-y-3">
            {(!tasksByDay[selectedDayOffset] || tasksByDay[selectedDayOffset].length === 0) ? (
              <div className="p-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold text-sm">No maintenance tasks scheduled for this day.</p>
                <p className="text-xs text-slate-400 mt-1">Use arrow buttons above to view other days.</p>
              </div>
            ) : (
              tasksByDay[selectedDayOffset].map(task => {
                const colorClass = PRIORITY_COLORS[task.priority] ?? 'bg-slate-100 text-slate-700 border-slate-200';
                const startH = (6 + (task.start_time_slot % 24)) % 24;
                const endH = (6 + (task.end_time_slot % 24)) % 24;

                return (
                  <button
                    key={task.task_id}
                    onClick={() => onSelectTask(task)}
                    className="w-full text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm transition-all flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                        <Wrench className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-slate-900 text-sm">{task.aircraft_id}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${colorClass}`}>
                            {task.priority}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">({task.task_id})</span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-800">{task.task_name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Assigned: <span className="font-medium text-slate-700">{task.technician_id || 'Queued'}</span> | Workshop: <span className="font-medium text-slate-700">{task.workshop_id || 'General'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-slate-700 text-xs font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{startH}:00 – {endH}:00</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block mt-1">
                        {task.duration_hours} hours total
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
