import { Activity } from '../types/project';

/**
 * Datos del Proyecto Integrador basados en el documento:
 * Taller 1 - Análisis del PETI 2026 de las UTS (Unidades Tecnológicas de Santander)
 * Asignatura: Selección y Evaluación de Tecnologías (TSI604) · Semestre 2026-2 · Grupo B193
 * Autores: Diana Marcela Beltrán Suarez, Carlos Felipe Velazco Hernandez
 * Docente: Lizette Manzey · Bucaramanga, 2026
 *
 * Reto seleccionado (Parte F, pág. 6):
 * Fortalecimiento de la seguridad de la información de las UTS (PETI pág. 85-86).
 * Ruta metodológica (Sección 7, pág. 6):
 * PETI → necesidad/reto → problema → requerimientos → criterios → alternativas → evaluación → selección → implementación → pitch + video.
 */
export const PROJECT_META = {
  institution: 'Unidades Tecnológicas de Santander (UTS)',
  course: 'Selección y Evaluación de Tecnologías (TSI604)',
  semester: '2026-2',
  group: 'B193',
  authors: 'Diana Marcela Beltrán Suarez · Carlos Felipe Velazco Hernandez',
  instructor: 'Lizette Manzey',
  challengeTitle: 'Fortalecimiento de la seguridad de la información de las UTS',
  petiEvidence: 'Proyecto de Seguridad Informática (PETI 2026, Pág. 85-86)',
  guidingQuestion:
    '¿Cómo podríamos fortalecer la seguridad de la información y de los servicios tecnológicos de las UTS para contribuir a la protección de datos institucionales?',
  prioritizedNeeds: [
    { name: 'Fortalecer la seguridad de la información', score: 15, evidence: 'PETI Pág. 85-86', selected: true },
    { name: 'Modernizar infraestructura tecnológica', score: 14, evidence: 'PETI Pág. 86-87', selected: false },
    { name: 'Mejorar conectividad WiFi', score: 12, evidence: 'PETI Pág. 62-63', selected: false }
  ]
};

export const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 1,
    priority: 'Alta',
    name: 'Análisis del PETI 2026 y selección del reto tecnológico',
    responsible: 'Equipo Proyecto B193',
    dependencies: [],
    durationWeeks: 2,
    startDate: '2026-08-17',
    endDate: '2026-08-30',
    status: 'Completada',
    progress: 100,
    observations:
      'Revisión del PETI UTS (Pág. 60-64, 85-87, 93). Matriz de priorización: Seguridad de la información obtuvo 15/15 pts (Impacto 5, Urgencia 5, Relevancia 5).'
  },
  {
    id: 2,
    priority: 'Alta',
    name: 'Diagnóstico de vulnerabilidades, riesgos actuales y costos',
    responsible: 'Oficina de Recursos Informáticos',
    dependencies: [1],
    durationWeeks: 3,
    startDate: '2026-08-31',
    endDate: '2026-09-20',
    status: 'Completada',
    progress: 100,
    observations:
      'Levantamiento de brechas en sistemas académicos/administrativos, servidores, almacenamiento y conectividad WiFi (Parte E y F: información faltante por investigar).'
  },
  {
    id: 3,
    priority: 'Alta',
    name: 'Formulación del problema, objetivos y requerimientos',
    responsible: 'Equipo Proyecto B193',
    dependencies: [2],
    durationWeeks: 3,
    startDate: '2026-09-21',
    endDate: '2026-10-11',
    status: 'Completada',
    progress: 100,
    observations:
      'Definición del problema y requerimientos para garantizar confidencialidad, integridad y disponibilidad de los datos institucionales (Sección 7 del Taller).'
  },
  {
    id: 4,
    priority: 'Alta',
    name: 'Construcción de criterios y alternativas tecnológicas',
    responsible: 'Especialista en Seguridad TI',
    dependencies: [3],
    durationWeeks: 3,
    startDate: '2026-10-12',
    endDate: '2026-11-01',
    status: 'Retrasada',
    progress: 75,
    observations:
      'Análisis técnico y económico de tecnologías disponibles y alternativas de controles de seguridad informática sin sesgo previo de proveedor.'
  },
  {
    id: 5,
    priority: 'Media',
    name: 'Evaluación y selección de la solución tecnológica',
    responsible: 'Comité de Planeación TI UTS',
    dependencies: [4],
    durationWeeks: 2,
    startDate: '2026-11-02',
    endDate: '2026-11-15',
    status: 'En ejecución',
    progress: 50,
    observations:
      'Evaluación multicriterio alineada al papel estratégico y habilitador de TI en las UTS (PETI Pág. 60-61, sección 9.1.3).'
  },
  {
    id: 6,
    priority: 'Alta',
    name: 'Plan de implementación de controles y gestión de riesgos',
    responsible: 'Especialista en Seguridad TI',
    dependencies: [5],
    durationWeeks: 4,
    startDate: '2026-11-16',
    endDate: '2026-12-13',
    status: 'Pendiente',
    progress: 0,
    observations:
      'Hoja de ruta para implementar controles de seguridad, mitigación de riesgos tecnológicos y protección de la plataforma institucional (PETI Pág. 85-86).'
  },
  {
    id: 7,
    priority: 'Media',
    name: 'Sensibilización y capacitación a comunidad UTS',
    responsible: 'Comunidad UTS (Docentes/Estud./Admin.)',
    dependencies: [5],
    durationWeeks: 2,
    startDate: '2026-11-16',
    endDate: '2026-11-29',
    status: 'Pendiente',
    progress: 0,
    observations:
      'Jornadas de sensibilización y cultura de seguridad informática dirigidas a docentes, estudiantes, personal administrativo y Recursos Informáticos.'
  },
  {
    id: 8,
    priority: 'Alta',
    name: 'Validación final y defensa del proyecto (Pitch + Video)',
    responsible: 'Docente Evaluador (TSI604)',
    dependencies: [6, 7],
    durationWeeks: 2,
    startDate: '2026-12-14',
    endDate: '2026-12-27',
    status: 'Pendiente',
    progress: 0,
    observations:
      'Defensa final de la propuesta de solución tecnológica mediante pitch y video ante la docente Lizette Manzey (Grupo B193, Semestre 2026-2).'
  }
];

export const INITIAL_RESPONSIBLES: string[] = [
  'Equipo Proyecto B193',
  'Oficina de Recursos Informáticos',
  'Especialista en Seguridad TI',
  'Comité de Planeación TI UTS',
  'Comunidad UTS (Docentes/Estud./Admin.)',
  'Docente Evaluador (TSI604)'
];
