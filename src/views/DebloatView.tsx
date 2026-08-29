import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { invoke } from "@tauri-apps/api/core";
import { useLogStore } from "@/store/useLogStore";
import {
  Trash2,
  Search,
  RefreshCw,
  Play,
  ToggleLeft,
  ToggleRight,
  Eraser,
  ShieldAlert,
  ExternalLink,
  Package,
  Layers,
  Store,
  FolderDown,
  EyeOff,
} from "lucide-react";
import { clsx } from "clsx";

export const DebloatView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);
  const {
    packages,
    activeFilter,
    setFilter,
    searchTerm,
    setSearchTerm,
    fetchPackages,
    isLoadingPackages,
    uninstallPackage,
    togglePackageEnabled,
    clearPackageData,
    launchPackage,
  } = useAppStore();

  const [confirmPkg, setConfirmPkg] = useState<string | null>(null);

  useEffect(() => {
    if (activeSerial) {
      fetchPackages();
    }
  }, [activeSerial]);

  const handleLaunchUad = async () => {
    try {
      await invoke("launch_uad");
      useLogStore.getState().addLog("success", "Launched Universal Android Debloater (UAD-NG)");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to launch UAD: ${msg}`);
    }
  };

  const filteredPackages = packages.filter((pkg) =>
    pkg.package_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filters = [
    { id: "user", label: t("debloat.filterUser"), icon: Package },
    { id: "playstore", label: t("debloat.filterPlayStore"), icon: Store },
    { id: "sideloaded", label: t("debloat.filterSideloaded"), icon: FolderDown },
    { id: "system", label: t("debloat.filterSystem"), icon: Layers },
    { id: "hidden", label: t("debloat.filterHidden"), icon: EyeOff },
    { id: "all", label: t("debloat.filterAll"), icon: Package },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header & UAD button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            {t("debloat.title")}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("debloat.description")}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleLaunchUad}
          leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
        >
          {t("debloat.launchUad")}
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-xs space-y-2.5">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1 border-b border-zinc-800 pb-2.5">
          {filters.map((f) => {
            const Icon = f.icon;
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  isActive
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("debloat.searchPlaceholder")}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => fetchPackages()}
            isLoading={isLoadingPackages}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            {t("app.refresh")}
          </Button>
        </div>
      </div>

      {/* Package List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 shadow-xs">
        <div className="text-xs text-zinc-400 mb-2.5 font-medium">
          Showing {filteredPackages.length} packages
        </div>

        {filteredPackages.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-8 text-center">
            {isLoadingPackages ? "Loading packages from watch..." : "No packages found."}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredPackages.map((pkg) => (
              <div
                key={pkg.package_name}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={clsx(
                      "p-1.5 rounded-md text-xs font-semibold",
                      pkg.is_enabled
                        ? "bg-zinc-800 text-zinc-200 border border-zinc-700"
                        : "bg-zinc-900 text-zinc-600 border border-zinc-800"
                    )}
                  >
                    <Package className="w-3.5 h-3.5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-zinc-200">
                        {pkg.package_name}
                      </span>
                      {pkg.is_system && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                          System
                        </span>
                      )}
                      {pkg.is_play_store && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700">
                          Play Store
                        </span>
                      )}
                      {!pkg.is_enabled && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-red-950/80 text-red-400 border border-red-800/60">
                          Disabled
                        </span>
                      )}
                    </div>
                    {pkg.apk_path && (
                      <p className="text-[10px] font-mono text-zinc-500 truncate max-w-lg mt-0.5">
                        {pkg.apk_path}
                      </p>
                    )}
                  </div>
                </div>

                {/* App Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => launchPackage(pkg.package_name)}
                    className="p-1.5 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
                    title={t("debloat.launch")}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() =>
                      togglePackageEnabled(pkg.package_name, pkg.is_enabled)
                    }
                    className="p-1.5 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors"
                    title={pkg.is_enabled ? t("debloat.disable") : t("debloat.enable")}
                  >
                    {pkg.is_enabled ? (
                      <ToggleRight className="w-4 h-4 text-zinc-200" />
                    ) : (
                      <ToggleLeft className="w-4 h-4 text-zinc-600" />
                    )}
                  </button>

                  <button
                    onClick={() => clearPackageData(pkg.package_name)}
                    className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title={t("debloat.clearData")}
                  >
                    <Eraser className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmPkg(pkg.package_name)}
                    className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title={t("debloat.uninstall")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmPkg !== null}
        onClose={() => setConfirmPkg(null)}
        title="Confirm App Uninstallation"
      >
        <div className="space-y-3.5">
          <div className="flex items-center gap-2.5 p-3 bg-red-950/30 border border-red-900/40 rounded-lg text-red-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>
              {t("debloat.confirmUninstall", { package: confirmPkg })}
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="secondary"
              onClick={() => setConfirmPkg(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                if (confirmPkg) {
                  await uninstallPackage(confirmPkg);
                  setConfirmPkg(null);
                }
              }}
            >
              {t("debloat.uninstall")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
