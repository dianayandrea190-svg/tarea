import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { formatDate, getPriorityColor, getStatusColor } from '../utils/dateUtils';

export const ResponsiblesView: React.FC = () => {
  const { responsibleStats, activities, openEditDrawer } = useProject();
  const [selectedResp, setSelectedResp] = useState<string | null>(null);

  // Chart data: tasks and weeks by responsible
  const chartData = responsibleStats.map(r => ({
    name: r.name,
    Actividades: r.totalActivities,
    Semanas: r.totalWeeks,
    Avance: r.averageProgress
  }));

  // Selected responsible's tasks
  const activeRespName = selectedResp || (responsibleStats[0]?.name ?? 'Equipo Proyecto B193');
  const activeRespTasks = activities.filter(a => a.responsible === activeRespName);
  const activeRespStat = responsibleStats.find(r => r.name === activeRespName);

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Distribución de Tareas por Responsable
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y seguimiento de carga de trabajo, cumplimiento y semanas asignadas a cada miembro del equipo.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
          <div>
            <span>Responsables activos: </span>
            <strong className="text-slate-900">{responsibleStats.length}</strong>
          </div>
          <span>·</span>
          <div>
            <span>Carga promedio: </span>
            <strong className="text-slate-900">
              {Math.round(activities.reduce((s, a) => s + a.durationWeeks, 0) / (responsibleStats.length || 1))} sem/persona
            </strong>
          </div>
        </div>
      </div>

      {/* Responsibles Workload Chart */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Comparativa de Carga y Semanas Asignadas
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#475569' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Actividades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Semanas" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Responsible Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {responsibleStats.map(stat => {
          const isSelected = stat.name === activeRespName;
          const assignedActs = activities.filter(a => a.responsible === stat.name);

          return (
            <div
              key={stat.name}
              onClick={() => setSelectedResp(stat.name)}
              className={`bg-white rounded-xl border transition-all cursor-pointer p-5 flex flex-col justify-between shadow-2xs ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{stat.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {stat.totalActivities} {stat.totalActivities === 1 ? 'actividad' : 'actividades'} · {stat.totalWeeks} semanas
                      </p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                    {stat.averageProgress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${stat.averageProgress}%` }}
                  />
                </div>

                {/* Status Pills */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono mb-4">
                  <div className="bg-slate-50 p-1.5 rounded border border-slate-100">
                    <div className="text-slate-500">Pend.</div>
                    <div className="font-bold text-slate-700">{stat.pending}</div>
                  </div>
                  <div className="bg-blue-50 p-1.5 rounded border border-blue-100">
                    <div className="text-blue-600">En cur.</div>
                    <div className="font-bold text-blue-700">{stat.inProgress}</div>
                  </div>
                  <div className="bg-emerald-50 p-1.5 rounded border border-emerald-100">
                    <div className="text-emerald-600">Comp.</div>
                    <div className="font-bold text-emerald-700">{stat.completed}</div>
                  </div>
                  <div className="bg-rose-50 p-1.5 rounded border border-rose-100">
                    <div className="text-rose-600">Retr.</div>
                    <div className="font-bold text-rose-700">{stat.delayed}</div>
                  </div>
                </div>

                {/* Quick List of activities for this responsible */}
                <div className="space-y-1.5 text-xs">
                  {assignedActs.map(act => (
                    <div
                      key={act.id}
                      onClick={e => {
                        e.stopPropagation();
                        openEditDrawer(act);
                      }}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-100 flex items-center justify-between transition-colors group"
                    >
                      <div className="truncate mr-2">
                        <span className="font-mono font-bold text-slate-500 mr-1.5">#{act.id}</span>
                        <span className="font-medium text-slate-800 group-hover:text-blue-600 truncate">
                          {act.name}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 shrink-0">
                        {act.progress}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-blue-600 font-semibold flex items-center justify-between">
                <span>{isSelected ? 'Seleccionado actualmente' : 'Ver detalle'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
