import React, { useState } from 'react';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ActivityEditDrawer } from './components/ActivityEditDrawer';
import { NewActivityModal } from './components/NewActivityModal';
import { QuickScheduleModal } from './components/QuickScheduleModal';
import { OverviewView } from './views/OverviewView';
import { GanttView } from './views/GanttView';
import { ProcessMapView } from './views/ProcessMapView';
import { ActivityTableView } from './views/ActivityTableView';
import { ResponsiblesView } from './views/ResponsiblesView';
import { TrackingControlView } from './views/TrackingControlView';
import { ReportsView } from './views/ReportsView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { activeTab, notification, setNotification } = useProject();
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isQuickScheduleOpen, setIsQuickScheduleOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* Dark blue enterprise sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <TopBar
          onOpenNewActivity={() => setIsNewActivityOpen(true)}
          onOpenQuickSchedule={() => setIsQuickScheduleOpen(true)}
        />

        {/* Global Toast Notification */}
        {notification && (
          <div className="absolute top-18 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs border border-slate-700 animate-in slide-in-from-top-2 duration-150">
            {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {notification.type === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Viewport View Container */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'resumen' && (
              <OverviewView onOpenQuickSchedule={() => setIsQuickScheduleOpen(true)} />
            )}
            {activeTab === 'cronograma' && (
              <GanttView onOpenQuickSchedule={() => setIsQuickScheduleOpen(true)} />
            )}
            {activeTab === 'mapa' && (
              <ProcessMapView onOpenQuickSchedule={() => setIsQuickScheduleOpen(true)} />
            )}
            {activeTab === 'actividades' && (
              <ActivityTableView
                onOpenNewActivity={() => setIsNewActivityOpen(true)}
                onOpenQuickSchedule={() => setIsQuickScheduleOpen(true)}
              />
            )}
            {activeTab === 'responsables' && <ResponsiblesView />}
            {activeTab === 'seguimiento' && <TrackingControlView />}
            {activeTab === 'reportes' && <ReportsView />}
          </div>
        </main>
      </div>

      {/* Interactive Detail Edit Modal / Drawer */}
      <ActivityEditDrawer />

      {/* New Activity Modal */}
      <NewActivityModal
        isOpen={isNewActivityOpen}
        onClose={() => setIsNewActivityOpen(false)}
      />

      {/* Quick Schedule Assistant Modal */}
      <QuickScheduleModal
        isOpen={isQuickScheduleOpen}
        onClose={() => setIsQuickScheduleOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ProjectProvider>
      <DashboardContent />
    </ProjectProvider>
  );
}
