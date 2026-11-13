import React, { useState } from 'react';
import { X, Plus, AlertTriangle, Calendar, Clock, User } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Priority, ActivityStatus } from '../types/project';
import { addWeeksToDate, isValidDateRange } from '../utils/dateUtils';

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewActivityModal: React.FC<NewActivityModalProps> = ({ isOpen, onClose }) => {
  const { createActivity, responsibles } = useProject();

  const [name, setName] = useState('');
  const [priority, setPriority] = useState<Priority>('Media');
  const [responsible, setResponsible] = useState('Especialista en Seguridad TI');
  const [customResponsible, setCustomResponsible] = useState('');
  const [isCustomResp, setIsCustomResp] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(3);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ActivityStatus>('Pendiente');
  const [progress, setProgress] = useState(0);
  const [observations, setObservations] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    if (val && durationWeeks > 0) {
      setEndDate(addWeeksToDate(val, durationWeeks));
    }
  };

  const handleDurationChange = (weeks: number) => {
    const w = Math.max(1, weeks);
    setDurationWeeks(w);
    if (startDate) {
      setEndDate(addWeeksToDate(startDate, w));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la actividad es requerido.');
      return;
    }

    if (startDate && endDate && !isValidDateRange(startDate, endDate)) {
      setError('La fecha de fin debe ser posterior a la de inicio.');
      return;
    }

    const finalResp = isCustomResp && customResponsible.trim() ? customResponsible.trim() : responsible;

    const res = createActivity({
      name: name.trim(),
      priority,
      responsible: finalResp,
      durationWeeks,
      startDate,
      endDate,
      status,
      progress,
      observations,
      dependencies: []
    });

    if (res.success) {
      onClose();
      // Reset form
      setName('');
      setPriority('Media');
      setDurationWeeks(3);
      setStartDate('');
      setEndDate('');
      setProgress(0);
      setObservations('');
      setError(null);
    } else {
      setError(res.error || 'Error al crear la actividad.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Nueva Actividad</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Auditoría de controles de seguridad en red WiFi UTS"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as ActivityStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En ejecución">En ejecución</option>
                <option value="Completada">Completada</option>
                <option value="Retrasada">Retrasada</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Responsable
              </label>
              <button
                type="button"
                onClick={() => setIsCustomResp(!isCustomResp)}
                className="text-[11px] text-blue-600 font-medium"
              >
                {isCustomResp ? 'Seleccionar existente' : '+ Otro'}
              </button>
            </div>
            {isCustomResp ? (
              <input
                type="text"
                value={customResponsible}
                onChange={e => setCustomResponsible(e.target.value)}
                placeholder="Nombre del nuevo responsable"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {responsibles.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Duración (sem)</label>
              <input
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={e => handleDurationChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Inicio (Opcional)</label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleStartDateChange(e.target.value)}
                className="w-full px-2 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Observaciones</label>
            <textarea
              rows={2}
              value={observations}
              onChange={e => setObservations(e.target.value)}
              placeholder="Detalles adicionales..."
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Crear Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
