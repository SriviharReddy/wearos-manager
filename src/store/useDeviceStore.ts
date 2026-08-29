import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { AdbDevice, DeviceInfo, DeviceHistoryRecord, ViewType } from "@/types/adb";
import { useLogStore } from "./useLogStore";

interface DeviceStore {
  devices: AdbDevice[];
  activeSerial: string | null;
  deviceInfo: DeviceInfo | null;
  history: DeviceHistoryRecord[];
  currentView: ViewType;
  isLoading: boolean;
  isConnecting: boolean;
  statusMessage: string | null;

  setCurrentView: (view: ViewType) => void;
  setActiveSerial: (serial: string | null) => void;
  refreshDevices: () => Promise<void>;
  refreshDeviceInfo: () => Promise<void>;
  connect: (ip: string, port: number) => Promise<boolean>;
  disconnect: (ip: string, port?: number) => Promise<void>;
  pair: (ip: string, port: number, code: string) => Promise<boolean>;
  loadHistory: () => Promise<void>;
  clearHistory: () => Promise<void>;
  deleteHistoryEntry: (ip: string, port: number) => Promise<void>;
  restartAdb: () => Promise<void>;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  devices: [],
  activeSerial: null,
  deviceInfo: null,
  history: [],
  currentView: "dashboard",
  isLoading: false,
  isConnecting: false,
  statusMessage: null,

  setCurrentView: (view) => set({ currentView: view }),
  setActiveSerial: (serial) => {
    set({ activeSerial: serial });
    if (serial) {
      get().refreshDeviceInfo();
    } else {
      set({ deviceInfo: null });
    }
  },

  refreshDevices: async () => {
    try {
      const devices = await invoke<AdbDevice[]>("list_devices");
      set({ devices });

      const current = get().activeSerial;
      const exists = devices.some((d) => d.serial === current);

      if (!exists && devices.length > 0) {
        // Auto-select first available device
        get().setActiveSerial(devices[0].serial);
      } else if (devices.length === 0) {
        set({ activeSerial: null, deviceInfo: null });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to list devices: ${errMsg}`);
    }
  },

  refreshDeviceInfo: async () => {
    const serial = get().activeSerial;
    if (!serial) return;

    try {
      const info = await invoke<DeviceInfo>("fetch_device_info", { serial });
      set({ deviceInfo: info });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("warn", `Could not fetch device info: ${errMsg}`);
    }
  },

  connect: async (ip: string, port: number) => {
    set({ isConnecting: true });
    useLogStore.getState().addLog("info", `Connecting to ${ip}:${port}...`, "adb connect");
    try {
      const res = await invoke<string>("connect_device", { ip, port });
      useLogStore.getState().addLog("success", res);
      await get().refreshDevices();
      await get().loadHistory();
      set({ isConnecting: false });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Connection failed: ${errMsg}`);
      set({ isConnecting: false });
      return false;
    }
  },

  disconnect: async (ip: string, port?: number) => {
    useLogStore.getState().addLog("info", `Disconnecting from ${ip}...`, "adb disconnect");
    try {
      const res = await invoke<string>("disconnect_device", { ip, port });
      useLogStore.getState().addLog("info", res);
      await get().refreshDevices();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Disconnect error: ${errMsg}`);
    }
  },

  pair: async (ip: string, port: number, code: string) => {
    set({ isConnecting: true });
    useLogStore.getState().addLog("info", `Pairing with ${ip}:${port} (code: ${code})...`, "adb pair");
    try {
      const res = await invoke<string>("pair_device", { ip, port, code });
      useLogStore.getState().addLog("success", res);
      set({ isConnecting: false });
      return true;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Pairing failed: ${errMsg}`);
      set({ isConnecting: false });
      return false;
    }
  },

  loadHistory: async () => {
    try {
      const history = await invoke<DeviceHistoryRecord[]>("fetch_history");
      set({ history });
    } catch (err: unknown) {
      console.error("Failed to load history:", err);
    }
  },

  clearHistory: async () => {
    try {
      await invoke("clear_device_history");
      set({ history: [] });
      useLogStore.getState().addLog("info", "Connection history cleared.");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to clear history: ${errMsg}`);
    }
  },

  deleteHistoryEntry: async (ip: string, port: number) => {
    try {
      await invoke("delete_history_record", { ip, port });
      set((state) => ({
        history: state.history.filter((h) => !(h.ip === ip && h.port === port)),
      }));
    } catch (err: unknown) {
      console.error("Failed to delete history item:", err);
    }
  },

  restartAdb: async () => {
    useLogStore.getState().addLog("info", "Restarting ADB daemon...", "adb kill-server && adb start-server");
    try {
      await invoke("restart_adb");
      useLogStore.getState().addLog("success", "ADB daemon restarted.");
      await get().refreshDevices();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to restart ADB: ${errMsg}`);
    }
  },
}));
