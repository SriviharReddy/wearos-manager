import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Watch, ExternalLink, Shield } from "lucide-react";
import { open as openUrl } from "@tauri-apps/plugin-shell";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const handleOpenLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="About WearOS Manager"
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center space-y-4 py-1">
        {/* App Icon */}
        <div className="p-3 rounded-2xl bg-zinc-800 border border-zinc-700/80 shadow-md">
          <Watch className="w-8 h-8 text-zinc-100" />
        </div>

        {/* Title & Version */}
        <div>
          <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
            WearOS Manager
          </h3>
          <p className="text-[11px] text-zinc-400 font-mono mt-0.5">Version 1.0.0</p>
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
          A high-performance desktop suite for managing, sideloading, debloating, and customizing Wear OS smartwatches via ADB.
        </p>

        {/* Meta Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700">
            Tauri v2
          </span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700">
            Rust
          </span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700">
            React 19
          </span>
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700">
            MIT License
          </span>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-2 pt-2">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => handleOpenLink("https://github.com/SriviharReddy/wearos-manager")}
            leftIcon={
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            }
            rightIcon={<ExternalLink className="w-3.5 h-3.5 opacity-60" />}
          >
            GitHub Repository
          </Button>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => handleOpenLink("https://github.com/SriviharReddy/wearos-manager/releases")}
            leftIcon={<Shield className="w-4 h-4" />}
            rightIcon={<ExternalLink className="w-3.5 h-3.5 opacity-60" />}
          >
            Releases & Updates
          </Button>
        </div>

        {/* Author Credit */}
        <div className="pt-1 text-[11px] text-zinc-500 flex items-center gap-1">
          <span>Developed by</span>
          <button
            onClick={() => handleOpenLink("https://github.com/SriviharReddy")}
            className="text-zinc-300 hover:text-white font-medium underline underline-offset-2"
          >
            srivihar
          </button>
        </div>
      </div>
    </Modal>
  );
};
