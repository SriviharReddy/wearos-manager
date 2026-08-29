import React from "react";
import {
  LayoutDashboard,
  Wifi,
  Download,
  Trash2,
  Archive,
  Tv,
  Sliders,
  Zap,
  FolderOpen,
  Terminal,
  Watch,
} from "lucide-react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { ViewType } from "@/types/adb";
import { useTranslation } from "react-i18next";
import { clsx } from "clsx";

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const currentView = useDeviceStore((s) => s.currentView);
  const setCurrentView = useDeviceStore((s) => s.setCurrentView);
  const activeSerial = useDeviceStore((s) => s.activeSerial);
  const deviceInfo = useDeviceStore((s) => s.deviceInfo);

  const navItems: { id: ViewType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: "connect", label: t("nav.connect"), icon: Wifi },
    { id: "sideload", label: t("nav.sideload"), icon: Download },
    { id: "debloat", label: t("nav.debloat"), icon: Trash2 },
    { id: "backup", label: t("nav.backup"), icon: Archive },
    { id: "remote", label: t("nav.remote"), icon: Tv },
    { id: "customizer", label: t("nav.customizer"), icon: Sliders },
    { id: "optimizer", label: t("nav.optimizer"), icon: Zap },
    { id: "files", label: t("nav.files"), icon: FolderOpen },
    { id: "console", label: t("nav.console"), icon: Terminal },
  ];

  return (
    <aside className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-zinc-800/80">
          <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-xs text-zinc-100 tracking-tight">WearOS Manager</h1>
            <span className="text-[10px] text-zinc-400">Desktop Suite</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors text-left",
                  isActive
                    ? "bg-zinc-800 text-zinc-100 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                )}
              >
                <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-zinc-200" : "text-zinc-400")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Device connection status footer */}
      <div className="p-3 m-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "w-2 h-2 rounded-full shrink-0",
              activeSerial ? "bg-emerald-500" : "bg-zinc-600"
            )}
          />
          <span className="text-xs font-medium text-zinc-200 truncate">
            {activeSerial ? deviceInfo?.model || "Connected" : t("app.noDevice")}
          </span>
        </div>
        {activeSerial && (
          <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5">
            {activeSerial}
          </p>
        )}
      </div>
    </aside>
  );
};
