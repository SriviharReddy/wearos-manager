# WearOS Manager

A modern, high-performance desktop application for managing, optimizing, and customizing Wear OS smartwatches via ADB (Android Debug Bridge). Built with **Tauri v2 + Rust** and **React 19 + TypeScript + Vite + Tailwind CSS**.

---

## Features

- **Device Connection & Wireless Pairing**:
  - Connect via Wi-Fi (`adb connect`) or USB cable.
  - Pair modern Wear OS 3, 4, and 5 watches wirelessly using 6-digit pairing codes (`adb pair`).
  - Persistent connection history with 1-click reconnect and clear history controls.
- **Application Manager & Sideloading**:
  - Drag-and-drop single and batch APK installation with real-time progress indicators.
  - Package explorer with filters: *User Apps*, *System Apps*, *Play Store*, *Sideloaded*, and *Hidden/Uninstalled*.
  - App management: Launch, Enable/Disable, Clear Cache/Data, Force Stop, and Uninstall.
  - Integrated Universal Android Debloater (UAD-NG) support.
- **Backup & Multi-Snapshot Restoration**:
  - Full or selective extraction of installed watch applications into timestamped backup folders.
  - Multi-backup browser with package inspection and selective or batch restoration.
- **Screen Mirroring & Remote Control**:
  - High-performance, low-latency watch screen mirroring and interactive control via `scrcpy`.
  - Instant screenshot capture with Preview, Copy to Clipboard, and Save to PNG.
  - Virtual D-pad remote controller with hardware keys (Power, Back, Home, Volume).
  - Text input injection from PC keyboard to watch fields.
- **Display & Audio Customization**:
  - Custom screen timeout durations (15s up to Always-On 24h).
  - Screen Density (DPI) modifier and font scale adjustment.
  - Always-On Display (AOD), Auto-Brightness, Theater Mode, and Developer Options toggles.
  - Ringtone, Notification Sound, and Alarm Sound uploads with automatic media store indexing.
  - Vibration toggles for incoming calls, notifications, and haptic touch feedback.
- **Performance & Battery Optimizer**:
  - Animation speed multiplier (1.0x, 0.5x double speed, 0.25x, 0.0x instant).
  - Ahead-of-Time (AOT) ART Dexopt bytecode compilation.
  - One-click app cache cleaner.
  - OEM background telemetry optimizer.
- **Watch Storage File Explorer**:
  - Browse `/sdcard/` directories with path breadcrumbs.
  - Upload files to watch, download to PC, create folders, and delete files.
- **Interactive ADB Console**:
  - Built-in terminal for custom ADB commands with command history navigation.
- **Internationalization (i18n)**:
  - English (EN) and Spanish (ES) localization.

---

## Development & Build

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)
- [Rust](https://www.rust-lang.org/) (v1.75+)
- [Android Platform Tools (ADB)](https://developer.android.com/tools/releases/platform-tools)

### Running Development Mode

```bash
bun install
bun run tauri dev
```

### Building Standalone Executable

```bash
bun run tauri build
```

The compiled standalone executable will be generated at `src-tauri/target/release/wearos-manager.exe` along with Windows setup installers in `src-tauri/target/release/bundle/`.

---

## License

Distributed under the [MIT License](https://opensource.org/licenses/MIT).
