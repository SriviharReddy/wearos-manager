import React from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Wifi, Cpu, Shield } from "lucide-react";

export const StatusBar: React.FC = () => {
  const { t } = useTranslation();
  const { activeSerial, deviceInfo } = useDeviceStore();

  return (
    <footer className="h-6 bg-zinc-950 border-t border-zinc-800/80 px-4 flex items-center justify-between text-[11px] font-mono text-zinc-500 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              activeSerial ? "bg-emerald-500" : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-400">
            {activeSerial ? `${deviceInfo?.model || "Device"} (${activeSerial})` : t("app.noDevice")}
          </span>
        </div>

        {deviceInfo && (
          <>
            <div className="hidden sm:flex items-center gap-1 text-zinc-400">
              <Cpu className="w-3 h-3 text-zinc-400" />
              <span>Android {deviceInfo.android_version}</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-zinc-400">
              <Wifi className="w-3 h-3 text-zinc-400" />
              <span>{deviceInfo.ip_address || "Wi-Fi"}</span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 text-[10px]">
        <span className="text-zinc-600">WearOS Manager</span>
        <div className="flex items-center gap-1 text-zinc-400">
          <Shield className="w-3 h-3" />
          <span>ADB Mode</span>
        </div>
      </div>
    </footer>
  );
};
