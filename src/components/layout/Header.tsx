import React, { useState } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useLogStore } from "@/store/useLogStore";
import { changeLanguage } from "@/i18n/config";
import { useTranslation } from "react-i18next";
import { RefreshCw, Terminal, Globe, Zap, HelpCircle } from "lucide-react";
import { AboutModal } from "@/components/common/AboutModal";
import { clsx } from "clsx";

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { devices, activeSerial, setActiveSerial, refreshDevices, restartAdb, deviceInfo } =
    useDeviceStore();
  const { toggleOpen, isOpen } = useLogStore();
  const [aboutOpen, setAboutOpen] = useState(false);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value as "en" | "es");
  };

  return (
    <>
      <header className="h-12 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-5 shrink-0 select-none">
        {/* Left: Device selector */}
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-medium text-zinc-400">Device:</label>
          {devices.length > 0 ? (
            <select
              value={activeSerial || ""}
              onChange={(e) => setActiveSerial(e.target.value || null)}
              className="bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 rounded-md px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-zinc-400 max-w-xs truncate"
            >
              {devices.map((d) => (
                <option key={d.serial} value={d.serial}>
                  {d.model || d.serial} ({d.serial})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-zinc-500 italic">{t("app.noDevice")}</span>
          )}

          <button
            onClick={() => refreshDevices()}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title={t("app.refresh")}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Actions & Indicators */}
        <div className="flex items-center gap-2.5">
          {/* Battery pill if connected */}
          {deviceInfo && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300">
              <Zap
                className={clsx(
                  "w-3 h-3",
                  deviceInfo.battery_level > 50
                    ? "text-emerald-400"
                    : deviceInfo.battery_level > 20
                    ? "text-amber-400"
                    : "text-rose-400"
                )}
              />
              <span>{deviceInfo.battery_level}%</span>
            </div>
          )}

          {/* Restart ADB */}
          <button
            onClick={() => restartAdb()}
            className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
            title="Restart ADB daemon"
          >
            {t("app.restartAdb")}
          </button>

          {/* Language selector */}
          <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1">
            <Globe className="w-3 h-3 text-zinc-400" />
            <select
              value={i18n.language.startsWith("es") ? "es" : "en"}
              onChange={handleLanguageChange}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-zinc-800 text-white">English</option>
              <option value="es" className="bg-zinc-800 text-white">Español</option>
            </select>
          </div>

          {/* Toggle Console Drawer */}
          <button
            onClick={() => toggleOpen()}
            className={clsx(
              "px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 text-xs font-medium",
              isOpen
                ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-medium"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border-zinc-700"
            )}
            title="Toggle ADB Console"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{t("app.terminal")}</span>
          </button>

          {/* About Modal Trigger */}
          <button
            onClick={() => setAboutOpen(true)}
            className="p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="About WearOS Manager"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* About Modal Dialog */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
};
