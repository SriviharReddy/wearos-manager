import React, { useEffect, useState } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { invoke } from "@tauri-apps/api/core";
import { useLogStore } from "@/store/useLogStore";
import { AnimationScales } from "@/types/adb";
import {
  Zap,
  Gauge,
  Cpu,
  Trash2,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export const OptimizerView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);

  const [animScales, setAnimScales] = useState<AnimationScales | null>(null);
  const [isDexopting, setIsDexopting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);
  const [dexoptMessage, setDexoptMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeSerial) {
      loadAnimScales();
    }
  }, [activeSerial]);

  const loadAnimScales = async () => {
    if (!activeSerial) return;
    try {
      const scales = await invoke<AnimationScales>("fetch_animation_scales", { serial: activeSerial });
      setAnimScales(scales);
    } catch (err: unknown) {
      console.error(err);
    }
  };

  const handleSetAnimationScale = async (scale: number) => {
    if (!activeSerial) return;
    try {
      await invoke("apply_animation_scales", { serial: activeSerial, scale });
      useLogStore.getState().addLog("success", `Animation scale set to ${scale}x`);
      loadAnimScales();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to set animation scale: ${msg}`);
    }
  };

  const handleRunDexopt = async (mode: "speed-profile" | "everything") => {
    if (!activeSerial) return;
    setIsDexopting(true);
    setDexoptMessage(null);
    useLogStore
      .getState()
      .addLog("info", `Running ART Dexopt compilation (${mode})...`, `cmd package compile -m ${mode} -a`);

    try {
      const res = await invoke<string>("trigger_dexopt", {
        serial: activeSerial,
        mode,
        package: null,
      });
      useLogStore.getState().addLog("success", `Dexopt compilation finished: ${res}`);
      setDexoptMessage("ART Dexopt optimization completed successfully!");
      setIsDexopting(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Dexopt failed: ${msg}`);
      setIsDexopting(false);
    }
  };

  const handleClearCache = async () => {
    if (!activeSerial) return;
    setIsCleaning(true);
    setCleanMessage(null);
    useLogStore.getState().addLog("info", "Cleaning cache across apps...", "pm trim-caches");

    try {
      const count = await invoke<number>("trigger_clear_cache", { serial: activeSerial });
      useLogStore.getState().addLog("success", `Cleared cache for ${count} applications`);
      setCleanMessage(`Successfully cleaned cache for ${count} applications!`);
      setIsCleaning(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Cache cleanup failed: ${msg}`);
      setIsCleaning(false);
    }
  };

  const handleApplyWatchOptimizations = async () => {
    if (!activeSerial) return;
    setIsOptimizing(true);
    useLogStore.getState().addLog("info", "Applying Wear OS bloatware optimizations...", "pm disable-user");

    try {
      const disabled = await invoke<string[]>("trigger_watch_optimizations", { serial: activeSerial });
      useLogStore
        .getState()
        .addLog("success", `Disabled ${disabled.length} background telemetry packages`);
      setIsOptimizing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Optimization failed: ${msg}`);
      setIsOptimizing(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
          {t("optimizer.title")}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {t("optimizer.description")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Animation Speed Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Gauge className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("optimizer.animTitle")}</span>
          </div>
          <p className="text-xs text-zinc-400">
            {t("optimizer.animDesc")} Current:{" "}
            <strong className="text-zinc-200 font-mono">
              {animScales?.window_animation_scale ?? 1.0}x
            </strong>
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={animScales?.window_animation_scale === 1.0 ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSetAnimationScale(1.0)}
              disabled={!activeSerial}
            >
              {t("optimizer.animNormal")}
            </Button>
            <Button
              variant={animScales?.window_animation_scale === 0.5 ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSetAnimationScale(0.5)}
              disabled={!activeSerial}
            >
              {t("optimizer.animDouble")}
            </Button>
            <Button
              variant={animScales?.window_animation_scale === 0.25 ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSetAnimationScale(0.25)}
              disabled={!activeSerial}
            >
              {t("optimizer.animFast")}
            </Button>
            <Button
              variant={animScales?.window_animation_scale === 0.0 ? "primary" : "secondary"}
              size="sm"
              onClick={() => handleSetAnimationScale(0.0)}
              disabled={!activeSerial}
            >
              {t("optimizer.animOff")}
            </Button>
          </div>
        </div>

        {/* Cache Cleaner Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t("optimizer.cacheTitle")}</span>
            </div>
            <p className="text-xs text-zinc-400">
              {t("optimizer.cacheDesc")}
            </p>
          </div>

          {cleanMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{cleanMessage}</span>
            </div>
          )}

          <Button
            variant="secondary"
            onClick={handleClearCache}
            isLoading={isCleaning}
            disabled={!activeSerial}
            leftIcon={<Trash2 className="w-3.5 h-3.5 text-zinc-400" />}
          >
            {t("optimizer.cleanCacheBtn")}
          </Button>
        </div>

        {/* ART Dexopt Optimizer Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("optimizer.dexoptTitle")}</span>
          </div>
          <p className="text-xs text-zinc-400">
            {t("optimizer.dexoptDesc")}
          </p>

          {dexoptMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{dexoptMessage}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRunDexopt("speed-profile")}
              isLoading={isDexopting}
              disabled={!activeSerial}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              className="flex-1"
            >
              {t("optimizer.dexoptSpeed")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleRunDexopt("everything")}
              isLoading={isDexopting}
              disabled={!activeSerial}
              className="flex-1"
            >
              {t("optimizer.dexoptAll")}
            </Button>
          </div>
        </div>

        {/* OEM Bloat Optimizer Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>{t("optimizer.oemTweaks")}</span>
            </div>
            <p className="text-xs text-zinc-400">
              Disables unused background services (Bixby wakeup, retail loops, OEM analytics) to extend battery life.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={handleApplyWatchOptimizations}
            isLoading={isOptimizing}
            disabled={!activeSerial}
            leftIcon={<Zap className="w-3.5 h-3.5 text-zinc-400" />}
          >
            {t("optimizer.applyTweaks")}
          </Button>
        </div>
      </div>
    </div>
  );
};
