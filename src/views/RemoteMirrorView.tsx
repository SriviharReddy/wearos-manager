import React, { useState } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { DpadController } from "@/components/watch/DpadController";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { useLogStore } from "@/store/useLogStore";
import {
  Tv,
  Camera,
  Download,
  Copy,
  Check,
  Send,
  ExternalLink,
  Keyboard,
} from "lucide-react";

export const RemoteMirrorView: React.FC = () => {
  const { t } = useTranslation();
  const activeSerial = useDeviceStore((s) => s.activeSerial);

  const [screenshotData, setScreenshotData] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isSendingText, setIsSendingText] = useState(false);

  const handleLaunchMirror = async () => {
    if (!activeSerial) return;
    try {
      await invoke("start_screen_mirror", { serial: activeSerial });
      useLogStore.getState().addLog("success", "Launched scrcpy watch mirror");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to launch scrcpy: ${msg}`);
    }
  };

  const handleCaptureScreenshot = async () => {
    if (!activeSerial) return;
    setIsCapturing(true);
    useLogStore.getState().addLog("info", "Capturing watch screenshot...", "screencap -p");
    try {
      const base64Data = await invoke<string>("capture_screen", { serial: activeSerial });
      setScreenshotData(base64Data);
      useLogStore.getState().addLog("success", "Screenshot captured successfully");
      setIsCapturing(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Screenshot capture failed: ${msg}`);
      setIsCapturing(false);
    }
  };

  const handleSaveScreenshot = async () => {
    if (!screenshotData) return;
    try {
      const filePath = await save({
        filters: [{ name: "PNG Image", extensions: ["png"] }],
        defaultPath: "wearos_screenshot.png",
      });

      if (filePath) {
        const base64Content = screenshotData.replace(/^data:image\/png;base64,/, "");
        const binaryString = atob(base64Content);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        await writeFile(filePath, bytes);
        useLogStore.getState().addLog("success", `Screenshot saved to ${filePath}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Save screenshot error: ${msg}`);
    }
  };

  const handleCopyScreenshot = async () => {
    if (!screenshotData) return;
    try {
      const base64Content = screenshotData.replace(/^data:image\/png;base64,/, "");
      const binaryString = atob(base64Content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: "image/png" });
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      useLogStore.getState().addLog("info", "Screenshot copied to clipboard");
    } catch (err: unknown) {
      console.error("Clipboard copy error:", err);
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSerial || !textInput.trim()) return;

    setIsSendingText(true);
    useLogStore.getState().addLog("info", `Injecting text: ${textInput}`, `input text "${textInput}"`);
    try {
      await invoke("inject_text", { serial: activeSerial, text: textInput });
      setTextInput("");
      setIsSendingText(false);
      useLogStore.getState().addLog("success", "Text sent to watch");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      useLogStore.getState().addLog("error", `Failed to send text: ${msg}`);
      setIsSendingText(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
          {t("remote.title")}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {t("remote.description")}
        </p>
      </div>

      {/* Grid: Remote Mirror & Capture / D-Pad Controller */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Screen Mirroring & Text injection */}
        <div className="space-y-4">
          {/* Mirroring Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Tv className="w-4 h-4 text-zinc-400" />
              <span>{t("remote.mirrorCard")}</span>
            </div>
            <p className="text-xs text-zinc-400">
              {t("remote.mirrorDesc")}
            </p>
            <Button
              variant="primary"
              onClick={handleLaunchMirror}
              disabled={!activeSerial}
              leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              {t("remote.launchMirror")}
            </Button>
          </div>

          {/* Screenshot Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <Camera className="w-4 h-4 text-zinc-400" />
                <span>{t("remote.screenshotCard")}</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCaptureScreenshot}
                isLoading={isCapturing}
                disabled={!activeSerial}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                {t("remote.captureBtn")}
              </Button>
            </div>

            {screenshotData ? (
              <div className="space-y-3">
                <div className="flex justify-center p-3 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <img
                    src={screenshotData}
                    alt="Watch Screenshot"
                    className="max-h-52 rounded-full border border-zinc-700 shadow-md"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleCopyScreenshot}
                    leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {t("remote.copyClipboard")}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleSaveScreenshot}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    {t("remote.savePng")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-950/40 rounded-lg border border-zinc-800/60">
                Click "Capture Screenshot" to grab the current watch display.
              </div>
            )}
          </div>

          {/* Send Text Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Keyboard className="w-4 h-4 text-zinc-400" />
              <span>{t("remote.textCard")}</span>
            </div>
            <form onSubmit={handleSendText} className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={t("remote.textPlaceholder")}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <Button
                type="submit"
                size="sm"
                variant="primary"
                isLoading={isSendingText}
                disabled={!activeSerial || !textInput.trim()}
                leftIcon={<Send className="w-3 h-3" />}
              >
                {t("remote.sendTextBtn")}
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: D-Pad Controller */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xs flex flex-col items-center justify-center">
          <h3 className="text-xs font-semibold text-zinc-200 mb-4">
            {t("remote.dpadCard")}
          </h3>
          <DpadController />
        </div>
      </div>
    </div>
  );
};
