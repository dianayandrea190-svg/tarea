import React from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  Network,
  TableProperties,
  Users,
  Target,
  FileSpreadsheet,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { ViewTab } from '../types/project';

interface NavItem {
  id: ViewTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, kpis, resetToDefaultData } = useProject();

  const navItems: NavItem[] = [
    { id: 'resumen', label: 'Resumen General', icon: LayoutDashboard },
    { id: 'cronograma', label: 'Cronograma Gantt', icon: CalendarRange },
    { id: 'mapa', label: 'Mapa de Implementación', icon: Network },
    { id: 'actividades', label: 'Gestión de Actividades', icon: TableProperties, badge: kpis.totalActivities },
    { id: 'responsables', label: 'Responsables', icon: Users },
    { id: 'seguimiento', label: 'Seguimiento y Control', icon: Target, badge: kpis.delayedCount > 0 ? `${kpis.delayedCount} retraso` : undefined },
    { id: 'reportes', label: 'Reportes y Analítica', icon: FileSpreadsheet }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-tight leading-tight">
              UTS · PETI 2026
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Seguridad TI · TSI604
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Modules */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Módulos Principales
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                    isActive
                      ? 'bg-blue-700 text-white'
                      : typeof item.badge === 'string' && item.badge.includes('retraso')
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Mini Project Progress Card */}
      <div className="p-3 mx-3 mb-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-400 font-medium">Avance Global</span>
          <span className="font-mono font-bold text-white tabular-nums">{kpis.overallProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${kpis.overallProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{kpis.completedCount} de {kpis.totalActivities} completadas</span>
          <span className="font-mono">{kpis.estimatedTotalWeeks} sem</span>
        </div>
      </div>

      {/* Footer info & Reset */}
      <div className="p-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="truncate">Grupo B193 · 2026-2</span>
        <button
          onClick={resetToDefaultData}
          title="Restaurar fases del PETI UTS 2026"
          className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
