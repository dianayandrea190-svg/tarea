export type Priority = 'Alta' | 'Media' | 'Baja';

export type ActivityStatus = 'Pendiente' | 'En ejecución' | 'Completada' | 'Retrasada';

export interface Activity {
  id: number;
  priority: Priority;
  name: string;
  responsible: string;
  dependencies: number[]; // IDs of predecessor activities. Empty means "Por definir" / None
  durationWeeks: number;
  startDate?: string; // YYYY-MM-DD or undefined/"Por definir"
  endDate?: string;   // YYYY-MM-DD or undefined/"Por definir"
  status: ActivityStatus;
  progress: number;   // 0 - 100
  observations: string;
}

export type ViewTab =
  | 'resumen'
  | 'cronograma'
  | 'mapa'
  | 'actividades'
  | 'responsables'
  | 'seguimiento'
  | 'reportes';

export interface ResponsibleStats {
  name: string;
  totalActivities: number;
  completed: number;
  inProgress: number;
  pending: number;
  delayed: number;
  totalWeeks: number;
  averageProgress: number;
}
