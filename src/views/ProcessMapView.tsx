import React, { useState, useMemo } from 'react';
import {
  Network,
  GitBranch,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  Maximize2
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { Activity } from '../types/project';
import { getPriorityColor, getStatusColor, formatDate } from '../utils/dateUtils';

interface ProcessMapViewProps {
  onOpenQuickSchedule: () => void;
}

export const ProcessMapView: React.FC<ProcessMapViewProps> = ({ onOpenQuickSchedule }) => {
  const { activities, topology, openEditDrawer, updateActivity } = useProject();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('todos');

  // Compute topological levels for layout
  // Level = max(level of dependencies) + 1 (Level 0 = initial)
  const { nodeLevels, maxLevel } = useMemo(() => {
    const levels = new Map<number, number>();
    const actMap = new Map(activities.map(a => [a.id, a]));

    function getLevel(id: number, visited = new Set<number>()): number {
      if (visited.has(id)) return 0;
      if (levels.has(id)) return levels.get(id)!;

      const act = actMap.get(id);
      if (!act || !act.dependencies || act.dependencies.length === 0) {
        levels.set(id, 0);
        return 0;
      }

      visited.add(id);
      let maxPredLevel = -1;
      for (const predId of act.dependencies) {
        maxPredLevel = Math.max(maxPredLevel, getLevel(predId, new Set(visited)));
      }
      const lvl = maxPredLevel + 1;
      levels.set(id, lvl);
      return lvl;
    }

    activities.forEach(a => getLevel(a.id));

    let maxL = 0;
    levels.forEach(lvl => {
      if (lvl > maxL) maxL = lvl;
    });

    return { nodeLevels: levels, maxLevel: maxL };
  }, [activities]);

  // Group activities by level
  const columns = useMemo(() => {
    const cols: Activity[][] = [];
    for (let i = 0; i <= maxLevel; i++) {
      cols.push([]);
    }
    activities.forEach(act => {
      const lvl = nodeLevels.get(act.id) || 0;
      cols[lvl].push(act);
    });
    return cols;
  }, [activities, nodeLevels, maxLevel]);

  // Filtered nodes
  const isNodeVisible = (act: Activity) => {
    const typeInfo = topology.nodeTypes.get(act.id);
    if (!typeInfo) return true;
    if (filterType === 'iniciales') return typeInfo.isInitial;
    if (filterType === 'intermedias') return typeInfo.isIntermediate;
    if (filterType === 'finales') return typeInfo.isFinal;
    if (filterType === 'criticas') return typeInfo.isCritical;
    return true;
  };

  // Node Type Label
  const getNodeCategoryLabel = (act: Activity) => {
    const info = topology.nodeTypes.get(act.id);
    if (info?.isCritical) return { label: 'Ruta Crítica', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
    if (info?.isInitial) return { label: 'Actividad Inicial', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    if (info?.isFinal) return { label: 'Actividad Final', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    if (info?.isIntermediate) return { label: 'Intermedia', bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    return { label: 'Dependiente', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
  };

  // Quick stats
  const initialCount = activities.filter(a => topology.nodeTypes.get(a.id)?.isInitial).length;
  const intermediateCount = activities.filter(a => topology.nodeTypes.get(a.id)?.isIntermediate).length;
  const finalCount = activities.filter(a => topology.nodeTypes.get(a.id)?.isFinal).length;
  const criticalCount = topology.criticalNodeIds.length;

  return (
    <div className="space-y-4">
      {/* Top Controls & Category Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Filter by node type */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1.5">
            <FilterIcon className="w-3.5 h-3.5 text-slate-400" />
            Filtrar Nodos:
          </span>

          <button
            onClick={() => setFilterType('todos')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterType === 'todos' ? 'bg-slate-900 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({activities.length})
          </button>

          <button
            onClick={() => setFilterType('iniciales')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterType === 'iniciales' ? 'bg-blue-600 text-white font-bold' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            Iniciales ({initialCount})
          </button>

          <button
            onClick={() => setFilterType('intermedias')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterType === 'intermedias' ? 'bg-slate-700 text-white font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Intermedias ({intermediateCount})
          </button>

          <button
            onClick={() => setFilterType('finales')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterType === 'finales' ? 'bg-emerald-600 text-white font-bold' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Finales ({finalCount})
          </button>

          <button
            onClick={() => setFilterType('criticas')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterType === 'criticas' ? 'bg-rose-600 text-white font-bold' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Ruta Crítica ({criticalCount})
          </button>
        </div>

        {/* Right: Quick action */}
        <button
          type="button"
          onClick={onOpenQuickSchedule}
          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Configurar Dependencias Lógicas</span>
        </button>
      </div>

      {/* Process Graph Board */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 overflow-x-auto min-h-[560px]">
        {/* Helper Banner */}
        <div className="mb-6 flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            <span>
              Flujo de proceso ordenado por etapas lógicas de implementación (de izquierda a derecha).
            </span>
          </div>
          <span className="text-slate-400">
            Haz clic en cualquier nodo para abrir su panel de edición lateral.
          </span>
        </div>

        {/* Level Columns Grid */}
        <div className="flex items-start gap-8 min-w-[900px] justify-between">
          {columns.map((columnActivities, colIdx) => {
            const stageTitle =
              colIdx === 0
                ? 'Fase 1: Análisis PETI y Reto'
                : colIdx === 1
                ? 'Fase 2: Vulnerabilidades y Costos'
                : colIdx === 2
                ? 'Fase 3: Problema y Requerimientos'
                : colIdx === 3
                ? 'Fase 4: Criterios y Alternativas'
                : colIdx === 4
                ? 'Fase 5: Evaluación y Selección'
                : colIdx === 5
                ? 'Fase 6: Controles y Sensibilización'
                : `Fase ${colIdx + 1}: Validación y Pitch`;

            return (
              <div key={colIdx} className="flex-1 min-w-[260px] space-y-4">
                {/* Column / Stage Header */}
                <div className="pb-2 border-b-2 border-slate-200">
                  <div className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider">
                    Nivel {colIdx + 1}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 truncate">
                    {stageTitle}
                  </h4>
                </div>

                {/* Nodes inside this Level */}
                <div className="space-y-4">
                  {columnActivities.map(act => {
                    const isVisible = isNodeVisible(act);
                    const isSelected = selectedNodeId === act.id;
                    const priorityColor = getPriorityColor(act.priority);
                    const statusColor = getStatusColor(act.status);
                    const category = getNodeCategoryLabel(act);
                    const isCritical = topology.criticalNodeIds.includes(act.id);

                    // Predecessor names
                    const predNames = (act.dependencies || [])
                      .map(id => {
                        const p = activities.find(a => a.id === id);
                        return p ? `#${p.id} ${p.name}` : `#${id}`;
                      });

                    return (
                      <div
                        key={act.id}
                        onClick={() => {
                          setSelectedNodeId(act.id);
                          openEditDrawer(act);
                        }}
                        className={`rounded-xl border transition-all cursor-pointer relative group bg-white ${
                          !isVisible
                            ? 'opacity-30'
                            : isSelected
                            ? 'ring-2 ring-blue-600 shadow-md border-blue-400'
                            : isCritical
                            ? 'border-rose-300 hover:border-rose-400 hover:shadow-md'
                            : 'border-slate-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        {/* Critical Path Badge Indicator */}
                        {isCritical && (
                          <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                            Ruta Crítica
                          </div>
                        )}

                        {/* Node Card Header */}
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-slate-900 text-white rounded">
                              #{act.id}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${priorityColor.bg} ${priorityColor.text} ${priorityColor.border}`}>
                              {act.priority}
                            </span>
                          </div>

                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}>
                            {act.status}
                          </span>
                        </div>

                        {/* Node Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Task Name */}
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                            {act.name}
                          </h4>

                          {/* Responsible & Duration */}
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium truncate">{act.responsible}</span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <strong>{act.durationWeeks} semanas</strong>
                              </span>
                              <span>
                                {act.startDate ? formatDate(act.startDate) : 'Fechas sin fijar'}
                              </span>
                            </div>
                          </div>

                          {/* Dependencies Section */}
                          <div className="pt-2 border-t border-slate-100">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <GitBranch className="w-3 h-3 text-slate-400" />
                              Depende de:
                            </div>
                            {predNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {predNames.map((pName, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-mono truncate max-w-[200px]"
                                  >
                                    {pName}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 font-medium">
                                Ninguna (Actividad raíz / inicial)
                              </span>
                            )}
                          </div>

                          {/* Progress Bar */}
                          <div className="pt-1">
                            <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                              <span className="text-slate-500">Avance</span>
                              <span className="font-bold text-slate-900">{act.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600 rounded-full"
                                style={{ width: `${act.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Node Card Footer */}
                        <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-blue-600 font-semibold group-hover:bg-blue-50/40 transition-colors">
                          <span>Editar configuración</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}
