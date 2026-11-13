import React from 'react';
import {
  ListTodo,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
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
  LineChart,
  Line,
  Legend
} from 'recharts';
import { useProject } from '../context/ProjectContext';
import { PROJECT_META } from '../data/initialData';
import { formatDate, getPriorityColor, getStatusColor } from '../utils/dateUtils';

interface OverviewViewProps {
  onOpenQuickSchedule: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onOpenQuickSchedule }) => {
  const { kpis, activities, responsibleStats, openEditDrawer, setActiveTab } = useProject();

  // Status donut data
  const statusChartData = [
    { name: 'Pendientes', value: kpis.pendingCount, color: '#94a3b8' },
    { name: 'En ejecución', value: kpis.inProgressCount, color: '#3b82f6' },
    { name: 'Completadas', value: kpis.completedCount, color: '#10b981' },
    { name: 'Retrasadas', value: kpis.delayedCount, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Fallback if all 0
  const finalStatusData = statusChartData.length > 0 ? statusChartData : [{ name: 'Pendientes', value: activities.length, color: '#94a3b8' }];

  // Priority bar chart data
  const priorityCounts = { Alta: 0, Media: 0, Baja: 0 };
  activities.forEach(a => {
    if (a.priority === 'Alta') priorityCounts.Alta++;
    else if (a.priority === 'Media') priorityCounts.Media++;
    else if (a.priority === 'Baja') priorityCounts.Baja++;
  });

  const priorityChartData = [
    { priority: 'Alta', cantidad: priorityCounts.Alta, fill: '#f87171' },
    { priority: 'Media', cantidad: priorityCounts.Media, fill: '#fbbf24' },
    { priority: 'Baja', cantidad: priorityCounts.Baja, fill: '#34d399' }
  ];

  // Responsible workload data
  const respWorkloadData = responsibleStats.map(r => ({
    name: r.name.length > 14 ? r.name.substring(0, 12) + '...' : r.name,
    fullName: r.name,
    actividades: r.totalActivities,
    semanas: r.totalWeeks,
    avance: r.averageProgress
  }));

  // Progress trend data aligned to UTS PETI 2026 methodological route
  const progressCurveData = [
    { etapa: 'Inicio', planificado: 0, real: 0 },
    { etapa: 'PETI & Reto', planificado: 20, real: activities.find(a => a.id === 1)?.progress || 0 },
    { etapa: 'Diagnóstico & Req.', planificado: 45, real: Math.round(((activities.find(a => a.id === 2)?.progress || 0) + (activities.find(a => a.id === 3)?.progress || 0)) / 2) },
    { etapa: 'Criterios & Eval.', planificado: 70, real: Math.round(((activities.find(a => a.id === 4)?.progress || 0) + (activities.find(a => a.id === 5)?.progress || 0)) / 2) },
    { etapa: 'Controles & Sensib.', planificado: 90, real: Math.round(((activities.find(a => a.id === 6)?.progress || 0) + (activities.find(a => a.id === 7)?.progress || 0)) / 2) },
    { etapa: 'Defensa Pitch', planificado: 100, real: kpis.overallProgress }
  ];

  return (
    <div className="space-y-6">
      {/* Executive Project Context Banner: UTS PETI 2026 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                <span>{PROJECT_META.institution}</span>
                <span aria-hidden="true">·</span>
                <span>{PROJECT_META.course}</span>
                <span aria-hidden="true">·</span>
                <span>Grupo {PROJECT_META.group} ({PROJECT_META.semester})</span>
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Reto Seleccionado: {PROJECT_META.challengeTitle}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                <span className="font-semibold text-slate-800">Pregunta orientadora:</span> {PROJECT_META.guidingQuestion}
              </p>
              <div className="pt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <span><strong className="text-slate-700">Evidencia:</strong> {PROJECT_META.petiEvidence}</span>
                <span aria-hidden="true">·</span>
                <span><strong className="text-slate-700">Integrantes:</strong> {PROJECT_META.authors}</span>
                <span aria-hidden="true">·</span>
                <span><strong className="text-slate-700">Docente:</strong> {PROJECT_META.instructor}</span>
              </div>
            </div>
          </div>

          <div className="lg:w-72 shrink-0 bg-slate-50 rounded-lg border border-slate-200/80 p-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Priorización PETI (Parte D)
            </div>
            {PROJECT_META.prioritizedNeeds.map((need, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className={`truncate mr-2 ${need.selected ? 'font-bold text-blue-700' : 'text-slate-600'}`}>
                  {idx + 1}. {need.name}
                </span>
                <span className={`font-mono font-bold tabular-nums shrink-0 ${need.selected ? 'text-blue-700' : 'text-slate-500'}`}>
                  {need.score}/15
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Advisory Banner (only when dates/dependencies remain undefined) */}
      {kpis.unconfiguredCount > 0 && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900">
                Actividades pendientes de configuración ({kpis.unconfiguredCount} con fechas o dependencias por definir)
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Puedes ajustar fechas y dependencias manualmente en cada fila o recalcular la ruta metodológica completa desde el asistente.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenQuickSchedule}
            className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg shadow-2xs shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Asistente de Cronograma
          </button>
        </div>
      )}

      {/* Dynamic KPI Strip (7 key indicators) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {/* Total Actividades */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Actividades</span>
            <ListTodo className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {kpis.totalActivities}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Base del proyecto</div>
        </div>

        {/* Pendientes */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Pendientes</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-700 font-mono tabular-nums">
            {kpis.pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Por iniciar</div>
        </div>

        {/* En Ejecución */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">En Ejecución</span>
            <PlayCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">
            {kpis.inProgressCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Actualmente en curso</div>
        </div>

        {/* Completadas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Completadas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {kpis.completedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Finalizadas exitosamente</div>
        </div>

        {/* Retrasadas */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Retrasadas</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
            {kpis.delayedCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requieren atención</div>
        </div>

        {/* Avance General */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Avance Global</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {kpis.overallProgress}%
          </div>
          <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${kpis.overallProgress}%` }}
            />
          </div>
        </div>

        {/* Duración Total Estimada */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Duración Total</span>
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {kpis.estimatedTotalWeeks} <span className="text-xs font-normal text-slate-500">sem.</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Ruta del proyecto</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Gráfico Circular: Estado de actividades */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Distribución por Estado
            </h3>
            <span className="text-[11px] text-slate-500">{activities.length} tareas</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={finalStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {finalStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} actividades`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600">Pendiente: <strong>{kpis.pendingCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-slate-600">En ejecución: <strong>{kpis.inProgressCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600">Completada: <strong>{kpis.completedCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">Retrasada: <strong>{kpis.delayedCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras: Actividades por Prioridad */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Actividades por Prioridad
            </h3>
            <span className="text-[11px] text-slate-500">Alta / Media / Baja</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="priority" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [`${val} actividades`, 'Cantidad']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Alta: {priorityCounts.Alta} act.</span>
            <span>Media: {priorityCounts.Media} act.</span>
            <span>Baja: {priorityCounts.Baja} act.</span>
          </div>
        </div>

        {/* Curva de Avance: Planificado vs Real */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Curva de Avance: Planificado vs Real
            </h3>
            <span className="text-[11px] text-slate-500">Proyección (%)</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="etapa" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val}%`, name === 'planificado' ? 'Planificado' : 'Real']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="planificado"
                  name="Planificado"
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="real"
                  name="Avance Real"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
            <span>Avance real actual: <strong>{kpis.overallProgress}%</strong></span>
            <button
              onClick={() => setActiveTab('seguimiento')}
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
            >
              Ver seguimiento <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Project Activities Quick Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Fases del Proyecto Integrador · Seguridad de la Información UTS
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haz clic en cualquier fila para abrir la edición detallada (fechas, duración, dependencias y avance).
            </p>
          </div>
          <button
            onClick={() => setActiveTab('cronograma')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Ver en Cronograma Gantt <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4 w-12 text-center">ID</th>
                <th className="py-2.5 px-4">Actividad</th>
                <th className="py-2.5 px-4">Responsable</th>
                <th className="py-2.5 px-4 text-center">Prioridad</th>
                <th className="py-2.5 px-4 text-center">Duración</th>
                <th className="py-2.5 px-4">Fechas (Inicio - Fin)</th>
                <th className="py-2.5 px-4 text-center">Estado</th>
                <th className="py-2.5 px-4 w-32">Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map(act => {
                const priorityColor = getPriorityColor(act.priority);
                const statusColor = getStatusColor(act.status);

                return (
                  <tr
                    key={act.id}
                    onClick={() => openEditDrawer(act)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      #{act.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {act.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {act.responsible}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${priorityColor.bg} ${priorityColor.text} border ${priorityColor.border}`}>
                        {act.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-700">
                      {act.durationWeeks} sem.
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {act.startDate && act.endDate ? (
                        <span>{formatDate(act.startDate)} → {formatDate(act.endDate)}</span>
                      ) : (
                        <span className="text-amber-700 font-medium italic">Por definir</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
                        {act.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${act.progress}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 tabular-nums w-8 text-right">
                          {act.progress}%
                        </span>
                      </div>
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
