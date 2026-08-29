import React, { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { open } from "@tauri-apps/plugin-dialog";
import {
  Upload,
  FileCode,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Download,
  Package,
} from "lucide-react";
import { clsx } from "clsx";

export const SideloadView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);
  const {
    sideloadQueue,
    bundledApks,
    fetchBundledApks,
    addToSideloadQueue,
    removeFromQueue,
    clearQueue,
    installQueueItem,
    installAllQueue,
    installBundledApk,
  } = useAppStore();

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchBundledApks();
  }, []);

  const handleBrowseFiles = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [{ name: "Android Application Package", extensions: ["apk"] }],
      });

      if (selected) {
        const filePaths = Array.isArray(selected) ? selected : [selected];
        const newFiles = filePaths.map((p) => {
          const name = p.split(/[/\\]/).pop() || "app.apk";
          return { name, path: p, size: 0 };
        });
        addToSideloadQueue(newFiles);
      }
    } catch (err: unknown) {
      console.error("File dialog error:", err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      const files: { name: string; path: string; size: number }[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const f = e.dataTransfer.files[i];
        if (f.name.endsWith(".apk")) {
          const filePath = "path" in f && typeof f.path === "string" ? f.path : f.name;
          files.push({ name: f.name, path: filePath, size: f.size });
        }
      }
      if (files.length > 0) {
        addToSideloadQueue(files);
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
          {t("sideload.title")}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {t("sideload.description")}
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseFiles}
        className={clsx(
          "border border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all",
          isDragging
            ? "border-zinc-400 bg-zinc-800/40"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900"
        )}
      >
        <div className="p-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 mb-2">
          <Upload className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-semibold text-zinc-200">
          {t("sideload.dropzoneText")}
        </h3>
        <p className="text-[11px] text-zinc-500 mt-0.5 mb-3">
          Single or batch APK installation (*.apk)
        </p>
        <Button variant="secondary" size="sm" leftIcon={<FileCode className="w-3.5 h-3.5" />}>
          {t("sideload.browseBtn")}
        </Button>
      </div>

      {/* Queue Section */}
      {sideloadQueue.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200">
                {t("sideload.queueTitle")} ({sideloadQueue.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => installAllQueue()}
                disabled={!activeSerial}
              >
                {t("sideload.installAll")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => clearQueue()}
                leftIcon={<Trash2 className="w-3 h-3" />}
              >
                {t("sideload.clearQueue")}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {sideloadQueue.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200 truncate max-w-sm">
                      {item.name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate max-w-xs">
                      {item.filePath}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {item.status === "pending" && (
                    <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                      <Clock className="w-3 h-3" />
                      {t("sideload.statusPending")}
                    </span>
                  )}
                  {item.status === "installing" && (
                    <span className="flex items-center gap-1 text-[11px] text-blue-400 animate-pulse">
                      <Download className="w-3 h-3" />
                      {t("sideload.statusInstalling")}
                    </span>
                  )}
                  {item.status === "success" && (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      {t("sideload.statusSuccess")}
                    </span>
                  )}
                  {item.status === "error" && (
                    <span
                      className="flex items-center gap-1 text-[11px] text-red-400 truncate max-w-xs"
                      title={item.errorMessage}
                    >
                      <XCircle className="w-3 h-3" />
                      {item.errorMessage || t("sideload.statusFailed")}
                    </span>
                  )}

                  {item.status === "pending" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => installQueueItem(item.id)}
                      disabled={!activeSerial}
                    >
                      {t("sideload.installBtn")}
                    </Button>
                  )}

                  <button
                    onClick={() => removeFromQueue(item.id)}
                    className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bundled Companion APKs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200">
            {t("sideload.bundledTitle")}
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            {t("sideload.bundledDesc")}
          </p>
        </div>

        {bundledApks.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-4 text-center">
            No companion APKs found in Sideload_apks directory.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {bundledApks.map((apk) => (
              <div
                key={apk.file_name}
                className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="p-2 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-300 shrink-0">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-zinc-200">
                      {apk.name}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-400 truncate max-w-xs mt-0.5">
                      {apk.file_name}
                    </p>
                    <span className="text-[10px] text-zinc-500">
                      {(apk.size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => installBundledApk(apk.path)}
                  disabled={!activeSerial}
                  leftIcon={<Download className="w-3 h-3" />}
                  className="w-full"
                >
                  {t("sideload.installBtn")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
