import { create } from "zustand";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  command?: string;
  message: string;
}

interface LogStore {
  logs: LogEntry[];
  isOpen: boolean;
  addLog: (level: LogEntry["level"], message: string, command?: string) => void;
  clearLogs: () => void;
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [
    {
      id: "init",
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: "WearOS Manager initialized.",
    },
  ],
  isOpen: false,
  addLog: (level, message, command) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toLocaleTimeString(),
          level,
          command,
          message,
        },
      ].slice(-200), // Keep last 200 logs
    })),
  clearLogs: () => set({ logs: [] }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),
}));
