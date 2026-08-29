import React, { useEffect } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatusBar } from "@/components/layout/StatusBar";
import { LogDrawer } from "@/components/common/LogDrawer";

// Views
import { DashboardView } from "@/views/DashboardView";
import { ConnectView } from "@/views/ConnectView";
import { SideloadView } from "@/views/SideloadView";
import { DebloatView } from "@/views/DebloatView";
import { BackupView } from "@/views/BackupView";
import { RemoteMirrorView } from "@/views/RemoteMirrorView";
import { CustomizerView } from "@/views/CustomizerView";
import { OptimizerView } from "@/views/OptimizerView";
import { FilesView } from "@/views/FilesView";
import { ConsoleView } from "@/views/ConsoleView";

export const App: React.FC = () => {
  const { currentView, refreshDevices, loadHistory } = useDeviceStore();

  useEffect(() => {
    refreshDevices();
    loadHistory();

    // Auto-poll devices periodically
    const interval = setInterval(() => {
      refreshDevices();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView />;
      case "connect":
        return <ConnectView />;
      case "sideload":
        return <SideloadView />;
      case "debloat":
        return <DebloatView />;
      case "backup":
        return <BackupView />;
      case "remote":
        return <RemoteMirrorView />;
      case "customizer":
        return <CustomizerView />;
      case "optimizer":
        return <OptimizerView />;
      case "files":
        return <FilesView />;
      case "console":
        return <ConsoleView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden flex flex-col bg-zinc-950/70">
          {renderView()}
        </main>
        <LogDrawer />
        <StatusBar />
      </div>
    </div>
  );
};

export default App;
