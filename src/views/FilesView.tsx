import React, { useEffect, useState } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useLogStore } from "@/store/useLogStore";
import { FileEntry } from "@/types/adb";
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  FolderPlus,
  RefreshCw,
  Home,
  Music,
  Image as ImageIcon,
  ArrowUp,
} from "lucide-react";
import { clsx } from "clsx";

export const FilesView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);

  const [currentPath, setCurrentPath] = useState<string>("/sdcard");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newFolderOpen, setNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [deleteTarget, setDeleteTarget] = useState<FileEntry | null>(null);

  useEffect(() => {
    if (activeSerial) {
      loadFiles(currentPath);
    }
  }, [activeSerial, currentPath]);

  const loadFiles = async (path: string) => {
    if (!activeSerial) return;
    setIsLoading(true);
    try {
      const res = await invoke<FileEntry[]>("fetch_remote_files", {
        serial: activeSerial,
        path,
      });
      setFiles(res);
      setIsLoading(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to list files: ${msg}`);
      setIsLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
  };

  const handleGoUp = () => {
    if (currentPath === "/" || currentPath === "/sdcard") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parent = "/" + parts.join("/");
    setCurrentPath(parent || "/sdcard");
  };

  const handleUploadFile = async () => {
    if (!activeSerial) return;
    try {
      const selected = await open({ multiple: false });
      if (selected && typeof selected === "string") {
        const fileName = selected.split(/[/\\]/).pop() || "uploaded_file";
        const remoteDest = `${currentPath}/${fileName}`;

        useLogStore.getState().addLog("info", `Uploading ${fileName} to ${remoteDest}...`, "adb push");
        await invoke("upload_file_to_watch", {
          serial: activeSerial,
          localPath: selected,
          remotePath: remoteDest,
        });

        useLogStore.getState().addLog("success", `File uploaded to ${remoteDest}`);
        loadFiles(currentPath);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Upload failed: ${msg}`);
    }
  };

  const handleDownloadFile = async (entry: FileEntry) => {
    if (!activeSerial) return;
    try {
      const dest = await save({
        defaultPath: entry.name,
      });

      if (dest) {
        useLogStore.getState().addLog("info", `Downloading ${entry.path} to ${dest}...`, "adb pull");
        await invoke("download_file_from_watch", {
          serial: activeSerial,
          remotePath: entry.path,
          localPath: dest,
        });

        useLogStore.getState().addLog("success", `Downloaded to ${dest}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Download failed: ${msg}`);
    }
  };

  const handleDelete = async () => {
    if (!activeSerial || !deleteTarget) return;
    try {
      await invoke("remove_remote_file", {
        serial: activeSerial,
        remotePath: deleteTarget.path,
      });
      useLogStore.getState().addLog("success", `Deleted ${deleteTarget.path}`);
      setDeleteTarget(null);
      loadFiles(currentPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Delete failed: ${msg}`);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSerial || !newFolderName.trim()) return;

    const newPath = `${currentPath}/${newFolderName.trim()}`;
    try {
      await invoke("create_remote_folder", {
        serial: activeSerial,
        remotePath: newPath,
      });
      useLogStore.getState().addLog("success", `Created directory ${newPath}`);
      setNewFolderName("");
      setNewFolderOpen(false);
      loadFiles(currentPath);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to create folder: ${msg}`);
    }
  };

  const pathParts = currentPath.split("/").filter(Boolean);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4 flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            {t("files.title")}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("files.description")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setNewFolderOpen(true)}
            disabled={!activeSerial}
            leftIcon={<FolderPlus className="w-3.5 h-3.5" />}
          >
            {t("files.newFolderBtn")}
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={handleUploadFile}
            disabled={!activeSerial}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            {t("files.uploadBtn")}
          </Button>
        </div>
      </div>

      {/* Quick Location Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => handleNavigate("/sdcard")}
          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-zinc-400" />
          <span>Storage (/sdcard)</span>
        </button>

        <button
          onClick={() => handleNavigate("/sdcard/Download")}
          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Downloads</span>
        </button>

        <button
          onClick={() => handleNavigate("/sdcard/Pictures")}
          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
          <span>Pictures</span>
        </button>

        <button
          onClick={() => handleNavigate("/sdcard/Music")}
          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center gap-1.5 shrink-0 transition-colors"
        >
          <Music className="w-3.5 h-3.5 text-zinc-400" />
          <span>Music</span>
        </button>
      </div>

      {/* Navigation Breadcrumb Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs font-mono overflow-x-auto">
          <button
            onClick={handleGoUp}
            disabled={currentPath === "/sdcard"}
            className="p-1 rounded hover:bg-zinc-800 disabled:opacity-40 text-zinc-400"
            title="Up one folder"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>

          <span className="text-zinc-600">/</span>
          {pathParts.map((part, idx) => {
            const pathUpToHere = "/" + pathParts.slice(0, idx + 1).join("/");
            return (
              <React.Fragment key={idx}>
                <button
                  onClick={() => handleNavigate(pathUpToHere)}
                  className="hover:text-zinc-100 text-zinc-400 px-1 py-0.5 rounded transition-colors"
                >
                  {part}
                </button>
                {idx < pathParts.length - 1 && <span className="text-zinc-600">/</span>}
              </React.Fragment>
            );
          })}
        </div>

        <button
          onClick={() => loadFiles(currentPath)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-200"
          title={t("files.refreshBtn")}
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Files Table / List */}
      <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <div className="text-xs text-zinc-500 italic py-16 text-center">
              {isLoading ? "Loading directory..." : t("files.emptyFolder")}
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {files.map((file) => (
                <div
                  key={file.path}
                  onDoubleClick={() => file.is_dir && handleNavigate(file.path)}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-zinc-800/40 transition-colors select-none group"
                >
                  <div
                    onClick={() => file.is_dir && handleNavigate(file.path)}
                    className={clsx(
                      "flex items-center gap-2.5 flex-1 min-w-0",
                      file.is_dir && "cursor-pointer"
                    )}
                  >
                    {file.is_dir ? (
                      <Folder className="w-4 h-4 text-zinc-300 fill-zinc-700 shrink-0" />
                    ) : (
                      <File className="w-4 h-4 text-zinc-500 shrink-0" />
                    )}

                    <div className="truncate">
                      <span className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">
                        {file.name}
                      </span>
                      <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-mono mt-0.5">
                        <span>{file.permissions}</span>
                        {!file.is_dir && (
                          <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
                        )}
                        <span>{file.modified}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    {!file.is_dir && (
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                        title={t("files.download")}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(file)}
                      className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                      title={t("files.delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      <Modal
        isOpen={newFolderOpen}
        onClose={() => setNewFolderOpen(false)}
        title={t("files.newFolderBtn")}
      >
        <form onSubmit={handleCreateFolder} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Folder Name
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New Folder"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setNewFolderOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Deletion"
      >
        <div className="space-y-3.5">
          <p className="text-xs text-zinc-300">
            {t("files.confirmDelete", { name: deleteTarget?.name })}
          </p>
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
