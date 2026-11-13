import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { exportActivitiesToExcel, exportProjectReportToPDF } from '../utils/exportUtils';
import { formatDate, getPriorityColor, getStatusColor } from '../utils/dateUtils';

export const ReportsView: React.FC = () => {
  const { activities, responsibleStats, kpis, topology } = useProject();

  // Pie chart: status
  const statusData = [
    { name: 'Pendientes', value: kpis.pendingCount, color: '#94a3b8' },
    { name: 'En ejecución', value: kpis.inProgressCount, color: '#3b82f6' },
    { name: 'Completadas', value: kpis.completedCount, color: '#10b981' },
    { name: 'Retrasadas', value: kpis.delayedCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  const finalStatusData = statusData.length > 0 ? statusData : [{ name: 'Pendientes', value: activities.length, color: '#94a3b8' }];

  // Priority data
  const priorityData = [
    {
      name: 'Alta',
      cantidad: activities.filter(a => a.priority === 'Alta').length,
      fill: '#f87171'
    },
    {
      name: 'Media',
      cantidad: activities.filter(a => a.priority === 'Media').length,
      fill: '#fbbf24'
    },
    {
      name: 'Baja',
      cantidad: activities.filter(a => a.priority === 'Baja').length,
      fill: '#34d399'
    }
  ];

  // Responsible data
  const respChartData = responsibleStats.map(r => ({
    name: r.name,
    Actividades: r.totalActivities,
    Semanas: r.totalWeeks,
    Avance: r.averageProgress
  }));

  // S-Curve project progress data aligned to Semestre 2026-2
  const sCurveData = [
    { semana: 'Sem 0', planificado: 0, real: 0 },
    { semana: 'Sem 2', planificado: 15, real: activities.find(a => a.id === 1)?.progress || 0 },
    { semana: 'Sem 5', planificado: 35, real: Math.round(((activities.find(a => a.id === 1)?.progress || 0) + (activities.find(a => a.id === 2)?.progress || 0)) / 2) },
    { semana: 'Sem 8', planificado: 55, real: Math.round(((activities.find(a => a.id === 2)?.progress || 0) + (activities.find(a => a.id === 3)?.progress || 0)) / 2) },
    { semana: 'Sem 11', planificado: 75, real: Math.round(((activities.find(a => a.id === 4)?.progress || 0) + (activities.find(a => a.id === 5)?.progress || 0)) / 2) },
    { semana: 'Sem 15', planificado: 90, real: Math.round(((activities.find(a => a.id === 6)?.progress || 0) + (activities.find(a => a.id === 7)?.progress || 0)) / 2) },
    { semana: 'Sem 19', planificado: 100, real: kpis.overallProgress }
  ];

  return (
    <div className="space-y-6">
      {/* Export & Actions Hero Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Centro de Reportes y Documentación Ejecutiva
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Genera informes consolidados en PDF con tablas de auditoría y exporta hojas de cálculo en formato Excel (.xlsx).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => exportActivitiesToExcel(activities)}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Descargar Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => exportProjectReportToPDF(activities)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>Generar Reporte PDF</span>
          </button>
        </div>
      </div>

      {/* Grid of Dynamic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Estado de Actividades */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-slate-500" />
              Actividades por Estado
            </h3>
            <span className="text-xs text-slate-500 font-mono">{activities.length} total</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {finalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} actividades`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Actividades por Prioridad */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Actividades por Nivel de Prioridad
            </h3>
            <span className="text-xs text-slate-500">Alta / Media / Baja</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} actividades`, 'Total']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 3: Actividades por Responsable */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Distribución de Tareas por Responsable
            </h3>
            <span className="text-xs text-slate-500 font-mono">{responsibleStats.length} perfiles</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={respChartData} margin={{ top: 10, right: 15, left: -15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} interval={0} angle={-20} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="Actividades" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Semanas" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 4: Curva de Avance S del Proyecto */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Curva S de Avance Acumulado del Proyecto
            </h3>
            <span className="text-xs text-blue-600 font-bold font-mono">{kpis.overallProgress}% actual</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sCurveData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Avance']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="planificado"
                  name="Planificado (%)"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  fill="none"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="real"
                  name="Real Acumulado (%)"
                  stroke="#2563eb"
                  fillOpacity={1}
                  fill="url(#colorReal)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Full Audit Table for Printing and Export Review */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cuadro Maestro · Fortalecimiento Seguridad de la Información UTS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidado de fases del proyecto integrador TSI604 (Grupo B193 · PETI 2026 Pág. 85-86).
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
            Total {activities.length} Actividades · {kpis.estimatedTotalWeeks} semanas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center">ID</th>
                <th className="py-2.5 px-4">Prioridad</th>
                <th className="py-2.5 px-4">Actividad</th>
                <th className="py-2.5 px-4">Responsable</th>
                <th className="py-2.5 px-4">Depende de</th>
                <th className="py-2.5 px-4 text-center">Duración</th>
                <th className="py-2.5 px-4">Inicio - Fin</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 px-4 text-right">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map(act => {
                const priorityColor = getPriorityColor(act.priority);
                const statusColor = getStatusColor(act.status);

                return (
                  <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                      #{act.id}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${priorityColor.bg} ${priorityColor.text} ${priorityColor.border}`}>
                        {act.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {act.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {act.responsible}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {act.dependencies && act.dependencies.length > 0 ? (
                        act.dependencies.map(id => `#${id}`).join(', ')
                      ) : (
                        <span className="text-slate-400 italic">Por definir</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {act.durationWeeks} sem.
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {act.startDate && act.endDate ? (
                        `${formatDate(act.startDate)} → ${formatDate(act.endDate)}`
                      ) : (
                        <span className="text-amber-700 italic">Por definir</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {act.progress}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
