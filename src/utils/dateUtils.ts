import { Activity } from '../types/project';

/**
 * Format a YYYY-MM-DD string to a readable Spanish date format: DD/MM/YYYY
 */
export function formatDate(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '') {
    return 'Por definir';
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Adds weeks to a YYYY-MM-DD start date and returns the end date (YYYY-MM-DD).
 * For a duration of W weeks, end date is typically (W * 7 - 1) calendar days later.
 */
export function addWeeksToDate(startDateStr: string, weeks: number): string {
  if (!startDateStr || weeks <= 0) return '';
  const date = new Date(startDateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  // Add weeks * 7 days minus 1 day (e.g. Monday to Sunday of final week)
  const daysToAdd = Math.max(1, weeks * 7 - 1);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

/**
 * Calculate the number of weeks between two dates.
 */
export function calculateWeeksBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, Math.round(diffDays / 7));
}

/**
 * Checks if start date is strictly before or equal to end date.
 */
export function isValidDateRange(startDateStr?: string, endDateStr?: string): boolean {
  if (!startDateStr || !endDateStr) return true;
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
  return start.getTime() <= end.getTime();
}

/**
 * Checks if a task is delayed based on status or system date.
 */
export function isActivityDelayed(activity: Activity): boolean {
  if (activity.status === 'Retrasada') return true;
  if (activity.status === 'Completada') return false;
  if (!activity.endDate) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(activity.endDate + 'T00:00:00');
  if (isNaN(end.getTime())) return false;

  return end.getTime() < now.getTime() && activity.progress < 100;
}

/**
 * Circular Dependency Prevention Algorithm
 *
 * Checks if adding `candidatePredecessorId` as a predecessor of `targetActivityId`
 * would create a circular dependency loop (cycle).
 * A cycle occurs if `targetActivityId` can already reach `candidatePredecessorId`
 * through existing dependency edges (i.e., candidatePredecessor already depends on target, directly or indirectly).
 */
export function wouldCreateCircularDependency(
  activities: Activity[],
  targetActivityId: number,
  candidatePredecessorId: number,
  currentProposedDependencies?: number[]
): { hasCycle: boolean; cyclePath: number[] } {
  // Activity cannot depend on itself
  if (targetActivityId === candidatePredecessorId) {
    return { hasCycle: true, cyclePath: [targetActivityId, candidatePredecessorId] };
  }

  // Build adjacency list where edge (U -> V) means V depends on U (U is predecessor of V).
  // Alternatively, edge (V -> U) means V requires U.
  // If targetActivityId requires candidatePredecessorId, we want to know if candidatePredecessorId
  // already requires targetActivityId (directly or indirectly).
  const dependencyMap = new Map<number, number[]>();
  for (const act of activities) {
    if (act.id === targetActivityId && currentProposedDependencies) {
      dependencyMap.set(act.id, [...currentProposedDependencies]);
    } else {
      dependencyMap.set(act.id, [...(act.dependencies || [])]);
    }
  }

  // BFS / DFS to check if candidatePredecessorId depends on targetActivityId
  const visited = new Set<number>();
  const parentMap = new Map<number, number>();
  const queue: number[] = [candidatePredecessorId];
  visited.add(candidatePredecessorId);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetActivityId) {
      // Reconstruct cycle path
      const path: number[] = [targetActivityId];
      let curr = targetActivityId;
      while (parentMap.has(curr)) {
        curr = parentMap.get(curr)!;
        path.unshift(curr);
      }
      return { hasCycle: true, cyclePath: path };
    }

    const preds = dependencyMap.get(current) || [];
    for (const pred of preds) {
      if (!visited.has(pred)) {
        visited.add(pred);
        parentMap.set(pred, current);
        queue.push(pred);
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

/**
 * Calculates project critical path and node classifications.
 */
export function analyzeProjectTopology(activities: Activity[]) {
  const actMap = new Map(activities.map(a => [a.id, a]));
  const successorsMap = new Map<number, number[]>();

  activities.forEach(a => successorsMap.set(a.id, []));
  activities.forEach(a => {
    (a.dependencies || []).forEach(depId => {
      const succ = successorsMap.get(depId);
      if (succ) succ.push(a.id);
    });
  });

  // Classify nodes
  const nodeTypes = new Map<number, {
    isInitial: boolean;
    isFinal: boolean;
    isIntermediate: boolean;
    isDependent: boolean;
    isCritical: boolean;
  }>();

  // Find longest path (Critical Path) using topological DP
  // For each node, longest duration from any start node to this node's completion
  const memoEarliestFinish = new Map<number, number>();

  function getEarliestFinish(id: number, visited = new Set<number>()): number {
    if (visited.has(id)) return 0; // Guard against existing cycles
    if (memoEarliestFinish.has(id)) return memoEarliestFinish.get(id)!;

    const act = actMap.get(id);
    if (!act) return 0;

    visited.add(id);
    const deps = act.dependencies || [];
    let maxDepFinish = 0;
    for (const depId of deps) {
      maxDepFinish = Math.max(maxDepFinish, getEarliestFinish(depId, new Set(visited)));
    }
    const finish = maxDepFinish + (act.durationWeeks || 1);
    memoEarliestFinish.set(id, finish);
    return finish;
  }

  activities.forEach(a => getEarliestFinish(a.id));

  // Find maximum project finish
  let maxProjectWeeks = 0;
  activities.forEach(a => {
    const ef = memoEarliestFinish.get(a.id) || 0;
    if (ef > maxProjectWeeks) maxProjectWeeks = ef;
  });

  // Backward pass to find critical path
  const criticalNodeIds = new Set<number>();
  if (maxProjectWeeks > 0) {
    // Activities that end at maxProjectWeeks and have 0 slack
    const endNodes = activities.filter(a => memoEarliestFinish.get(a.id) === maxProjectWeeks);
    const queue = [...endNodes.map(a => a.id)];
    queue.forEach(id => criticalNodeIds.add(id));

    while (queue.length > 0) {
      const currId = queue.shift()!;
      const act = actMap.get(currId);
      if (!act) continue;

      const currEF = memoEarliestFinish.get(currId) || 0;
      const expectedPredEF = currEF - (act.durationWeeks || 1);

      (act.dependencies || []).forEach(depId => {
        if (memoEarliestFinish.get(depId) === expectedPredEF) {
          if (!criticalNodeIds.has(depId)) {
            criticalNodeIds.add(depId);
            queue.push(depId);
          }
        }
      });
    }
  }

  activities.forEach(a => {
    const deps = a.dependencies || [];
    const succs = successorsMap.get(a.id) || [];
    const isInitial = deps.length === 0;
    const isFinal = succs.length === 0;
    const isIntermediate = !isInitial && !isFinal;
    const isDependent = deps.length > 0;
    const isCritical = criticalNodeIds.has(a.id);

    nodeTypes.set(a.id, {
      isInitial,
      isFinal,
      isIntermediate,
      isDependent,
      isCritical
    });
  });

  return {
    nodeTypes,
    criticalNodeIds: Array.from(criticalNodeIds),
    estimatedTotalWeeks: maxProjectWeeks > 0 ? maxProjectWeeks : activities.reduce((sum, a) => sum + (a.durationWeeks || 0), 0)
  };
}

/**
 * Styling helpers for priorities and statuses strictly matching project prompt:
 * Prioridades:
 * - Alta: rojo suave
 * - Media: amarillo
 * - Baja: verde
 *
 * Estados:
 * - Pendiente: gris
 * - En ejecución: azul
 * - Completada: verde
 * - Retrasada: rojo
 */
export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'Alta':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        bar: '#f87171',
        raw: '#ef4444'
      };
    case 'Media':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        bar: '#fbbf24',
        raw: '#f59e0b'
      };
    case 'Baja':
    default:
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        bar: '#34d399',
        raw: '#10b981'
      };
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'En ejecución':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        bar: '#3b82f6',
        raw: '#2563eb'
      };
    case 'Completada':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        bar: '#10b981',
        raw: '#059669'
      };
    case 'Retrasada':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        bar: '#ef4444',
        raw: '#dc2626'
      };
    case 'Pendiente':
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
        bar: '#94a3b8',
        raw: '#64748b'
      };
  }
}
