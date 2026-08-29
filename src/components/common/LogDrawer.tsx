import React, { useState, useRef, useEffect } from "react";
import { useLogStore } from "@/store/useLogStore";
import { Terminal, Trash2, X, Copy, Check } from "lucide-react";
import { clsx } from "clsx";

export const LogDrawer: React.FC = () => {
  const { logs, isOpen, setOpen, clearLogs } = useLogStore();
  const [filter, setFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true;
    return log.level === filter;
  });

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.command ? `(${l.command}) ` : ""}${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const levelBadge = {
    info: "text-zinc-300 bg-zinc-850 border-zinc-700",
    success: "text-emerald-400 bg-emerald-950/40 border-emerald-800/50",
    warn: "text-amber-400 bg-amber-950/40 border-amber-800/50",
    error: "text-rose-400 bg-rose-950/40 border-rose-800/50",
  };

  return (
    <div className="h-60 bg-zinc-950 border-t border-zinc-800 shadow-2xl flex flex-col shrink-0 z-20">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 h-9 bg-zinc-900 border-b border-zinc-800 select-none">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-medium text-zinc-200">Terminal Output</span>
          <span className="text-zinc-500">({logs.length})</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex items-center gap-1 text-[11px]">
            {["all", "info", "success", "warn", "error"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  "px-2 py-0.5 rounded capitalize transition-colors",
                  filter === f
                    ? "bg-zinc-800 text-zinc-100 font-medium border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Copy */}
          <button
            onClick={handleCopyLogs}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Copy all logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear */}
          <button
            onClick={clearLogs}
            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Close Console"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Console Output Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5 bg-zinc-950">
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-600 italic py-4 text-center">No logs matching filter.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-zinc-600 shrink-0 select-none text-[11px]">
                {log.timestamp}
              </span>
              <span
                className={clsx(
                  "px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-medium border shrink-0",
                  levelBadge[log.level]
                )}
              >
                {log.level}
              </span>
              {log.command && (
                <span className="text-zinc-400 font-mono font-medium shrink-0">
                  [{log.command}]
                </span>
              )}
              <span className="text-zinc-300 break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};
