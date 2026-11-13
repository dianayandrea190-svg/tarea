import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  Edit3,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Activity, Priority, ActivityStatus } from '../types/project';
import {
  formatDate,
  getPriorityColor,
  getStatusColor,
  addWeeksToDate
} from '../utils/dateUtils';
import { exportActivitiesToExcel } from '../utils/exportUtils';

interface ActivityTableViewProps {
  onOpenNewActivity: () => void;
  onOpenQuickSchedule: () => void;
}

type SortField = 'id' | 'name' | 'priority' | 'responsible' | 'durationWeeks' | 'startDate' | 'status' | 'progress';

export const ActivityTableView: React.FC<ActivityTableViewProps> = ({
  onOpenNewActivity,
  onOpenQuickSchedule
}) => {
  const {
    activities,
    openEditDrawer,
    updateActivity,
    deleteActivity,
    responsibles
  } = useProject();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterResp, setFilterResp] = useState('Todos');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortAsc, setSortAsc] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Sorting and Filtering
  const filteredActivities = useMemo(() => {
    return activities
      .filter(act => {
        if (filterPriority !== 'Todas' && act.priority !== filterPriority) return false;
        if (filterStatus !== 'Todos' && act.status !== filterStatus) return false;
        if (filterResp !== 'Todos' && act.responsible !== filterResp) return false;
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchName = act.name.toLowerCase().includes(term);
          const matchResp = act.responsible.toLowerCase().includes(term);
          const matchObs = (act.observations || '').toLowerCase().includes(term);
          if (!matchName && !matchResp && !matchObs) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'priority') {
          const map: Record<string, number> = { Alta: 3, Media: 2, Baja: 1 };
          valA = map[a.priority] || 0;
          valB = map[b.priority] || 0;
        } else if (sortField === 'startDate') {
          valA = a.startDate || '9999';
          valB = b.startDate || '9999';
        }

        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [activities, filterPriority, filterStatus, filterResp, searchTerm, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Quick inline updates
  const handleQuickStatusChange = (act: Activity, newStatus: ActivityStatus) => {
    let newProg = act.progress;
    if (newStatus === 'Completada' && newProg < 100) newProg = 100;
    if (newStatus === 'Pendiente' && newProg > 0) newProg = 0;
    if (newStatus === 'En ejecución' && (newProg === 0 || newProg === 100)) newProg = 25;
    updateActivity({ ...act, status: newStatus, progress: newProg });
  };

  const handleQuickPriorityChange = (act: Activity, newPriority: Priority) => {
    updateActivity({ ...act, priority: newPriority });
  };

  const handleQuickResponsibleChange = (act: Activity, newResp: string) => {
    updateActivity({ ...act, responsible: newResp });
  };

  const handleQuickProgressChange = (act: Activity, newProg: number) => {
    const p = Math.max(0, Math.min(100, newProg));
    let status = act.status;
    if (p === 100) status = 'Completada';
    else if (p > 0 && status === 'Pendiente') status = 'En ejecución';
    updateActivity({ ...act, progress: p, status });
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Inputs */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, responsable..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Prioridad:</span>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todas">Todas</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Estado:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En ejecución">En ejecución</option>
              <option value="Completada">Completada</option>
              <option value="Retrasada">Retrasada</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Responsable:</span>
            <select
              value={filterResp}
              onChange={e => setFilterResp(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-44 truncate"
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

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenQuickSchedule}
            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Asistente de Fechas</span>
          </button>

          <button
            type="button"
            onClick={() => exportActivitiesToExcel(activities)}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewActivity}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">¿Eliminar actividad #{confirmDeleteId}?</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Esta acción eliminará la actividad y removerá sus referencias como dependencia en otras tareas.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteActivity(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-xs"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities Editable Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold select-none">
                <th
                  onClick={() => handleSort('id')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 w-12"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('priority')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 w-24"
                >
                  <div className="flex items-center gap-1">
                    <span>Prioridad</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Actividad</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('responsible')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 w-44"
                >
                  <div className="flex items-center gap-1">
                    <span>Responsable</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="py-3 px-3 w-28">Depende de</th>

                <th
                  onClick={() => handleSort('durationWeeks')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 w-20"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Duración</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('startDate')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 w-36"
                >
                  <div className="flex items-center gap-1">
                    <span>Fechas (Inicio - Fin)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 w-32"
                >
                  <div className="flex items-center gap-1">
                    <span>Estado</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th
                  onClick={() => handleSort('progress')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 w-32"
                >
                  <div className="flex items-center gap-1">
                    <span>Avance</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                <th className="py-3 px-3 text-center w-24">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No se encontraron actividades con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => {
                  const priorityColor = getPriorityColor(act.priority);
                  const statusColor = getStatusColor(act.status);

                  return (
                    <tr
                      key={act.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                        #{act.id}
                      </td>

                      {/* Prioridad con selector inline */}
                      <td className="py-2.5 px-3">
                        <select
                          value={act.priority}
                          onChange={e => handleQuickPriorityChange(act, e.target.value as Priority)}
                          className={`w-full text-[11px] font-bold px-2 py-1 rounded border ${priorityColor.bg} ${priorityColor.text} ${priorityColor.border} focus:outline-none`}
                        >
                          <option value="Alta">Alta</option>
                          <option value="Media">Media</option>
                          <option value="Baja">Baja</option>
                        </select>
                      </td>

                      {/* Nombre de la actividad */}
                      <td className="py-2.5 px-4">
                        <div
                          onClick={() => openEditDrawer(act)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                          title="Clic para editar detalles completos"
                        >
                          {act.name}
                        </div>
                        {act.observations && (
                          <div className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">
                            {act.observations}
                          </div>
                        )}
                      </td>

                      {/* Responsable con selector inline */}
                      <td className="py-2.5 px-3">
                        <select
                          value={act.responsible}
                          onChange={e => handleQuickResponsibleChange(act, e.target.value)}
                          className="w-full text-xs bg-transparent hover:bg-white border border-transparent hover:border-slate-300 rounded px-1.5 py-1 text-slate-800 font-medium truncate focus:bg-white focus:border-blue-400"
                        >
                          {responsibles.map(r => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Dependencia */}
                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {act.dependencies && act.dependencies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {act.dependencies.map(depId => (
                              <span
                                key={depId}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200"
                              >
                                #{depId}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Por definir</span>
                        )}
                      </td>

                      {/* Duración */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                        {act.durationWeeks} sem.
                      </td>

                      {/* Fechas */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {act.startDate && act.endDate ? (
                          <div>
                            <div>{formatDate(act.startDate)}</div>
                            <div className="text-slate-400">→ {formatDate(act.endDate)}</div>
                          </div>
                        ) : (
                          <button
                            onClick={() => openEditDrawer(act)}
                            className="text-amber-700 font-medium italic hover:underline"
                          >
                            Por definir
                          </button>
                        )}
                      </td>

                      {/* Estado con selector inline */}
                      <td className="py-2.5 px-3">
                        <select
                          value={act.status}
                          onChange={e => handleQuickStatusChange(act, e.target.value as ActivityStatus)}
                          className={`w-full text-[11px] font-bold px-2 py-1 rounded border ${statusColor.bg} ${statusColor.text} ${statusColor.border} focus:outline-none`}
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En ejecución">En ejecución</option>
                          <option value="Completada">Completada</option>
                          <option value="Retrasada">Retrasada</option>
                        </select>
                      </td>

                      {/* Avance con input rápido */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={act.progress}
                            onChange={e => handleQuickProgressChange(act, parseInt(e.target.value) || 0)}
                            className="w-14 px-1.5 py-0.5 font-mono text-xs tabular-nums text-right border border-slate-200 rounded focus:border-blue-500 focus:outline-none"
                          />
                          <span className="text-slate-400 text-xs">%</span>
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openEditDrawer(act)}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar actividad completa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(act.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
