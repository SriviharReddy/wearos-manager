import React, { useState, useEffect } from "react";
import { useDeviceStore } from "@/store/useDeviceStore";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Wifi, Radio, Shield, History, Trash2, ArrowRight } from "lucide-react";

export const ConnectView: React.FC = () => {
  const { t } = useTranslation();
  const {
    connect,
    pair,
    disconnect,
    isConnecting,
    history,
    loadHistory,
    clearHistory,
    deleteHistoryEntry,
    devices,
    activeSerial,
  } = useDeviceStore();

  const [ip, setIp] = useState<string>("192.168.1.");
  const [port, setPort] = useState<string>("5555");
  const [isPairModalOpen, setIsPairModalOpen] = useState<boolean>(false);
  const [pairIp, setPairIp] = useState<string>("192.168.1.");
  const [pairPort, setPairPort] = useState<string>("");
  const [pairCode, setPairCode] = useState<string>("");

  useEffect(() => {
    loadHistory();
    if (history.length > 0) {
      setIp(history[0].ip);
      setPort(String(history[0].port));
      setPairIp(history[0].ip);
    }
  }, []);

  const handleConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const portNum = parseInt(port, 10);
    if (!ip || isNaN(portNum)) return;
    await connect(ip, portNum);
  };

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(pairPort, 10);
    if (!pairIp || isNaN(portNum) || !pairCode) return;

    const ok = await pair(pairIp, portNum, pairCode);
    if (ok) {
      setIsPairModalOpen(false);
      setIp(pairIp);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
          {t("connect.title")}
        </h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          {t("connect.description")}
        </p>
      </div>

      {/* Main Connection Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <Wifi className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("connect.connectBtn")}</span>
          </div>

          <form onSubmit={handleConnect} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {t("connect.ipAddress")}
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="192.168.1.37"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {t("connect.port")}
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="5555"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                required
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                {t("connect.portHelp")}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Button
                type="submit"
                variant="primary"
                isLoading={isConnecting}
                leftIcon={<Radio className="w-3.5 h-3.5" />}
                className="flex-1"
              >
                {t("connect.connectBtn")}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPairIp(ip);
                  setIsPairModalOpen(true);
                }}
                leftIcon={<Shield className="w-3.5 h-3.5" />}
              >
                {t("connect.pairBtn")}
              </Button>
            </div>
          </form>
        </div>

        {/* Connected Devices List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-zinc-200 mb-2.5">
              {t("connect.status")}
            </h3>
            {devices.length === 0 ? (
              <div className="text-xs text-zinc-500 italic py-6 text-center bg-zinc-950/40 rounded-lg border border-zinc-800/60">
                {t("app.noDevice")}
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((d) => (
                  <div
                    key={d.serial}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950/60 border border-zinc-800"
                  >
                    <div>
                      <div className="text-xs font-medium text-zinc-200">
                        {d.model || d.serial}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        {d.serial} ({d.state})
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => disconnect(d.ip || d.serial, d.port)}
                    >
                      {t("connect.disconnectBtn")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-400">
            <strong>Tip:</strong> Ensure your watch and PC are on the same Wi-Fi network and "Debugging over Wi-Fi" is enabled in Developer Options.
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
            <History className="w-3.5 h-3.5 text-zinc-400" />
            <span>{t("connect.historyTitle")}</span>
          </div>

          {history.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (window.confirm(t("connect.confirmClearHistory"))) {
                  clearHistory();
                }
              }}
              leftIcon={<Trash2 className="w-3 h-3 text-red-400" />}
            >
              {t("connect.clearHistory")}
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-xs text-zinc-500 italic py-4 text-center">
            {t("connect.historyEmpty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between hover:border-zinc-700 transition-colors"
              >
                <div>
                  <div className="text-xs font-medium text-zinc-200">
                    {item.model || "WearOS Device"}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                    {item.ip}:{item.port}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    {item.date} {item.time}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIp(item.ip);
                      setPort(String(item.port));
                      connect(item.ip, item.port);
                    }}
                    rightIcon={<ArrowRight className="w-3 h-3" />}
                  >
                    {t("connect.quickConnect")}
                  </Button>
                  <button
                    onClick={() => deleteHistoryEntry(item.ip, item.port)}
                    className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title={t("connect.forget")}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wireless Pairing Modal */}
      <Modal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        title={t("connect.pairingTitle")}
        description={t("connect.pairingDesc")}
      >
        <form onSubmit={handlePair} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              {t("connect.ipAddress")}
            </label>
            <input
              type="text"
              value={pairIp}
              onChange={(e) => setPairIp(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {t("connect.pairPort")}
              </label>
              <input
                type="number"
                value={pairPort}
                onChange={(e) => setPairPort(e.target.value)}
                placeholder="38367"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                {t("connect.pairCode")}
              </label>
              <input
                type="text"
                value={pairCode}
                onChange={(e) => setPairCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPairModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isConnecting}>
              {t("connect.submitPair")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
