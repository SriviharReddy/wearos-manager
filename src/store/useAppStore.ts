import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { PackageInfo, BundledApk, BackupMetadata } from "@/types/adb";
import { useDeviceStore } from "./useDeviceStore";
import { useLogStore } from "./useLogStore";

export interface SideloadQueueItem {
  id: string;
  name: string;
  filePath: string;
  sizeBytes: number;
  status: "pending" | "installing" | "success" | "error";
  errorMessage?: string;
}

interface AppStore {
  packages: PackageInfo[];
  bundledApks: BundledApk[];
  backups: BackupMetadata[];
  sideloadQueue: SideloadQueueItem[];
  activeFilter: string;
  searchTerm: string;
  isLoadingPackages: boolean;
  isLoadingBackups: boolean;
  isPerformingBackup: boolean;

  setFilter: (filter: string) => void;
  setSearchTerm: (term: string) => void;
  fetchPackages: () => Promise<void>;
  fetchBundledApks: () => Promise<void>;
  fetchBackups: () => Promise<void>;
  addToSideloadQueue: (files: { name: string; path: string; size: number }[]) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  installQueueItem: (id: string) => Promise<boolean>;
  installAllQueue: () => Promise<void>;
  installBundledApk: (apkPath: string) => Promise<boolean>;
  uninstallPackage: (packageName: string) => Promise<boolean>;
  togglePackageEnabled: (packageName: string, currentEnabled: boolean) => Promise<boolean>;
  clearPackageData: (packageName: string) => Promise<boolean>;
  launchPackage: (packageName: string) => Promise<boolean>;
  createBackup: (selectedPackages?: string[]) => Promise<boolean>;
  restoreBackup: (backupFolder: string, selectedPackages?: string[]) => Promise<boolean>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  packages: [],
  bundledApks: [],
  backups: [],
  sideloadQueue: [],
  activeFilter: "user",
  searchTerm: "",
  isLoadingPackages: false,
  isLoadingBackups: false,
  isPerformingBackup: false,

  setFilter: (filter) => {
    set({ activeFilter: filter });
    get().fetchPackages();
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  fetchPackages: async () => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return;

    set({ isLoadingPackages: true });
    try {
      const filter = get().activeFilter;
      const packages = await invoke<PackageInfo[]>("fetch_packages", {
        serial,
        filter,
      });
      set({ packages, isLoadingPackages: false });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to load packages: ${errMsg}`);
      set({ isLoadingPackages: false });
    }
  },

  fetchBundledApks: async () => {
    try {
      const bundledApks = await invoke<BundledApk[]>("fetch_bundled_apks");
      set({ bundledApks });
    } catch (err: unknown) {
      console.error("Failed to load bundled APKs:", err);
    }
  },

  fetchBackups: async () => {
    set({ isLoadingBackups: true });
    try {
      const backups = await invoke<BackupMetadata[]>("fetch_backups", {});
      set({ backups, isLoadingBackups: false });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to load backups: ${errMsg}`);
      set({ isLoadingBackups: false });
    }
  },

  addToSideloadQueue: (files) => {
    const newItems: SideloadQueueItem[] = files.map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: f.name,
      filePath: f.path,
      sizeBytes: f.size,
      status: "pending",
    }));

    set((state) => ({
      sideloadQueue: [...state.sideloadQueue, ...newItems],
    }));
  },

  removeFromQueue: (id) =>
    set((state) => ({
      sideloadQueue: state.sideloadQueue.filter((item) => item.id !== id),
    })),

  clearQueue: () => set({ sideloadQueue: [] }),

  installQueueItem: async (id) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    const item = get().sideloadQueue.find((i) => i.id === id);
    if (!item) return false;

    set((state) => ({
      sideloadQueue: state.sideloadQueue.map((i) =>
        i.id === id ? { ...i, status: "installing" } : i
      ),
    }));

    useLogStore
      .getState()
      .addLog("info", `Installing APK: ${item.name}...`, `adb install -r -g "${item.filePath}"`);

    try {
      await invoke("sideload_apk", { serial, apkPath: item.filePath });
      useLogStore.getState().addLog("success", `Successfully installed ${item.name}`);

      set((state) => ({
        sideloadQueue: state.sideloadQueue.map((i) =>
          i.id === id ? { ...i, status: "success" } : i
        ),
      }));
      get().fetchPackages();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to install ${item.name}: ${errMsg}`);

      set((state) => ({
        sideloadQueue: state.sideloadQueue.map((i) =>
          i.id === id ? { ...i, status: "error", errorMessage: errMsg } : i
        ),
      }));
      return false;
    }
  },

  installAllQueue: async () => {
    const queue = get().sideloadQueue.filter((i) => i.status === "pending" || i.status === "error");
    for (const item of queue) {
      await get().installQueueItem(item.id);
    }
  },

  installBundledApk: async (apkPath) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    useLogStore.getState().addLog("info", `Installing companion APK: ${apkPath}...`, "adb install");
    try {
      await invoke("sideload_apk", { serial, apkPath });
      useLogStore.getState().addLog("success", `Installed companion APK: ${apkPath}`);
      get().fetchPackages();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Installation failed: ${errMsg}`);
      return false;
    }
  },

  uninstallPackage: async (packageName) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    useLogStore
      .getState()
      .addLog("info", `Uninstalling package ${packageName}...`, `adb uninstall ${packageName}`);

    try {
      await invoke("uninstall_app", {
        serial,
        packageName,
        keepData: false,
      });
      useLogStore.getState().addLog("success", `Uninstalled ${packageName}`);
      get().fetchPackages();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to uninstall ${packageName}: ${errMsg}`);
      return false;
    }
  },

  togglePackageEnabled: async (packageName, currentEnabled) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    try {
      if (currentEnabled) {
        await invoke("disable_app", { serial, packageName });
        useLogStore.getState().addLog("info", `Disabled package ${packageName}`);
      } else {
        await invoke("enable_app", { serial, packageName });
        useLogStore.getState().addLog("info", `Enabled package ${packageName}`);
      }
      get().fetchPackages();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Toggle state failed for ${packageName}: ${errMsg}`);
      return false;
    }
  },

  clearPackageData: async (packageName) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    try {
      await invoke("clear_app_data", { serial, packageName });
      useLogStore.getState().addLog("success", `Cleared data and cache for ${packageName}`);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Clear data failed: ${errMsg}`);
      return false;
    }
  },

  launchPackage: async (packageName) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    try {
      await invoke("launch_app", { serial, packageName });
      useLogStore.getState().addLog("info", `Launched ${packageName} on watch screen`);
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to launch ${packageName}: ${errMsg}`);
      return false;
    }
  },

  createBackup: async (selectedPackages) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    set({ isPerformingBackup: true });
    useLogStore.getState().addLog("info", "Starting APK backup extraction...", "adb pull");

    try {
      const metadata = await invoke<BackupMetadata>("create_backup", {
        serial,
        targetPackages: selectedPackages,
        outputDir: null,
      });
      useLogStore
        .getState()
        .addLog("success", `Backup completed! ${metadata.app_count} apps saved to ${metadata.folder_name}`);
      set({ isPerformingBackup: false });
      get().fetchBackups();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Backup failed: ${errMsg}`);
      set({ isPerformingBackup: false });
      return false;
    }
  },

  restoreBackup: async (backupFolder, selectedPackages) => {
    const serial = useDeviceStore.getState().activeSerial;
    if (!serial) return false;

    useLogStore.getState().addLog("info", `Restoring apps from ${backupFolder}...`, "adb install");

    try {
      const restored = await invoke<string[]>("restore_backup_snapshot", {
        serial,
        backupFolder,
        selectedPackages,
      });
      useLogStore
        .getState()
        .addLog("success", `Restoration complete: ${restored.length} apps installed.`);
      get().fetchPackages();
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Restore failed: ${errMsg}`);
      return false;
    }
  },
}));
