import React from "react";
import { Zap, Thermometer } from "lucide-react";
import { clsx } from "clsx";

interface BatteryGaugeProps {
  level: number;
  status: string;
  temperature: number;
  isCharging?: boolean;
  size?: number;
}

export const BatteryGauge: React.FC<BatteryGaugeProps> = ({
  level,
  status,
  temperature,
  isCharging = false,
  size = 130,
}) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, level)) / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct > 50) return "#10b981"; // Emerald
    if (pct > 20) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const strokeColor = getColor(level);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#27272a"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <div className="flex items-center gap-0.5">
            {isCharging && <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
            <span className="text-2xl font-semibold font-mono tracking-tight text-zinc-100">
              {level}%
            </span>
          </div>
          <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-0.5">
            {status}
          </span>
        </div>
      </div>

      {/* Temperature pill */}
      <div className="flex items-center gap-1 mt-2.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-[11px] font-medium text-zinc-300">
        <Thermometer className={clsx("w-3 h-3", temperature > 38 ? "text-red-400" : "text-zinc-400")} />
        <span>{temperature.toFixed(1)} °C</span>
      </div>
    </div>
  );
};
