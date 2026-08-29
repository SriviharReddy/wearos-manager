import React, { useEffect, useState } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useLogStore } from "@/store/useLogStore";
import { DisplaySettings, AudioVibrationSettings } from "@/types/adb";
import {
  Sliders,
  Clock,
  Type,
  Maximize,
  Volume2,
  Bell,
  Vibrate,
  RefreshCw,
} from "lucide-react";
import { clsx } from "clsx";

export const CustomizerView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);

  const [activeTab, setActiveTab] = useState<"display" | "audio" | "vibration">("display");
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings | null>(null);
  const [audioSettings, setAudioSettings] = useState<AudioVibrationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Editable local states
  const [customDpi, setCustomDpi] = useState<number>(320);
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [brightness, setBrightness] = useState<number>(128);

  useEffect(() => {
    if (activeSerial) {
      loadSettings();
    }
  }, [activeSerial]);

  const loadSettings = async () => {
    if (!activeSerial) return;
    setIsLoading(true);
    try {
      const disp = await invoke<DisplaySettings>("fetch_display_settings", { serial: activeSerial });
      setDisplaySettings(disp);
      setCustomDpi(disp.density_dpi);
      setFontScale(disp.font_scale);
      setBrightness(disp.brightness_level);

      const aud = await invoke<AudioVibrationSettings>("fetch_audio_vibration", { serial: activeSerial });
      setAudioSettings(aud);
      setIsLoading(false);
    } catch (err: unknown) {
      console.error("Failed to load settings:", err);
      setIsLoading(false);
    }
  };

  const handleSetTimeout = async (seconds: number) => {
    if (!activeSerial) return;
    try {
      await invoke("apply_screen_timeout", { serial: activeSerial, seconds });
      useLogStore.getState().addLog("success", `Screen timeout set to ${seconds}s`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to set timeout: ${msg}`);
    }
  };

  const handleApplyDpi = async (dpi: number) => {
    if (!activeSerial) return;
    try {
      await invoke("apply_density", { serial: activeSerial, dpi });
      useLogStore.getState().addLog("success", `Density updated to ${dpi} DPI`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to set density: ${msg}`);
    }
  };

  const handleResetDpi = async () => {
    if (!activeSerial) return;
    try {
      await invoke("restore_density", { serial: activeSerial });
      useLogStore.getState().addLog("success", "Density reset to default DPI");
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to reset density: ${msg}`);
    }
  };

  const handleApplyFontScale = async (scale: number) => {
    if (!activeSerial) return;
    try {
      await invoke("apply_font_scale", { serial: activeSerial, scale });
      useLogStore.getState().addLog("success", `Font scale set to ${scale}x`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to set font scale: ${msg}`);
    }
  };

  const handleToggleAod = async () => {
    if (!activeSerial || !displaySettings) return;
    const next = !displaySettings.aod_enabled;
    try {
      await invoke("apply_aod", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Always-On Display (AOD): ${next ? "Enabled" : "Disabled"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to toggle AOD: ${msg}`);
    }
  };

  const handleToggleAutoBrightness = async () => {
    if (!activeSerial || !displaySettings) return;
    const next = !displaySettings.auto_brightness_enabled;
    try {
      await invoke("apply_auto_brightness", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Auto Brightness: ${next ? "Enabled" : "Disabled"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to toggle auto brightness: ${msg}`);
    }
  };

  const handleToggleTheater = async () => {
    if (!activeSerial || !displaySettings) return;
    const next = !displaySettings.theater_mode_enabled;
    try {
      await invoke("apply_theater_mode", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Theater Mode: ${next ? "Enabled" : "Disabled"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to toggle theater mode: ${msg}`);
    }
  };

  const handleToggleDevOptions = async () => {
    if (!activeSerial || !displaySettings) return;
    const next = !displaySettings.dev_options_enabled;
    try {
      await invoke("apply_dev_options", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Developer Options: ${next ? "Visible" : "Hidden"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to toggle developer options: ${msg}`);
    }
  };

  const handleToggleRingtoneVib = async () => {
    if (!activeSerial || !audioSettings) return;
    const next = !audioSettings.ringtone_vibration;
    try {
      await invoke("apply_ringtone_vibration", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Call vibration: ${next ? "Enabled" : "Disabled"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Call vibration toggle failed: ${msg}`);
    }
  };

  const handleToggleNotifVib = async () => {
    if (!activeSerial || !audioSettings) return;
    const next = !audioSettings.notification_vibration;
    try {
      await invoke("apply_notification_vibration", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Notification vibration: ${next ? "Enabled" : "Disabled"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Notification vibration toggle failed: ${msg}`);
    }
  };

  const handleToggleHaptic = async () => {
    if (!activeSerial || !audioSettings) return;
    const next = !audioSettings.haptic_feedback;
    try {
      await invoke("apply_haptic_feedback", { serial: activeSerial, enabled: next });
      useLogStore.getState().addLog("info", `Haptic touch feedback: ${next ? "Enabled" : "Disabled"}`);
      loadSettings();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Haptic feedback toggle failed: ${msg}`);
    }
  };

  const handleUploadAudio = async (category: string) => {
    if (!activeSerial) return;
    try {
      const selected = await open({
        filters: [{ name: "Audio Files", extensions: ["mp3", "ogg", "wav", "m4a"] }],
      });
      if (selected && typeof selected === "string") {
        await invoke("send_audio_file", {
          serial: activeSerial,
          localPath: selected,
          category,
        });
        useLogStore.getState().addLog("success", `Uploaded ${category} audio: ${selected}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Audio upload error: ${msg}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            {t("customizer.title")}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("customizer.description")}
          </p>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => loadSettings()}
          isLoading={isLoading}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          {t("app.refresh")}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2.5">
        <button
          onClick={() => setActiveTab("display")}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "display"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
          )}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t("customizer.displayTab")}</span>
        </button>

        <button
          onClick={() => setActiveTab("audio")}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "audio"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
          )}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{t("customizer.audioTab")}</span>
        </button>

        <button
          onClick={() => setActiveTab("vibration")}
          className={clsx(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "vibration"
              ? "bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
          )}
        >
          <Vibrate className="w-3.5 h-3.5" />
          <span>{t("customizer.vibrationTab")}</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === "display" && (
        <div className="space-y-4">
          {/* Screen Timeout Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t("customizer.timeout")}</span>
            </div>
            <p className="text-xs text-zinc-400">
              {t("customizer.timeoutDesc")} Current:{" "}
              <strong className="text-zinc-200 font-mono">
                {displaySettings?.timeout_seconds ?? 15}s
              </strong>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[15, 30, 60, 300, 600, 1800].map((sec) => (
                <Button
                  key={sec}
                  size="sm"
                  variant={displaySettings?.timeout_seconds === sec ? "primary" : "secondary"}
                  onClick={() => handleSetTimeout(sec)}
                  disabled={!activeSerial}
                >
                  {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
                </Button>
              ))}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSetTimeout(86400)}
                disabled={!activeSerial}
              >
                Always On (24h)
              </Button>
            </div>
          </div>

          {/* Density (DPI) Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Maximize className="w-3.5 h-3.5 text-zinc-400" />
                <span>{t("customizer.density")}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetDpi}
                disabled={!activeSerial}
              >
                {t("customizer.resetDensity")} ({displaySettings?.default_density_dpi ?? 320})
              </Button>
            </div>
            <p className="text-xs text-zinc-400">
              {t("customizer.densityDesc")} Current:{" "}
              <strong className="text-zinc-200 font-mono">
                {displaySettings?.density_dpi ?? 320} DPI
              </strong>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {[280, 300, 320, 340, 360, 400].map((dpiVal) => (
                <Button
                  key={dpiVal}
                  size="sm"
                  variant={displaySettings?.density_dpi === dpiVal ? "primary" : "secondary"}
                  onClick={() => handleApplyDpi(dpiVal)}
                  disabled={!activeSerial}
                >
                  {dpiVal} DPI
                </Button>
              ))}
            </div>
          </div>

          {/* Font Scale Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Type className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t("customizer.fontScale")}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.8"
                max="1.5"
                step="0.05"
                value={fontScale}
                onChange={(e) => setFontScale(parseFloat(e.target.value))}
                className="flex-1 accent-zinc-200 cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold text-zinc-200 w-10 text-right">
                {fontScale.toFixed(2)}x
              </span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleApplyFontScale(fontScale)}
                disabled={!activeSerial}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Toggles Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  {t("customizer.aod")}
                </div>
                <div className="text-[11px] text-zinc-500">Keep watchface visible</div>
              </div>
              <input
                type="checkbox"
                checked={displaySettings?.aod_enabled ?? false}
                onChange={handleToggleAod}
                disabled={!activeSerial}
                className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  {t("customizer.autoBrightness")}
                </div>
                <div className="text-[11px] text-zinc-500">Ambient light sensor</div>
              </div>
              <input
                type="checkbox"
                checked={displaySettings?.auto_brightness_enabled ?? false}
                onChange={handleToggleAutoBrightness}
                disabled={!activeSerial}
                className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  {t("customizer.theaterMode")}
                </div>
                <div className="text-[11px] text-zinc-500">Silence screen and tilt-to-wake</div>
              </div>
              <input
                type="checkbox"
                checked={displaySettings?.theater_mode_enabled ?? false}
                onChange={handleToggleTheater}
                disabled={!activeSerial}
                className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
              />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  {t("customizer.devOptions")}
                </div>
                <div className="text-[11px] text-zinc-500">Show in watch settings</div>
              </div>
              <input
                type="checkbox"
                checked={displaySettings?.dev_options_enabled ?? false}
                onChange={handleToggleDevOptions}
                disabled={!activeSerial}
                className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Audio Tab */}
      {activeTab === "audio" && (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-zinc-200">
              {t("customizer.uploadAudio")}
            </h3>
            <p className="text-xs text-zinc-400">
              Upload MP3/OGG sound files to watch folders and register them in the system audio picker.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="secondary"
                className="h-20 flex-col gap-1.5"
                onClick={() => handleUploadAudio("ringtone")}
                disabled={!activeSerial}
              >
                <Bell className="w-4 h-4 text-zinc-300" />
                <span className="text-xs font-medium">Upload Ringtone</span>
                <span className="text-[10px] text-zinc-500">/sdcard/Ringtones</span>
              </Button>

              <Button
                variant="secondary"
                className="h-20 flex-col gap-1.5"
                onClick={() => handleUploadAudio("notification")}
                disabled={!activeSerial}
              >
                <Volume2 className="w-4 h-4 text-zinc-300" />
                <span className="text-xs font-medium">Upload Notification</span>
                <span className="text-[10px] text-zinc-500">/sdcard/Notifications</span>
              </Button>

              <Button
                variant="secondary"
                className="h-20 flex-col gap-1.5"
                onClick={() => handleUploadAudio("alarm")}
                disabled={!activeSerial}
              >
                <Clock className="w-4 h-4 text-zinc-300" />
                <span className="text-xs font-medium">Upload Alarm</span>
                <span className="text-[10px] text-zinc-500">/sdcard/Alarms</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vibration Tab */}
      {activeTab === "vibration" && (
        <div className="space-y-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-zinc-200">
              Vibration Management
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Vibrate className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">
                      {t("customizer.ringtoneVib")}
                    </div>
                    <div className="text-[11px] text-zinc-500">Vibrate during incoming call ring</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings?.ringtone_vibration ?? false}
                  onChange={handleToggleRingtoneVib}
                  disabled={!activeSerial}
                  className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">
                      {t("customizer.notifVib")}
                    </div>
                    <div className="text-[11px] text-zinc-500">Vibrate when notifications arrive</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings?.notification_vibration ?? false}
                  onChange={handleToggleNotifVib}
                  disabled={!activeSerial}
                  className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-zinc-400" />
                  <div>
                    <div className="text-xs font-medium text-zinc-200">
                      {t("customizer.hapticFeedback")}
                    </div>
                    <div className="text-[11px] text-zinc-500">Haptic vibration on touches and button presses</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={audioSettings?.haptic_feedback ?? false}
                  onChange={handleToggleHaptic}
                  disabled={!activeSerial}
                  className="w-4 h-4 rounded text-zinc-100 focus:ring-zinc-400 bg-zinc-950 border-zinc-700 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
