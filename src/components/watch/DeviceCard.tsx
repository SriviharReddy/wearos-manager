import React from "react";
import { DeviceInfo } from "@/types/adb";
import { Watch, Wifi, Cpu, Layers, Maximize, Hash } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DeviceCardProps {
  info: DeviceInfo;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ info }) => {
  const { t } = useTranslation();

  const details = [
    {
      label: t("dashboard.osVersion"),
      value: `Android ${info.android_version} (API ${info.sdk_level})`,
      icon: Cpu,
    },
    {
      label: t("dashboard.wearVersion"),
      value: info.wearos_version || "Wear OS 5.0",
      icon: Layers,
    },
    {
      label: t("dashboard.screen"),
      value: `${info.resolution} (${info.density} DPI)`,
      icon: Maximize,
    },
    {
      label: t("dashboard.ipAddress"),
      value: info.ip_address || "Wi-Fi Connected",
      icon: Wifi,
    },
    {
      label: t("dashboard.serial"),
      value: info.serial,
      icon: Hash,
    },
    {
      label: t("dashboard.build"),
      value: info.build_number,
      icon: Watch,
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3.5 border-b border-zinc-800">
        <div className="p-2.5 bg-zinc-800 border border-zinc-700/80 rounded-lg text-zinc-100">
          <Watch className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-zinc-100 tracking-tight">
              {info.manufacturer} {info.model}
            </h2>
            <span className="inline-flex items-center px-2 py-0.2 rounded text-[10px] font-medium bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              Online
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Connected via ADB
          </p>
        </div>
      </div>

      {/* Grid Specs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-3">
        {details.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs mb-1">
                <Icon className="w-3 h-3 text-zinc-400" />
                <span>{item.label}</span>
              </div>
              <span className="font-medium text-zinc-200 text-xs truncate">
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
