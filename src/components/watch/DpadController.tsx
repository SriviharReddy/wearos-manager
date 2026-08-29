import React from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  ArrowLeft,
  Home,
  Power,
  Volume2,
  VolumeX,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useLogStore } from "@/store/useLogStore";
import { useTranslation } from "react-i18next";

export const DpadController: React.FC = () => {
  const { t } = useTranslation();
  const serial = useDeviceStore((s) => s.activeSerial);

  const sendKey = async (keycode: number, name: string) => {
    if (!serial) return;
    try {
      await invoke("send_remote_key", { serial, keycode });
      useLogStore.getState().addLog("info", `Key event: ${name} (code ${keycode})`, `input keyevent ${keycode}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to send key: ${msg}`);
    }
  };

  const btnBase =
    "p-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-300 hover:text-white border border-zinc-700/80 transition-all flex items-center justify-center shadow-xs active:scale-95";

  return (
    <div className="flex flex-col items-center select-none">
      {/* Top auxiliary keys (Power, Vol) */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => sendKey(26, "POWER")}
          className="px-2.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 active:scale-95 transition-all text-xs font-medium flex items-center gap-1.5"
          title={t("remote.powerKey")}
        >
          <Power className="w-3.5 h-3.5 text-red-400" />
          <span>{t("remote.powerKey")}</span>
        </button>

        <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-md border border-zinc-700">
          <button
            onClick={() => sendKey(24, "VOLUME_UP")}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Volume Up"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => sendKey(25, "VOLUME_DOWN")}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Volume Down"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* D-Pad cross grid */}
      <div className="grid grid-cols-3 gap-2 w-48 h-48 p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-800 shadow-inner">
        {/* Row 1 */}
        <div />
        <button
          onClick={() => sendKey(19, "DPAD_UP")}
          className={btnBase}
          title="Up"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
        <div />

        {/* Row 2 */}
        <button
          onClick={() => sendKey(21, "DPAD_LEFT")}
          className={btnBase}
          title="Left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => sendKey(23, "DPAD_CENTER")}
          className="p-2.5 rounded-lg bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 text-zinc-100 border border-zinc-600 transition-all flex items-center justify-center font-medium text-xs active:scale-95"
          title={t("remote.centerKey")}
        >
          <Circle className="w-4 h-4 fill-current" />
        </button>
        <button
          onClick={() => sendKey(22, "DPAD_RIGHT")}
          className={btnBase}
          title="Right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Row 3 */}
        <div />
        <button
          onClick={() => sendKey(20, "DPAD_DOWN")}
          className={btnBase}
          title="Down"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
        <div />
      </div>

      {/* Bottom navigation keys (Back, Home) */}
      <div className="flex items-center gap-4 mt-3">
        <button
          onClick={() => sendKey(4, "BACK")}
          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white border border-zinc-700 transition-all text-xs font-medium flex items-center gap-1.5"
          title={t("remote.backKey")}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("remote.backKey")}</span>
        </button>

        <button
          onClick={() => sendKey(3, "HOME")}
          className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-300 hover:text-white border border-zinc-700 transition-all text-xs font-medium flex items-center gap-1.5"
          title={t("remote.homeKey")}
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t("remote.homeKey")}</span>
        </button>
      </div>
    </div>
  );
};
