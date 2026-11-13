import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Activity, ViewTab, ResponsibleStats } from '../types/project';
import { INITIAL_ACTIVITIES, INITIAL_RESPONSIBLES } from '../data/initialData';
import { analyzeProjectTopology, isActivityDelayed, addWeeksToDate, calculateWeeksBetween } from '../utils/dateUtils';

const STORAGE_KEY = 'uts_peti_2026_security_v1';

interface ProjectContextType {
  activities: Activity[];
  responsibles: string[];
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  selectedActivity: Activity | null;
  isDrawerOpen: boolean;
  openEditDrawer: (activity: Activity | number) => void;
  closeEditDrawer: () => void;
  updateActivity: (updated: Activity, cascadeDates?: boolean) => { success: boolean; error?: string };
  createActivity: (newAct: Partial<Activity>) => { success: boolean; error?: string; created?: Activity };
  deleteActivity: (id: number) => void;
  resetToDefaultData: () => void;
  applySuggestedSchedule: (startDateStr: string) => void;
  // Dynamic KPIs
  kpis: {
    totalActivities: number;
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    delayedCount: number;
    overallProgress: number;
    estimatedTotalWeeks: number;
    unconfiguredCount: number;
  };
  topology: {
    criticalNodeIds: number[];
    nodeTypes: Map<number, {
      isInitial: boolean;
      isFinal: boolean;
      isIntermediate: boolean;
      isDependent: boolean;
      isCritical: boolean;
    }>;
  };
  responsibleStats: ResponsibleStats[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterStatus: string;
  setFilterStatus: (s: string) => void;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  filterResponsible: string;
  setFilterResponsible: (r: string) => void;
  notification: { message: string; type: 'success' | 'info' | 'error' } | null;
  setNotification: (notif: { message: string; type: 'success' | 'info' | 'error' } | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return INITIAL_ACTIVITIES;
  });

  const [activeTab, setActiveTab] = useState<ViewTab>('resumen');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [filterPriority, setFilterPriority] = useState('Todas');
  const [filterResponsible, setFilterResponsible] = useState('Todos');

  // Flash notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    } catch (e) {
      console.error('Error saving activities to LocalStorage', e);
    }
  }, [activities]);

  // Responsibles list (all distinct)
  const responsibles = useMemo(() => {
    const set = new Set<string>(INITIAL_RESPONSIBLES);
    activities.forEach(a => {
      if (a.responsible && a.responsible.trim()) {
        set.add(a.responsible.trim());
      }
    });
    return Array.from(set);
  }, [activities]);

  // Selected activity object
  const selectedActivity = useMemo(() => {
    if (selectedActivityId === null) return null;
    return activities.find(a => a.id === selectedActivityId) || null;
  }, [selectedActivityId, activities]);

  // Topology analysis
  const topology = useMemo(() => {
    return analyzeProjectTopology(activities);
  }, [activities]);

  // Calculated KPIs
  const kpis = useMemo(() => {
    const totalActivities = activities.length;
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let delayedCount = 0;
    let totalProgressSum = 0;
    let unconfiguredCount = 0;

    activities.forEach(a => {
      // Check if delayed
      if (isActivityDelayed(a)) {
        delayedCount++;
      }
      if (a.status === 'Completada') {
        completedCount++;
      } else if (a.status === 'En ejecución') {
        inProgressCount++;
      } else if (a.status === 'Retrasada') {
        // already counted in delayed
      } else {
        pendingCount++;
      }

      totalProgressSum += (a.progress || 0);

      if (!a.startDate || !a.endDate || (a.dependencies || []).length === 0) {
        unconfiguredCount++;
      }
    });

    const overallProgress = totalActivities > 0 ? Math.round(totalProgressSum / totalActivities) : 0;

    return {
      totalActivities,
      pendingCount,
      inProgressCount,
      completedCount,
      delayedCount,
      overallProgress,
      estimatedTotalWeeks: topology.estimatedTotalWeeks,
      unconfiguredCount
    };
  }, [activities, topology]);

  // Responsible stats
  const responsibleStats = useMemo<ResponsibleStats[]>(() => {
    return responsibles.map(respName => {
      const assigned = activities.filter(a => a.responsible === respName);
      const totalActivities = assigned.length;
      const completed = assigned.filter(a => a.status === 'Completada').length;
      const inProgress = assigned.filter(a => a.status === 'En ejecución').length;
      const delayed = assigned.filter(a => isActivityDelayed(a)).length;
      const pending = assigned.filter(a => a.status === 'Pendiente').length;
      const totalWeeks = assigned.reduce((sum, a) => sum + (a.durationWeeks || 0), 0);
      const avgProg = totalActivities > 0
        ? Math.round(assigned.reduce((s, a) => s + (a.progress || 0), 0) / totalActivities)
        : 0;

      return {
        name: respName,
        totalActivities,
        completed,
        inProgress,
        pending,
        delayed,
        totalWeeks,
        averageProgress: avgProg
      };
    });
  }, [responsibles, activities]);

  // Actions
  const openEditDrawer = (activityOrId: Activity | number) => {
    const id = typeof activityOrId === 'number' ? activityOrId : activityOrId.id;
    setSelectedActivityId(id);
    setIsDrawerOpen(true);
  };

  const closeEditDrawer = () => {
    setIsDrawerOpen(false);
  };

  const updateActivity = (updated: Activity, cascadeDates = false): { success: boolean; error?: string } => {
    // Validate duration
    if (updated.durationWeeks <= 0) {
      return { success: false, error: 'La duración debe ser mayor a 0 semanas.' };
    }

    // Auto-update status if progress is changed
    let adjustedStatus = updated.status;
    if (updated.progress === 100 && adjustedStatus !== 'Completada') {
      adjustedStatus = 'Completada';
    } else if (updated.progress > 0 && updated.progress < 100 && adjustedStatus === 'Pendiente') {
      adjustedStatus = 'En ejecución';
    }

    let finalUpdated: Activity = {
      ...updated,
      status: adjustedStatus
    };

    // If start date and duration exist, ensure end date matches if not explicitly set
    if (finalUpdated.startDate && (!finalUpdated.endDate || finalUpdated.endDate < finalUpdated.startDate)) {
      finalUpdated.endDate = addWeeksToDate(finalUpdated.startDate, finalUpdated.durationWeeks);
    }

    setActivities(prev => {
      const copy = prev.map(a => (a.id === finalUpdated.id ? finalUpdated : a));

      // Optional cascade: if task has end date and cascade is true, update direct successors
      if (cascadeDates && finalUpdated.endDate) {
        const queue = [finalUpdated.id];
        const visited = new Set<number>([finalUpdated.id]);

        while (queue.length > 0) {
          const parentId = queue.shift()!;
          const parentAct = copy.find(a => a.id === parentId);
          if (!parentAct || !parentAct.endDate) continue;

          // Find direct successors
          copy.forEach(child => {
            if (child.dependencies?.includes(parentId)) {
              // Child start date should be next day or same date as parent end date
              const parentEndDate = new Date(parentAct.endDate! + 'T00:00:00');
              const nextStart = new Date(parentEndDate);
              nextStart.setDate(nextStart.getDate() + 1);
              const nextStartStr = nextStart.toISOString().split('T')[0];

              // Update child start & end date
              child.startDate = nextStartStr;
              child.endDate = addWeeksToDate(nextStartStr, child.durationWeeks);

              if (!visited.has(child.id)) {
                visited.add(child.id);
                queue.push(child.id);
              }
            }
          });
        }
      }

      return copy;
    });

    setNotification({
      message: `Actividad "${finalUpdated.name}" actualizada con éxito.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);

    return { success: true };
  };

  const createActivity = (newAct: Partial<Activity>): { success: boolean; error?: string; created?: Activity } => {
    if (!newAct.name || !newAct.name.trim()) {
      return { success: false, error: 'El nombre de la actividad es obligatorio.' };
    }

    const nextId = activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1;
    const duration = newAct.durationWeeks && newAct.durationWeeks > 0 ? newAct.durationWeeks : 2;
    const startDate = newAct.startDate || '';
    const endDate = newAct.endDate || (startDate ? addWeeksToDate(startDate, duration) : '');

    const activity: Activity = {
      id: nextId,
      name: newAct.name.trim(),
      priority: newAct.priority || 'Media',
      responsible: newAct.responsible || 'Especialista en Seguridad TI',
      dependencies: newAct.dependencies || [],
      durationWeeks: duration,
      startDate,
      endDate,
      status: newAct.status || 'Pendiente',
      progress: newAct.progress || 0,
      observations: newAct.observations || ''
    };

    setActivities(prev => [...prev, activity]);
    setNotification({
      message: `Nueva actividad "${activity.name}" agregada con ID #${activity.id}.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);

    return { success: true, created: activity };
  };

  const deleteActivity = (id: number) => {
    const act = activities.find(a => a.id === id);
    setActivities(prev => {
      // Also remove this id from any dependencies
      return prev
        .filter(a => a.id !== id)
        .map(a => ({
          ...a,
          dependencies: (a.dependencies || []).filter(depId => depId !== id)
        }));
    });
    if (selectedActivityId === id) {
      setIsDrawerOpen(false);
      setSelectedActivityId(null);
    }
    setNotification({
      message: `Actividad #${id} "${act?.name || ''}" eliminada.`,
      type: 'info'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const resetToDefaultData = () => {
    setActivities(INITIAL_ACTIVITIES);
    setIsDrawerOpen(false);
    setSelectedActivityId(null);
    setNotification({
      message: 'Se han restaurado las 8 actividades base del proyecto a su estado inicial.',
      type: 'info'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  /**
   * Asistente de cronograma basado en la ruta metodológica del Taller 1 (Sección 7):
   * 1. Análisis del PETI 2026 y selección del reto (2 sem) -> inicial
   * 2. Diagnóstico de vulnerabilidades, riesgos y costos (3 sem) -> depende de 1
   * 3. Formulación del problema, objetivos y requerimientos (3 sem) -> depende de 2
   * 4. Construcción de criterios y alternativas tecnológicas (3 sem) -> depende de 3
   * 5. Evaluación y selección de la solución tecnológica (2 sem) -> depende de 4
   * 6. Plan de implementación de controles y gestión de riesgos (4 sem) -> depende de 5
   * 7. Sensibilización y capacitación a comunidad UTS (2 sem) -> depende de 5 (en paralelo con 6)
   * 8. Validación final y defensa del proyecto Pitch + Video (2 sem) -> depende de 6 y 7
   */
  const applySuggestedSchedule = (baseStartDateStr: string) => {
    if (!baseStartDateStr) return;

    const depMap: Record<number, number[]> = {
      1: [],
      2: [1],
      3: [2],
      4: [3],
      5: [4],
      6: [5],
      7: [5],
      8: [6, 7]
    };

    setActivities(prev => {
      const updated = [...prev];
      const actMap = new Map(updated.map(a => [a.id, { ...a }]));

      const nextDay = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      };

      const a1 = actMap.get(1);
      if (a1) {
        a1.startDate = baseStartDateStr;
        a1.endDate = addWeeksToDate(a1.startDate, a1.durationWeeks);
        a1.dependencies = depMap[1];
      }

      const a2 = actMap.get(2);
      if (a2 && a1?.endDate) {
        a2.startDate = nextDay(a1.endDate);
        a2.endDate = addWeeksToDate(a2.startDate, a2.durationWeeks);
        a2.dependencies = depMap[2];
      }

      const a3 = actMap.get(3);
      if (a3 && a2?.endDate) {
        a3.startDate = nextDay(a2.endDate);
        a3.endDate = addWeeksToDate(a3.startDate, a3.durationWeeks);
        a3.dependencies = depMap[3];
      }

      const a4 = actMap.get(4);
      if (a4 && a3?.endDate) {
        a4.startDate = nextDay(a3.endDate);
        a4.endDate = addWeeksToDate(a4.startDate, a4.durationWeeks);
        a4.dependencies = depMap[4];
      }

      const a5 = actMap.get(5);
      if (a5 && a4?.endDate) {
        a5.startDate = nextDay(a4.endDate);
        a5.endDate = addWeeksToDate(a5.startDate, a5.durationWeeks);
        a5.dependencies = depMap[5];
      }

      const a6 = actMap.get(6);
      const a7 = actMap.get(7);
      if (a5?.endDate) {
        const startAfter5 = nextDay(a5.endDate);
        if (a6) {
          a6.startDate = startAfter5;
          a6.endDate = addWeeksToDate(a6.startDate, a6.durationWeeks);
          a6.dependencies = depMap[6];
        }
        if (a7) {
          a7.startDate = startAfter5;
          a7.endDate = addWeeksToDate(a7.startDate, a7.durationWeeks);
          a7.dependencies = depMap[7];
        }
      }

      const a8 = actMap.get(8);
      if (a8 && a6?.endDate && a7?.endDate) {
        const maxEnd = a6.endDate > a7.endDate ? a6.endDate : a7.endDate;
        a8.startDate = nextDay(maxEnd);
        a8.endDate = addWeeksToDate(a8.startDate, a8.durationWeeks);
        a8.dependencies = depMap[8];
      }

      return Array.from(actMap.values());
    });

    setNotification({
      message: 'Se aplicó el cronograma metodológico del PETI UTS 2026 al proyecto.',
      type: 'success'
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <ProjectContext.Provider
      value={{
        activities,
        responsibles,
        activeTab,
        setActiveTab,
        selectedActivity,
        isDrawerOpen,
        openEditDrawer,
        closeEditDrawer,
        updateActivity,
        createActivity,
        deleteActivity,
        resetToDefaultData,
        applySuggestedSchedule,
        kpis,
        topology,
        responsibleStats,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        filterPriority,
        setFilterPriority,
        filterResponsible,
        setFilterResponsible,
        notification,
        setNotification
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
