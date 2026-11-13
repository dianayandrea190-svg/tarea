import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { Activity } from '../types/project';
import { PROJECT_META } from '../data/initialData';
import { formatDate, analyzeProjectTopology } from './dateUtils';

export function exportActivitiesToExcel(activities: Activity[]) {
  const worksheetData = activities.map(act => ({
    'ID': act.id,
    'Prioridad': act.priority,
    'Actividad': act.name,
    'Responsable': act.responsible,
    'Depende de (IDs)': act.dependencies && act.dependencies.length > 0
      ? act.dependencies.join(', ')
      : 'Por definir',
    'Duración': `${act.durationWeeks} semanas`,
    'Fecha Inicio': formatDate(act.startDate),
    'Fecha Fin': formatDate(act.endDate),
    'Estado': act.status,
    'Avance (%)': `${act.progress}%`,
    'Observaciones': act.observations || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  worksheet['!cols'] = [
    { wch: 6 },  // ID
    { wch: 10 }, // Prioridad
    { wch: 42 }, // Actividad
    { wch: 28 }, // Responsable
    { wch: 18 }, // Depende de
    { wch: 14 }, // Duración
    { wch: 14 }, // Inicio
    { wch: 14 }, // Fin
    { wch: 14 }, // Estado
    { wch: 12 }, // Avance
    { wch: 52 }  // Observaciones
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PETI UTS 2026 Seguridad TI');

  XLSX.writeFile(workbook, `PETI_UTS_2026_Seguridad_TI_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportProjectReportToPDF(activities: Activity[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const total = activities.length;
  const completed = activities.filter(a => a.status === 'Completada').length;
  const inProgress = activities.filter(a => a.status === 'En ejecución').length;
  const delayed = activities.filter(a => a.status === 'Retrasada').length;
  const avgProgress = total > 0 ? Math.round(activities.reduce((s, a) => s + a.progress, 0) / total) : 0;
  const topology = analyzeProjectTopology(activities);

  // Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE EJECUTIVO · PETI 2026 DE LAS UTS', 14, 11);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reto: ${PROJECT_META.challengeTitle} (${PROJECT_META.course})`, 14, 17);
  doc.text(`Integrantes: ${PROJECT_META.authors} · Grupo ${PROJECT_META.group}`, 14, 22.5);
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-ES')}`, 160, 22.5);

  // Executive KPI Summary Box
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen Ejecutivo de Indicadores', 14, 37);

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 40, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL FASES', 18, 46);
  doc.text('AVANCE GLOBAL', 52, 46);
  doc.text('EN EJECUCIÓN', 88, 46);
  doc.text('COMPLETADAS', 122, 46);
  doc.text('RETRASADAS', 156, 46);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${total}`, 18, 54);
  doc.text(`${avgProgress}%`, 52, 54);
  doc.text(`${inProgress}`, 88, 54);
  doc.text(`${completed}`, 122, 54);
  doc.setTextColor(220, 38, 38);
  doc.text(`${delayed}`, 156, 54);

  // Project topology & evidence note
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const criticalNames = activities.filter(a => topology.criticalNodeIds.includes(a.id)).map(a => `#${a.id} ${a.name}`);
  doc.text(`Evidencia institucional: ${PROJECT_META.petiEvidence} · Duración ruta crítica: ${topology.estimatedTotalWeeks} semanas.`, 14, 68);
  if (criticalNames.length > 0) {
    doc.text(`Ruta crítica (${criticalNames.length} fases): ${criticalNames.slice(0, 2).join(', ')}${criticalNames.length > 2 ? '...' : ''}`, 14, 73);
  }

  // Activity Table Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Plan de Trabajo y Seguimiento · Seguridad de la Información UTS', 14, 84);

  let startY = 89;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, startY, 182, 7, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);

  doc.text('ID', 16, startY + 5);
  doc.text('Actividad / Fase', 24, startY + 5);
  doc.text('Responsable', 86, startY + 5);
  doc.text('Prioridad', 128, startY + 5);
  doc.text('Duración', 146, startY + 5);
  doc.text('Estado', 164, startY + 5);
  doc.text('Avance', 184, startY + 5);

  startY += 7;

  activities.forEach((act, idx) => {
    const rowY = startY + (idx * 9);
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, rowY, 182, 9, 'F');
    }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    doc.text(`${act.id}`, 16, rowY + 6);
    const shortName = act.name.length > 34 ? act.name.substring(0, 32) + '...' : act.name;
    doc.text(shortName, 24, rowY + 6);

    const shortResp = act.responsible.length > 23 ? act.responsible.substring(0, 21) + '...' : act.responsible;
    doc.text(shortResp, 86, rowY + 6);

    doc.text(act.priority, 128, rowY + 6);
    doc.text(`${act.durationWeeks} sem.`, 146, rowY + 6);
    doc.text(act.status, 164, rowY + 6);
    doc.text(`${act.progress}%`, 184, rowY + 6);

    doc.setDrawColor(241, 245, 249);
    doc.line(14, rowY + 9, 196, rowY + 9);
  });

  // Observations / Notes section grounded in PDF
  const notesY = startY + (activities.length * 9) + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Problemática, Trazabilidad PETI y Pregunta Inicial', 14, notesY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const questionLines = doc.splitTextToSize(`• Pregunta orientadora: ${PROJECT_META.guidingQuestion}`, 180);
  doc.text(questionLines, 14, notesY + 6);
  doc.text('• Priorización PETI: Seguridad de la información (15/15) > Infraestructura (14/15) > WiFi (12/15).', 14, notesY + 15);
  doc.text('• Comunidad involucrada: Oficina de Recursos Informáticos, docentes, estudiantes y administrativos.', 14, notesY + 20);
  doc.text(`• Revisión académica: Docente ${PROJECT_META.instructor} · Bucaramanga, 2026.`, 14, notesY + 25);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generado desde el Dashboard PETI UTS 2026 · Selección y Evaluación de Tecnologías (TSI604)', 14, 287);
  doc.text('Página 1 de 1', 182, 287);

  doc.save(`Reporte_PETI_UTS_2026_Seguridad_${new Date().toISOString().split('T')[0]}.pdf`);
}
