import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  TrendingDown,
  TrendingUp,
  Sliders,
  User,
  ArrowRight,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Activity } from '../types/project';
import {
  formatDate,
  isActivityDelayed,
  getPriorityColor,
  getStatusColor
} from '../utils/dateUtils';

export const TrackingControlView: React.FC = () => {
  const {
    activities,
    updateActivity,
    openEditDrawer,
    responsibleStats,
    kpis
  } = useProject();

  const [activeSegment, setActiveSegment] = useState<'todos' | 'vencidas' | 'proximas' | 'pendientes'>('todos');

  // Detect overdue and upcoming activities
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const analysis = useMemo(() => {
    const overdue: Activity[] = [];
    const upcoming: Activity[] = [];
    const pending: Activity[] = [];

    activities.forEach(act => {
      if (act.status === 'Pendiente' || act.progress === 0) {
        pending.push(act);
      }

      if (isActivityDelayed(act)) {
        overdue.push(act);
      } else if (act.endDate && act.status !== 'Completada') {
        const end = new Date(act.endDate + 'T00:00:00');
        const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 21) {
          upcoming.push(act);
        }
      }
    });

    return { overdue, upcoming, pending };
  }, [activities, now]);

  // Filtered by active segment
  const displayedActivities = useMemo(() => {
    switch (activeSegment) {
      case 'vencidas':
        return analysis.overdue;
      case 'proximas':
        return analysis.upcoming;
      case 'pendientes':
        return analysis.pending;
      case 'todos':
      default:
        return activities;
    }
  }, [activeSegment, analysis, activities]);

  const handleUpdateProgress = (act: Activity, newProg: number) => {
    const p = Math.max(0, Math.min(100, newProg));
    let status = act.status;
    if (p === 100) status = 'Completada';
    else if (p > 0 && status === 'Pendiente') status = 'En ejecución';
    updateActivity({ ...act, progress: p, status });
  };

  return (
    <div className="space-y-6">
      {/* KPI Alert Strip for Control */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tareas Vencidas */}
        <div
          onClick={() => setActiveSegment('vencidas')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSegment === 'vencidas'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-700">Tareas Vencidas / Retrasadas</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
            {analysis.overdue.length}
          </div>
          <p className="text-[11px] text-rose-600/80 mt-1">
            {analysis.overdue.length > 0 ? 'Requieren intervención inmediata' : 'Al día, sin retrasos críticos'}
          </p>
        </div>

        {/* Próximas a Vencer */}
        <div
          onClick={() => setActiveSegment('proximas')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSegment === 'proximas'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-800">Próximas a Vencer (3 semanas)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {analysis.upcoming.length}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-1">
            En fase de entrega próxima
          </p>
        </div>

        {/* Pendientes de Inicio */}
        <div
          onClick={() => setActiveSegment('pendientes')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeSegment === 'pendientes'
              ? 'bg-slate-100 border-slate-300 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Actividades Pendientes</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-800 tabular-nums">
            {analysis.pending.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Aún no han registrado avance
          </p>
        </div>

        {/* Avance vs Planificado */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Avance Real vs Planificado</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {kpis.overallProgress}%
            </span>
            <span className="text-xs text-slate-500">global</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${kpis.overallProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Segment Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSegment('todos')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSegment === 'todos' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas las Actividades ({activities.length})
        </button>

        <button
          onClick={() => setActiveSegment('vencidas')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSegment === 'vencidas' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Retrasadas / Vencidas ({analysis.overdue.length})
        </button>

        <button
          onClick={() => setActiveSegment('proximas')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSegment === 'proximas' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Próximas a Vencer ({analysis.upcoming.length})
        </button>

        <button
          onClick={() => setActiveSegment('pendientes')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            activeSegment === 'pendientes' ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Pendientes ({analysis.pending.length})
        </button>
      </div>

      {/* Control & Tracking Cards List */}
      <div className="space-y-3">
        {displayedActivities.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs">
            No hay actividades en esta categoría de seguimiento.
          </div>
        ) : (
          displayedActivities.map(act => {
            const isDelayed = isActivityDelayed(act);
            const priorityColor = getPriorityColor(act.priority);
            const statusColor = getStatusColor(act.status);

            return (
              <div
                key={act.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs transition-all ${
                  isDelayed ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Task Info */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <span className="font-mono text-xs font-bold px-2 py-1 bg-slate-900 text-white rounded shrink-0">
                      #{act.id}
                    </span>

                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4
                          onClick={() => openEditDrawer(act)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {act.name}
                        </h4>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityColor.bg} ${priorityColor.text} ${priorityColor.border}`}>
                          {act.priority}
                        </span>

                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                          {act.status}
                        </span>

                        {isDelayed && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                            Retraso detectado
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700">{act.responsible}</strong>
                        </span>
                        <span>·</span>
                        <span>Duración: <strong>{act.durationWeeks} semanas</strong></span>
                        <span>·</span>
                        <span>
                          {act.startDate && act.endDate
                            ? `${formatDate(act.startDate)} → ${formatDate(act.endDate)}`
                            : 'Fechas por definir'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Progress Registrar */}
                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 shrink-0">
                    <div className="text-xs">
                      <div className="text-slate-500 font-medium mb-1 flex items-center justify-between">
                        <span>Registrar Avance:</span>
                        <strong className="font-mono text-slate-900">{act.progress}%</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={act.progress}
                          onChange={e => handleUpdateProgress(act, parseInt(e.target.value) || 0)}
                          className="w-36 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateProgress(act, 100)}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 rounded transition-colors"
                        >
                          100%
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditDrawer(act)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-slate-200 transition-colors"
                      title="Editar todos los campos"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Responsible Fulfillment Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Cumplimiento por Responsable
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación del avance de entrega y control de tareas retrasadas asignadas.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Responsable</th>
                <th className="py-2.5 px-4 text-center">Tareas Asignadas</th>
                <th className="py-2.5 px-4 text-center">Completadas</th>
                <th className="py-2.5 px-4 text-center">En Ejecución</th>
                <th className="py-2.5 px-4 text-center">Retrasadas</th>
                <th className="py-2.5 px-4 w-40">Avance Promedio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {responsibleStats.map(stat => (
                <tr key={stat.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {stat.name}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                    {stat.totalActivities}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-600 font-bold">
                    {stat.completed}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-blue-600 font-bold">
                    {stat.inProgress}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-rose-600 font-bold">
                    {stat.delayed}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${stat.averageProgress}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-700 font-bold w-9 text-right">
                        {stat.averageProgress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
