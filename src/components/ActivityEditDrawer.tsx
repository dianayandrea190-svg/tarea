import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  Check,
  Calendar,
  Clock,
  User,
  GitBranch,
  FileText,
  Trash2,
  ArrowRight,
  Info
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Priority, ActivityStatus, Activity } from '../types/project';
import {
  formatDate,
  addWeeksToDate,
  calculateWeeksBetween,
  isValidDateRange,
  wouldCreateCircularDependency,
  getPriorityColor,
  getStatusColor
} from '../utils/dateUtils';

export const ActivityEditDrawer: React.FC = () => {
  const {
    selectedActivity,
    isDrawerOpen,
    closeEditDrawer,
    updateActivity,
    deleteActivity,
    activities,
    responsibles
  } = useProject();

  const [formData, setFormData] = useState<Activity | null>(null);
  const [cascadeDates, setCascadeDates] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newCustomResp, setNewCustomResp] = useState(false);

  // Sync form state when selectedActivity changes
  useEffect(() => {
    if (selectedActivity) {
      setFormData({
        ...selectedActivity,
        dependencies: [...(selectedActivity.dependencies || [])]
      });
      setValidationError(null);
      setShowDeleteConfirm(false);
      setNewCustomResp(false);
    } else {
      setFormData(null);
    }
  }, [selectedActivity]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeEditDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeEditDrawer]);

  // Evaluate candidate dependencies for circular dependency prevention
  const dependencyCandidates = useMemo(() => {
    if (!formData) return [];
    return activities
      .filter(a => a.id !== formData.id)
      .map(candidate => {
        const isCurrent = formData.dependencies?.includes(candidate.id);
        const cycleCheck = wouldCreateCircularDependency(
          activities,
          formData.id,
          candidate.id,
          formData.dependencies
        );
        return {
          activity: candidate,
          isCurrent,
          wouldCauseCycle: cycleCheck.hasCycle,
          cyclePath: cycleCheck.cyclePath
        };
      });
  }, [activities, formData]);

  if (!isDrawerOpen || !formData) {
    return null;
  }

  // Handle change in start date
  const handleStartDateChange = (newStart: string) => {
    setFormData(prev => {
      if (!prev) return null;
      let newEnd = prev.endDate;
      if (newStart && prev.durationWeeks > 0) {
        newEnd = addWeeksToDate(newStart, prev.durationWeeks);
      }
      return {
        ...prev,
        startDate: newStart,
        endDate: newEnd
      };
    });
  };

  // Handle change in duration
  const handleDurationChange = (weeks: number) => {
    const safeWeeks = Math.max(1, weeks);
    setFormData(prev => {
      if (!prev) return null;
      let newEnd = prev.endDate;
      if (prev.startDate) {
        newEnd = addWeeksToDate(prev.startDate, safeWeeks);
      }
      return {
        ...prev,
        durationWeeks: safeWeeks,
        endDate: newEnd
      };
    });
  };

  // Handle change in end date
  const handleEndDateChange = (newEnd: string) => {
    setFormData(prev => {
      if (!prev) return null;
      let newDuration = prev.durationWeeks;
      if (prev.startDate && newEnd && newEnd >= prev.startDate) {
        newDuration = calculateWeeksBetween(prev.startDate, newEnd);
      }
      return {
        ...prev,
        endDate: newEnd,
        durationWeeks: newDuration
      };
    });
  };

  // Handle toggle dependency
  const handleToggleDependency = (depId: number) => {
    if (!formData) return;
    const current = formData.dependencies || [];
    const exists = current.includes(depId);

    if (exists) {
      // Remove dependency
      setFormData(prev => prev ? { ...prev, dependencies: current.filter(id => id !== depId) } : null);
    } else {
      // Check circular dependency
      const cycleCheck = wouldCreateCircularDependency(activities, formData.id, depId, current);
      if (cycleCheck.hasCycle) {
        setValidationError(
          `¡Dependencia circular evitada! La actividad #${depId} ya depende directa o indirectamente de la actividad #${formData.id}.`
        );
        return;
      }
      setValidationError(null);
      setFormData(prev => prev ? { ...prev, dependencies: [...current, depId] } : null);
    }
  };

  // Handle progress change
  const handleProgressChange = (newProg: number) => {
    const safeProg = Math.max(0, Math.min(100, newProg));
    setFormData(prev => {
      if (!prev) return null;
      let status = prev.status;
      if (safeProg === 100) {
        status = 'Completada';
      } else if (safeProg > 0 && status === 'Pendiente') {
        status = 'En ejecución';
      }
      return {
        ...prev,
        progress: safeProg,
        status
      };
    });
  };

  // Validate form before save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (!formData.name.trim()) {
      setValidationError('El nombre de la actividad no puede estar vacío.');
      return;
    }

    if (formData.durationWeeks <= 0) {
      setValidationError('La duración debe ser de al menos 1 semana.');
      return;
    }

    if (formData.startDate && formData.endDate && !isValidDateRange(formData.startDate, formData.endDate)) {
      setValidationError('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    // Check circular dependencies for all dependencies
    for (const depId of formData.dependencies || []) {
      const cycleCheck = wouldCreateCircularDependency(activities, formData.id, depId);
      if (cycleCheck.hasCycle) {
        setValidationError(`Dependencia circular detectada con la actividad #${depId}.`);
        return;
      }
    }

    const result = updateActivity(formData, cascadeDates);
    if (result.success) {
      closeEditDrawer();
    } else {
      setValidationError(result.error || 'Ocurrió un error al guardar.');
    }
  };

  const priorityStyle = getPriorityColor(formData.priority);
  const statusStyle = getStatusColor(formData.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      {/* Backdrop click */}
      <div className="flex-1" onClick={closeEditDrawer} />

      {/* Side Panel */}
      <div className="w-full max-w-xl bg-white shadow-2xl border-l border-slate-200 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Panel Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-900 text-white rounded">
              ID #{formData.id}
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900 truncate max-w-xs">
                {formData.name || 'Editar Actividad'}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>{formData.responsible}</span>
                <span>·</span>
                <span>{formData.durationWeeks} semanas</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={closeEditDrawer}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert */}
        {validationError && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{validationError}</div>
            <button
              onClick={() => setValidationError(null)}
              className="text-rose-500 hover:text-rose-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Nombre de la actividad */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nombre de la Actividad <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              placeholder="Ej. Diagnóstico de vulnerabilidades (PETI UTS 2026)"
              required
            />
          </div>

          {/* Grid: Prioridad & Estado */}
          <div className="grid grid-cols-2 gap-4">
            {/* Prioridad */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Prioridad
              </label>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Alta">Alta (Rojo suave)</option>
                <option value="Media">Media (Amarillo)</option>
                <option value="Baja">Baja (Verde)</option>
              </select>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${priorityStyle.dot}`} />
                <span className="text-slate-600 font-medium">Prioridad {formData.priority}</span>
              </div>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as ActivityStatus })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pendiente">Pendiente (Gris)</option>
                <option value="En ejecución">En ejecución (Azul)</option>
                <option value="Completada">Completada (Verde)</option>
                <option value="Retrasada">Retrasada (Rojo)</option>
              </select>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${statusStyle.dot}`} />
                <span className="text-slate-600 font-medium">{formData.status}</span>
              </div>
            </div>
          </div>

          {/* Responsable */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Responsable Asignado
              </label>
              <button
                type="button"
                onClick={() => setNewCustomResp(!newCustomResp)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {newCustomResp ? 'Seleccionar existente' : '+ Otro responsable'}
              </button>
            </div>

            {newCustomResp ? (
              <input
                type="text"
                value={formData.responsible}
                onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                placeholder="Escribe el nombre del responsable..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={formData.responsible}
                onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {responsibles.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Duración y Fechas */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                Planificación Temporal
              </span>
              <span className="text-xs font-medium text-slate-600">
                {formData.startDate && formData.endDate
                  ? `${formatDate(formData.startDate)} → ${formatDate(formData.endDate)}`
                  : 'Fechas por definir'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Duración */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Duración (sem.)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={formData.durationWeeks}
                    onChange={e => handleDurationChange(parseInt(e.target.value) || 1)}
                    className="w-full pl-3 pr-2 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* Fecha Inicio */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.startDate || ''}
                  onChange={e => handleStartDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fecha Fin */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={e => handleEndDateChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
              <span>Accesos rápidos:</span>
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  handleStartDateChange(today);
                }}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-700"
              >
                Iniciar Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => prev ? { ...prev, startDate: '', endDate: '' } : null);
                }}
                className="px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 text-slate-500"
              >
                Limpiar fechas
              </button>
            </div>
          </div>

          {/* Porcentaje de avance */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Porcentaje de Avance
              </label>
              <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {formData.progress}%
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={formData.progress}
                onChange={e => handleProgressChange(parseInt(e.target.value) || 0)}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Quick progress buttons */}
              <div className="flex items-center justify-between gap-1">
                {[0, 25, 50, 75, 100].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleProgressChange(val)}
                    className={`flex-1 py-1 text-xs font-mono rounded transition-colors ${
                      formData.progress === val
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {val}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dependencias y Prevención de Ciclos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                Dependencias (Predecesoras)
              </label>
              <span className="text-xs text-slate-500">
                {formData.dependencies?.length ? `${formData.dependencies.length} seleccionada(s)` : 'Por definir (Ninguna)'}
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-2.5">
              Selecciona de qué actividades depende esta tarea. El sistema bloquea automáticamente dependencias circulares.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
              {dependencyCandidates.length === 0 ? (
                <div className="text-xs text-slate-400 py-2 text-center">No hay otras actividades en el proyecto</div>
              ) : (
                dependencyCandidates.map(({ activity: candidate, isCurrent, wouldCauseCycle }) => (
                  <div
                    key={candidate.id}
                    onClick={() => {
                      if (!wouldCauseCycle) {
                        handleToggleDependency(candidate.id);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-xs transition-all flex items-center justify-between cursor-pointer ${
                      wouldCauseCycle
                        ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                        : isCurrent
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border text-xs ${
                          isCurrent
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isCurrent && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="truncate">
                        <span className="font-mono font-bold mr-1.5">#{candidate.id}</span>
                        <span className="font-medium">{candidate.name}</span>
                        <span className="text-slate-500 ml-1.5">({candidate.durationWeeks} sem · {candidate.responsible})</span>
                      </div>
                    </div>

                    {wouldCauseCycle && (
                      <span className="text-[10px] text-rose-600 font-semibold uppercase tracking-wider shrink-0 ml-2">
                        Ciclo circular
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Cascade option */}
            <div className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                id="cascadeDatesCheckbox"
                checked={cascadeDates}
                onChange={e => setCascadeDates(e.target.checked)}
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <label htmlFor="cascadeDatesCheckbox" className="text-xs text-slate-600 cursor-pointer">
                <strong>Cascada automática:</strong> Si cambia la fecha de finalización, reprogramar el inicio de las actividades que dependen de esta.
              </label>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Observaciones y Notas
            </label>
            <textarea
              rows={3}
              value={formData.observations || ''}
              onChange={e => setFormData({ ...formData, observations: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Notas técnicas, riesgos, acuerdos o condiciones de entrega..."
            />
          </div>

          {/* Delete Area */}
          <div className="pt-2 border-t border-slate-100">
            {showDeleteConfirm ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
                <p className="text-xs text-rose-800 font-medium">
                  ¿Estás seguro de eliminar la actividad #{formData.id}? Esta acción no se puede deshacer.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => deleteActivity(formData.id)}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md"
                  >
                    Sí, eliminar actividad
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 text-slate-700 rounded-md hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1.5 font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar esta actividad
              </button>
            )}
          </div>
        </form>

        {/* Panel Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={closeEditDrawer}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
