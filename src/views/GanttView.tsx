import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  Info,
  Maximize2,
  GitBranch,
  Edit2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Activity, Priority } from '../types/project';
import {
  formatDate,
  addWeeksToDate,
  getPriorityColor,
  getStatusColor,
  calculateWeeksBetween
} from '../utils/dateUtils';

interface GanttViewProps {
  onOpenQuickSchedule: () => void;
}

export const GanttView: React.FC<GanttViewProps> = ({ onOpenQuickSchedule }) => {
  const {
    activities,
    openEditDrawer,
    updateActivity,
    responsibles
  } = useProject();

  const [viewMode, setViewMode] = useState<'weeks' | 'months'>('weeks');
  const [filterPriority, setFilterPriority] = useState<string>('Todas');
  const [filterResp, setFilterResp] = useState<string>('Todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      if (filterPriority !== 'Todas' && act.priority !== filterPriority) return false;
      if (filterResp !== 'Todos' && act.responsible !== filterResp) return false;
      if (searchTerm.trim() && !act.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [activities, filterPriority, filterResp, searchTerm]);

  // Determine earliest start date across all scheduled activities
  const { earliestDate, totalProjectWeeks } = useMemo(() => {
    const datedActivities = activities.filter(a => a.startDate && a.startDate.trim() !== '');
    if (datedActivities.length === 0) {
      // Default to today if no dates
      const today = new Date();
      return {
        earliestDate: today,
        totalProjectWeeks: 20
      };
    }

    const startDates = datedActivities.map(a => new Date(a.startDate! + 'T00:00:00').getTime());
    const minStart = new Date(Math.min(...startDates));

    const endDates = datedActivities
      .filter(a => a.endDate)
      .map(a => new Date(a.endDate! + 'T00:00:00').getTime());

    const maxEnd = endDates.length > 0 ? new Date(Math.max(...endDates)) : new Date(minStart.getTime() + 14 * 7 * 86400000);
    const diffWeeks = Math.max(16, Math.ceil((maxEnd.getTime() - minStart.getTime()) / (7 * 86400000)) + 4);

    return {
      earliestDate: minStart,
      totalProjectWeeks: diffWeeks
    };
  }, [activities]);

  // Column width config
  const colWidth = viewMode === 'weeks' ? 56 : 140;

  // Generate timeline columns
  const timelineColumns = useMemo(() => {
    const cols: { weekIndex: number; weekLabel: string; monthLabel: string; dateStart: Date }[] = [];
    const base = new Date(earliestDate);
    // Align base to start of week (Monday)
    const day = base.getDay();
    const diff = base.getDate() - day + (day === 0 ? -6 : 1);
    base.setDate(diff);

    for (let i = 0; i < totalProjectWeeks; i++) {
      const curDate = new Date(base);
      curDate.setDate(base.getDate() + i * 7);

      const monthName = curDate.toLocaleDateString('es-ES', { month: 'short' });
      const year = curDate.getFullYear();

      cols.push({
        weekIndex: i + 1,
        weekLabel: `Sem ${i + 1}`,
        monthLabel: `${monthName.toUpperCase()} ${year}`,
        dateStart: curDate
      });
    }
    return cols;
  }, [earliestDate, totalProjectWeeks]);

  // Month groupings for top header
  const monthGroups = useMemo(() => {
    const groups: { month: string; span: number }[] = [];
    timelineColumns.forEach(col => {
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.month === col.monthLabel) {
        lastGroup.span += 1;
      } else {
        groups.push({ month: col.monthLabel, span: 1 });
      }
    });
    return groups;
  }, [timelineColumns]);

  // Calculate pixel position for an activity
  const getActivityMetrics = (act: Activity) => {
    if (!act.startDate) {
      return null;
    }
    const actStart = new Date(act.startDate + 'T00:00:00');
    const baseMonday = timelineColumns[0]?.dateStart || earliestDate;
    const diffDays = (actStart.getTime() - baseMonday.getTime()) / (86400000);
    const startWeekOffset = Math.max(0, diffDays / 7);

    const left = startWeekOffset * colWidth;
    const width = Math.max(36, act.durationWeeks * colWidth);

    return { left, width, startWeekOffset };
  };

  // Shift activity start date by N weeks
  const handleShiftActivity = (act: Activity, weekDelta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!act.startDate) return;

    const curStart = new Date(act.startDate + 'T00:00:00');
    curStart.setDate(curStart.getDate() + weekDelta * 7);
    const newStartStr = curStart.toISOString().split('T')[0];
    const newEndStr = addWeeksToDate(newStartStr, act.durationWeeks);

    updateActivity(
      {
        ...act,
        startDate: newStartStr,
        endDate: newEndStr
      },
      true // cascade to dependent tasks
    );
  };

  // SVG Dependency Arrows
  const dependencyLines = useMemo(() => {
    const lines: {
      fromAct: Activity;
      toAct: Activity;
      d: string;
      critical: boolean;
    }[] = [];

    const rowHeight = 48; // px per row
    const barHeight = 28;
    const rowTopOffset = 10;

    const rowIndices = new Map<number, number>();
    filteredActivities.forEach((act, idx) => {
      rowIndices.set(act.id, idx);
    });

    filteredActivities.forEach(targetAct => {
      const targetIdx = rowIndices.get(targetAct.id);
      if (targetIdx === undefined) return;
      const targetMetrics = getActivityMetrics(targetAct);
      if (!targetMetrics) return;

      const preds = targetAct.dependencies || [];
      preds.forEach(predId => {
        const predAct = activities.find(a => a.id === predId);
        if (!predAct) return;
        const predIdx = rowIndices.get(predId);
        if (predIdx === undefined) return;
        const predMetrics = getActivityMetrics(predAct);
        if (!predMetrics) return;

        // Coordinates
        const startX = predMetrics.left + predMetrics.width;
        const startY = predIdx * rowHeight + rowTopOffset + barHeight / 2;
        const endX = targetMetrics.left;
        const endY = targetIdx * rowHeight + rowTopOffset + barHeight / 2;

        let path = '';
        if (startX <= endX) {
          // Standard forward arrow with smooth curve
          const midX = (startX + endX) / 2;
          path = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;
        } else {
          // Loopback if dragged backward
          const loopX = startX + 15;
          path = `M ${startX} ${startY} H ${loopX} V ${endY} H ${endX}`;
        }

        lines.push({
          fromAct: predAct,
          toAct: targetAct,
          d: path,
          critical: false
        });
      });
    });

    return lines;
  }, [filteredActivities, activities, colWidth]);

  return (
    <div className="space-y-4">
      {/* Control & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar actividad..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Prioridad:</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todas">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Responsable:</span>
            <select
              value={filterResp}
              onChange={e => setFilterResp(e.target.value)}
              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-44 truncate"
            >
              <option value="Todos">Todos</option>
              {responsibles.map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Scale & Actions */}
        <div className="flex items-center gap-3">
          {/* View Scale Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('weeks')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'weeks' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semanas
            </button>
            <button
              onClick={() => setViewMode('months')}
              className={`px-3 py-1 rounded-md transition-colors ${
                viewMode === 'months' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Meses
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenQuickSchedule}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Asistente de Fechas</span>
          </button>
        </div>
      </div>

      {/* Gantt Interactive Board */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        {/* Priority & Dependency Legend Bar */}
        <div className="px-5 py-2.5 bg-slate-50/90 border-b border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-600">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-slate-700">Prioridad:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-400" />
              <span>Alta (rojo suave)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-amber-400" />
              <span>Media (amarillo)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-400" />
              <span>Baja (verde)</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1">
              <GitBranch className="w-3.5 h-3.5 text-blue-500" />
              <span>Flechas: Dependencias entre tareas</span>
            </span>
            <span>·</span>
            <span>Haz clic en cualquier barra o fila para editar</span>
          </div>
        </div>

        {/* Main Split View: Left Activity Info Table + Right Gantt Timeline */}
        <div className="flex overflow-hidden">
          {/* Left Panel: Activities List */}
          <div className="w-80 shrink-0 border-r border-slate-200 bg-white z-10 shadow-xs">
            {/* Table Header */}
            <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>Actividad y Responsable</span>
              <span>Duración</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100">
              {filteredActivities.map(act => {
                const priorityColor = getPriorityColor(act.priority);
                const statusColor = getStatusColor(act.status);

                return (
                  <div
                    key={act.id}
                    onClick={() => openEditDrawer(act)}
                    className="h-12 px-4 flex items-center justify-between hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 truncate mr-2">
                      <span className="font-mono text-xs font-bold text-slate-600 group-hover:text-blue-600">
                        #{act.id}
                      </span>
                      <div className="truncate">
                        <div className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 truncate">
                          {act.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
                          <span>{act.responsible}</span>
                          <span>·</span>
                          <span className={`font-semibold ${priorityColor.text}`}>
                            {act.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-xs font-bold text-slate-700 tabular-nums">
                        {act.durationWeeks} sem.
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {act.progress}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Scrollable Gantt Timeline */}
          <div
            ref={containerRef}
            className="flex-1 overflow-x-auto relative select-none"
            style={{ minHeight: `${filteredActivities.length * 48 + 64}px` }}
          >
            {/* Timeline Header (Months + Weeks) */}
            <div
              className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200"
              style={{ width: `${timelineColumns.length * colWidth}px` }}
            >
              {/* Row 1: Months */}
              <div className="h-7 flex border-b border-slate-200 text-[11px] font-bold text-slate-700">
                {monthGroups.map((g, idx) => (
                  <div
                    key={idx}
                    className="px-2 flex items-center border-r border-slate-200/80 bg-slate-100/60"
                    style={{ width: `${g.span * colWidth}px` }}
                  >
                    <span className="truncate">{g.month}</span>
                  </div>
                ))}
              </div>

              {/* Row 2: Weeks */}
              <div className="h-9 flex text-[11px] font-semibold text-slate-600 font-mono">
                {timelineColumns.map(col => (
                  <div
                    key={col.weekIndex}
                    className="flex flex-col items-center justify-center border-r border-slate-200/60"
                    style={{ width: `${colWidth}px` }}
                  >
                    <span>{col.weekLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Body Canvas */}
            <div
              className="relative"
              style={{
                width: `${timelineColumns.length * colWidth}px`,
                height: `${filteredActivities.length * 48}px`
              }}
            >
              {/* Background Vertical Grid Columns */}
              <div className="absolute inset-0 flex pointer-events-none">
                {timelineColumns.map(col => (
                  <div
                    key={col.weekIndex}
                    className={`h-full border-r border-slate-100 ${
                      col.weekIndex % 2 === 0 ? 'bg-slate-50/30' : ''
                    }`}
                    style={{ width: `${colWidth}px` }}
                  />
                ))}
              </div>

              {/* SVG Overlay for Dependency Lines */}
              <svg
                className="absolute inset-0 pointer-events-none z-15"
                style={{
                  width: `${timelineColumns.length * colWidth}px`,
                  height: `${filteredActivities.length * 48}px`
                }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
                  </marker>
                </defs>

                {dependencyLines.map((line, idx) => (
                  <path
                    key={idx}
                    d={line.d}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead)"
                    opacity={0.85}
                  />
                ))}
              </svg>

              {/* Gantt Activity Bars */}
              {filteredActivities.map((act, rowIdx) => {
                const metrics = getActivityMetrics(act);
                const priorityColor = getPriorityColor(act.priority);
                const statusColor = getStatusColor(act.status);
                const top = rowIdx * 48 + 10;

                if (!metrics) {
                  // Activity dates are "Por definir"
                  return (
                    <div
                      key={act.id}
                      onClick={() => openEditDrawer(act)}
                      className="absolute h-7 rounded-md border border-dashed border-amber-300 bg-amber-50/80 px-3 flex items-center gap-2 cursor-pointer hover:bg-amber-100 transition-colors z-10"
                      style={{ top: `${top}px`, left: '16px', width: `${act.durationWeeks * colWidth}px` }}
                      title="Haz clic para definir fechas"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs text-amber-800 font-semibold truncate">
                        #{act.id} {act.name} (Fechas por definir · {act.durationWeeks} sem)
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={act.id}
                    onClick={() => openEditDrawer(act)}
                    className="absolute h-7 rounded-md shadow-xs cursor-pointer group transition-all z-10 border overflow-hidden flex items-center justify-between"
                    style={{
                      top: `${top}px`,
                      left: `${metrics.left}px`,
                      width: `${metrics.width}px`,
                      backgroundColor: priorityColor.bar,
                      borderColor: priorityColor.raw
                    }}
                    title={`#${act.id} ${act.name}\nDuración: ${act.durationWeeks} semanas\nInicio: ${formatDate(act.startDate)} | Fin: ${formatDate(act.endDate)}\nAvance: ${act.progress}%\nResponsable: ${act.responsible}`}
                  >
                    {/* Internal Progress Fill */}
                    <div
                      className="absolute inset-y-0 left-0 bg-slate-900/20 pointer-events-none transition-all duration-300"
                      style={{ width: `${act.progress}%` }}
                    />

                    {/* Left shift control button */}
                    <button
                      type="button"
                      onClick={e => handleShiftActivity(act, -1, e)}
                      title="Mover 1 semana antes"
                      className="relative z-20 h-full px-1 text-slate-800/60 hover:text-slate-950 hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {/* Bar Label */}
                    <div className="relative z-10 px-2 truncate flex items-center gap-1.5 text-xs font-bold text-slate-900">
                      <span className="font-mono text-[10px] bg-white/70 px-1 py-0.2 rounded">
                        #{act.id}
                      </span>
                      <span className="truncate">{act.name}</span>
                      <span className="text-[10px] opacity-80 font-mono shrink-0">
                        ({act.progress}%)
                      </span>
                    </div>

                    {/* Right shift control button */}
                    <button
                      type="button"
                      onClick={e => handleShiftActivity(act, 1, e)}
                      title="Mover 1 semana después"
                      className="relative z-20 h-full px-1 text-slate-800/60 hover:text-slate-950 hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
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
