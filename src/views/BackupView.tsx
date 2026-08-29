import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { BackupMetadata } from "@/types/adb";
import {
  Archive,
  RefreshCw,
  FolderArchive,
  Layers,
  ArrowUpRight,
  HardDrive,
} from "lucide-react";
import { clsx } from "clsx";

export const BackupView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);
  const {
    backups,
    fetchBackups,
    isLoadingBackups,
    isPerformingBackup,
    createBackup,
    restoreBackup,
  } = useAppStore();

  const [selectedSnapshot, setSelectedSnapshot] = useState<BackupMetadata | null>(null);
  const [selectedPkgs, setSelectedPkgs] = useState<string[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleSelectSnapshot = (snap: BackupMetadata) => {
    setSelectedSnapshot(snap);
    setSelectedPkgs(snap.packages);
  };

  const handleTogglePkg = (pkg: string) => {
    setSelectedPkgs((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    );
  };

  const handleRestore = async (full: boolean) => {
    if (!selectedSnapshot || !activeSerial) return;
    setIsRestoring(true);
    const pkgsToRestore = full ? undefined : selectedPkgs;
    await restoreBackup(selectedSnapshot.folder_path, pkgsToRestore);
    setIsRestoring(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            {t("backup.title")}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("backup.description")}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => createBackup()}
          isLoading={isPerformingBackup}
          disabled={!activeSerial}
          leftIcon={<Archive className="w-3.5 h-3.5" />}
        >
          {t("backup.backupAllBtn")}
        </Button>
      </div>

      {/* Main Grid: Snapshots List & Snapshot Detail / Restore */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Snapshots List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200">
              {t("backup.snapshotsTitle")} ({backups.length})
            </h3>
            <button
              onClick={() => fetchBackups()}
              className="p-1 rounded text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className={clsx("w-3.5 h-3.5", isLoadingBackups && "animate-spin")} />
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="text-xs text-zinc-500 italic py-8 text-center bg-zinc-950/40 rounded-lg border border-zinc-800/60">
              {t("backup.snapshotsEmpty")}
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {backups.map((snap) => {
                const isSelected = selectedSnapshot?.id === snap.id;
                return (
                  <div
                    key={snap.id}
                    onClick={() => handleSelectSnapshot(snap)}
                    className={clsx(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      isSelected
                        ? "bg-zinc-800 border-zinc-700 shadow-xs"
                        : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-750"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={clsx(
                          "p-1.5 rounded-md shrink-0",
                          isSelected
                            ? "bg-zinc-700 text-zinc-100"
                            : "bg-zinc-800 text-zinc-400"
                        )}
                      >
                        <FolderArchive className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-zinc-200 truncate">
                          {snap.folder_name}
                        </h4>
                        <div className="flex items-center gap-2.5 text-[11px] text-zinc-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-zinc-400" />
                            {t("backup.appsCount", { count: snap.app_count })}
                          </span>
                          <span className="flex items-center gap-1">
                            <HardDrive className="w-3 h-3 text-zinc-500" />
                            {(snap.size_bytes / (1024 * 1024)).toFixed(1)} MB
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Snapshot Package Detail & Restore */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          {selectedSnapshot ? (
            <>
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-100">
                      {selectedSnapshot.folder_name}
                    </h3>
                    <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Path: {selectedSnapshot.folder_path}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRestore(false)}
                      isLoading={isRestoring}
                      disabled={!activeSerial || selectedPkgs.length === 0}
                    >
                      {t("backup.restoreSelected")} ({selectedPkgs.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleRestore(true)}
                      isLoading={isRestoring}
                      disabled={!activeSerial}
                      leftIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                    >
                      {t("backup.restoreAll")}
                    </Button>
                  </div>
                </div>

                {/* Package Checkboxes */}
                <div className="mt-3 space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                  {selectedSnapshot.packages.map((pkg) => {
                    const isChecked = selectedPkgs.includes(pkg);
                    return (
                      <div
                        key={pkg}
                        onClick={() => handleTogglePkg(pkg)}
                        className={clsx(
                          "flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors",
                          isChecked
                            ? "bg-zinc-800/80 border-zinc-700"
                            : "bg-zinc-950/40 border-zinc-800/60 opacity-60 hover:opacity-100"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded border-zinc-700 text-zinc-100 focus:ring-zinc-400 bg-zinc-900"
                        />
                        <span className="text-xs font-mono font-medium text-zinc-300 truncate">
                          {pkg}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-zinc-500">
              <Archive className="w-10 h-10 stroke-1 text-zinc-600 mb-2" />
              <p className="text-xs">
                Select a backup snapshot from the left list to view apps and restore them.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
