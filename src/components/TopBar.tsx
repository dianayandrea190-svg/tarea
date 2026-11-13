import React from 'react';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  CalendarCheck,
  ChevronRight
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { exportActivitiesToExcel, exportProjectReportToPDF } from '../utils/exportUtils';

interface TopBarProps {
  onOpenNewActivity: () => void;
  onOpenQuickSchedule: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNewActivity,
  onOpenQuickSchedule
}) => {
  const { activeTab, activities } = useProject();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'resumen':
        return 'Resumen General del Proyecto';
      case 'cronograma':
        return 'Cronograma Interactivo tipo Gantt';
      case 'mapa':
        return 'Mapa Visual de Implementación y Proceso';
      case 'actividades':
        return 'Gestión y Administración de Actividades';
      case 'responsables':
        return 'Panel de Carga y Cumplimiento por Responsables';
      case 'seguimiento':
        return 'Seguimiento, Control y Detección de Retrasos';
      case 'reportes':
        return 'Reportes Ejecutivos y Analítica';
      default:
        return 'Dashboard de Implementación';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20">
      {/* Breadcrumb Zone */}
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-slate-500">PETI UTS 2026 · Seguridad TI</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="font-bold text-slate-900 text-sm">{getTabTitle()}</span>
      </div>

      {/* Action Zone */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenQuickSchedule}
          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
          title="Configurar fechas base y dependencias"
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Asistente de Cronograma</span>
        </button>

        <button
          type="button"
          onClick={() => exportActivitiesToExcel(activities)}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
          title="Exportar datos a Excel (.xlsx)"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Exportar Excel</span>
        </button>

        <button
          type="button"
          onClick={() => exportProjectReportToPDF(activities)}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
          title="Generar reporte ejecutivo en PDF"
        >
          <FileText className="w-3.5 h-3.5 text-rose-600" />
          <span className="hidden sm:inline">Reporte PDF</span>
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
    </header>
  );
};
