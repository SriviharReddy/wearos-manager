import React from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { BatteryGauge } from "@/components/watch/BatteryGauge";
import { DeviceCard } from "@/components/watch/DeviceCard";
import { Button } from "@/components/common/Button";
import { invoke } from "@tauri-apps/api/core";
import { useLogStore } from "@/store/useLogStore";
import {
  Tv,
  Camera,
  Download,
  Archive,
  RotateCw,
  AlertTriangle,
  WifiOff,
  Radio,
} from "lucide-react";

export const DashboardView: React.FC = () => {
  const { t } = useTranslation();
  const { activeSerial, deviceInfo, setCurrentView } = useDeviceStore();

  const handleReboot = async (mode: string) => {
    if (!activeSerial) return;
    if (!window.confirm(t("dashboard.rebootConfirm"))) return;

    useLogStore.getState().addLog("warn", `Triggering reboot: ${mode}...`, `adb reboot ${mode}`);
    try {
      await invoke("trigger_reboot", { serial: activeSerial, mode });
      useLogStore.getState().addLog("success", `Reboot command sent (${mode})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Reboot failed: ${msg}`);
    }
  };

  const handleMirror = async () => {
    if (!activeSerial) return;
    try {
      await invoke("start_screen_mirror", { serial: activeSerial });
      useLogStore.getState().addLog("success", "Launched scrcpy mirror");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Mirror failed: ${msg}`);
    }
  };

  if (!activeSerial || !deviceInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 mb-3 shadow-xs">
          <WifiOff className="w-10 h-10 text-zinc-500" />
        </div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
          {t("app.noDevice")}
        </h2>
        <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
          Connect your Wear OS watch over Wi-Fi, Bluetooth, or USB to start managing apps, debloating, and customizing.
        </p>
        <Button
          onClick={() => setCurrentView("connect")}
          variant="primary"
          leftIcon={<Radio className="w-3.5 h-3.5" />}
        >
          {t("connect.connectBtn")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Top Section: Device Card + Battery Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DeviceCard info={deviceInfo} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-xs">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
            {t("dashboard.battery")}
          </h3>
          <BatteryGauge
            level={deviceInfo.battery_level}
            status={deviceInfo.battery_status}
            temperature={deviceInfo.battery_temperature}
            isCharging={deviceInfo.battery_status.toLowerCase().includes("charg")}
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs">
        <h3 className="text-xs font-semibold text-zinc-200 mb-3">
          {t("dashboard.quickActions")}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <Button
            variant="secondary"
            className="h-14 flex-col gap-1 text-xs"
            onClick={handleMirror}
          >
            <Tv className="w-4 h-4 text-zinc-300" />
            <span>{t("dashboard.mirrorScreen")}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-14 flex-col gap-1 text-xs"
            onClick={() => setCurrentView("remote")}
          >
            <Camera className="w-4 h-4 text-zinc-300" />
            <span>{t("dashboard.takeScreenshot")}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-14 flex-col gap-1 text-xs"
            onClick={() => setCurrentView("sideload")}
          >
            <Download className="w-4 h-4 text-zinc-300" />
            <span>{t("dashboard.openSideload")}</span>
          </Button>

          <Button
            variant="secondary"
            className="h-14 flex-col gap-1 text-xs"
            onClick={() => setCurrentView("backup")}
          >
            <Archive className="w-4 h-4 text-zinc-300" />
            <span>{t("dashboard.backupApps")}</span>
          </Button>
        </div>

        {/* Reboot Modes */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">
            {t("dashboard.rebootWatch")}:
          </span>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RotateCw className="w-3 h-3" />}
            onClick={() => handleReboot("system")}
          >
            Normal
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<AlertTriangle className="w-3 h-3 text-amber-400" />}
            onClick={() => handleReboot("recovery")}
          >
            {t("dashboard.rebootRecovery")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<AlertTriangle className="w-3 h-3 text-red-400" />}
            onClick={() => handleReboot("bootloader")}
          >
            {t("dashboard.rebootBootloader")}
          </Button>
        </div>
      </div>
    </div>
  );
};
