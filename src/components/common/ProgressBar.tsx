import React from "react";
import { clsx } from "clsx";

interface ProgressBarProps {
  progress?: number; // 0 to 100 or undefined for indeterminate
  label?: string;
  subLabel?: string;
  variant?: "neutral" | "emerald" | "amber" | "rose";
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  subLabel,
  variant = "neutral",
  showPercentage = true,
}) => {
  const isIndeterminate = progress === undefined;

  const colorStyles = {
    neutral: "bg-zinc-200",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
  };

  return (
    <div className="w-full">
      {(label || (showPercentage && !isIndeterminate)) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-zinc-300">{label}</span>
          {!isIndeterminate && showPercentage && (
            <span className="font-mono text-zinc-400">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        {isIndeterminate ? (
          <div
            className={clsx(
              "h-full w-1/3 rounded-full animate-pulse",
              colorStyles[variant]
            )}
          />
        ) : (
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-200",
              colorStyles[variant]
            )}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        )}
      </div>

      {subLabel && (
        <div className="text-[11px] text-zinc-500 mt-1">{subLabel}</div>
      )}
    </div>
  );
};
