import React, { useState } from 'react';
import { X, Calendar, Play, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

interface QuickScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickScheduleModal: React.FC<QuickScheduleModalProps> = ({ isOpen, onClose }) => {
  const { applySuggestedSchedule, resetToDefaultData } = useProject();
  const [baseDate, setBaseDate] = useState('2026-08-17');

  if (!isOpen) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseDate) return;
    applySuggestedSchedule(baseDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Asistente de Cronograma · PETI UTS 2026
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="p-6 space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-start gap-2.5 text-xs text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Ruta Metodológica del Proyecto (TSI604 · Grupo B193)</p>
              <p className="text-blue-800 leading-relaxed">
                Recalcula automáticamente todas las fechas de inicio y fin a partir de la fecha de apertura del semestre, siguiendo la ruta oficial del Taller 1 (PETI → Reto → Problema → Requerimientos → Criterios → Alternativas → Evaluación → Implementación → Pitch + Video).
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Inicio del Proyecto (Semestre 2026-2)
            </label>
            <input
              type="date"
              value={baseDate}
              onChange={e => setBaseDate(e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Fecha de inicio para la Actividad #1 (Análisis del PETI 2026 y selección del reto).
            </p>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-1.5 text-xs">
            <span className="font-semibold text-slate-800">Secuencia de dependencias del reto de Seguridad UTS:</span>
            <ul className="space-y-1 text-slate-600">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#1 Análisis del PETI y reto (2 sem) → Inicio</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#2 Diagnóstico vulnerabilidades y costos (3 sem) → Depende de #1</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#3 Problema, objetivos y requerimientos (3 sem) → Depende de #2</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#4 Criterios y alternativas tecnológicas (3 sem) → Depende de #3</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#5 Evaluación y selección de solución (2 sem) → Depende de #4</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#6 Plan controles/riesgos (4 sem) y #7 Sensibilización (2 sem) → Dependen de #5</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>#8 Validación y defensa Pitch + Video (2 sem) → Depende de #6 y #7</span>
              </li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                resetToDefaultData();
                onClose();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Restaurar datos PETI 2026
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Recalcular Cronograma
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
