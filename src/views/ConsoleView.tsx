import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/Button";
import { invoke } from "@tauri-apps/api/core";
import { Terminal, Send, Trash2, Copy, Check } from "lucide-react";

interface CommandLog {
  id: string;
  command: string;
  output: string;
  isError: boolean;
  timestamp: string;
}

export const ConsoleView: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [logs, setLogs] = useState<CommandLog[]>([
    {
      id: "init",
      command: "adb version",
      output: "Android Debug Bridge console ready. You can type commands directly (e.g. 'shell getprop', 'devices', 'shell pm list packages').",
      isError: false,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = input.trim();
    if (!rawCmd || isRunning) return;

    let args: string[] = [];
    if (rawCmd.startsWith("adb ")) {
      args = rawCmd.substring(4).trim().split(/\s+/);
    } else {
      args = rawCmd.split(/\s+/);
    }

    setIsRunning(true);
    setInput("");
    setHistory((prev) => [rawCmd, ...prev.filter((h) => h !== rawCmd)]);
    setHistoryIndex(-1);

    try {
      const output = await invoke<string>("execute_raw_adb", { args });
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: `adb ${args.join(" ")}`,
          output: output || "(No output returned)",
          isError: false,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsRunning(false);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          command: `adb ${args.join(" ")}`,
          output: errMsg,
          isError: true,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(history[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `> ${l.command}\n${l.output}\n`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-hidden p-5 flex flex-col space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
            {t("console.title")}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {t("console.description")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopyLogs}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          >
            Copy
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLogs([])}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {t("console.clearBtn")}
          </Button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 font-mono text-xs overflow-y-auto space-y-3 shadow-inner">
        {logs.map((log) => (
          <div key={log.id} className="space-y-1">
            <div className="flex items-center gap-2 text-zinc-300 font-medium select-none">
              <span className="text-zinc-600 text-[11px]">[{log.timestamp}]</span>
              <span className="text-zinc-500">&gt;</span>
              <span className="text-zinc-200">{log.command}</span>
            </div>
            <pre
              className={`p-2.5 rounded-lg whitespace-pre-wrap break-all leading-relaxed ${
                log.isError
                  ? "bg-red-950/30 text-red-300 border border-red-900/40"
                  : "bg-zinc-900/70 text-zinc-300 border border-zinc-800/60"
              }`}
            >
              {log.output}
            </pre>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Command Input Bar */}
      <form onSubmit={handleExecute} className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-zinc-500 font-mono text-xs select-none">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span>adb</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("console.inputPlaceholder")}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-14 pr-3 py-2 text-xs text-zinc-100 font-mono placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            autoFocus
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isRunning}
          leftIcon={<Send className="w-3.5 h-3.5" />}
        >
          {t("console.runBtn")}
        </Button>
      </form>
    </div>
  );
};
