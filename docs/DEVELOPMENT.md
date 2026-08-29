# 🛠️ Developer & Architecture Guide

This document covers the internal design, coding practices, and contribution architecture of **WearOS Manager**.

---

## 🏛️ Architecture Overview

```
                          ┌───────────────────────────┐
                          │   React 19 + TypeScript   │
                          │   (Tailwind CSS, Zustand) │
                          └─────────────┬─────────────┘
                                        │
                                        │ Tauri IPC (invoke / emit)
                                        ▼
                          ┌───────────────────────────┐
                          │      Tauri v2 Core        │
                          │     (Rust Application)    │
                          └─────────────┬─────────────┘
                                        │
              ┌─────────────────────────┼─────────────────────────┐
              ▼                         ▼                         ▼
  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
  │   src-tauri/src/adb   │ │ src-tauri/src/history │ │  src-tauri/src/state  │
  │   - Async Subprocesses│ │ - Connection Log      │ │ - Managed AppState    │
  │   - Output Parsers    │ │ - Legacy Import       │ │                       │
  └───────────┬───────────┘ └───────────────────────┘ └───────────────────────┘
              │
              ▼
  ┌───────────────────────────────────────────────────────────────────────────┐
  │                           Host System Subprocess                          │
  │              (adb.exe, scrcpy.exe, uad-ng-windows.exe)                    │
  └───────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Source Tree Structure

### Frontend (`src/`)
* `src/App.tsx`: Top-level application shell with responsive sidebar, header, and active view switching.
* `src/views/`: Individual view panels:
  * `DashboardView.tsx`: Telemetry, battery gauges, hardware overview, and quick reboot controls.
  * `ConnectView.tsx`: IP/Port wireless connection, 6-digit PIN pairing dialog, and connection history.
  * `SideloadView.tsx`: Drag-and-drop APK queue, installation manager, companion apps list.
  * `DebloatView.tsx`: Searchable and filterable package manager with enable/disable/uninstall actions.
  * `BackupView.tsx`: App extraction engine and snapshot restore viewer.
  * `RemoteMirrorView.tsx`: `scrcpy` trigger, interactive D-Pad controller, screenshot viewer, and text injection.
  * `CustomizerView.tsx`: Screen timeout, DPI density, font scale, AOD, and audio uploader studio.
  * `OptimizerView.tsx`: Animation scales, ART Dexopt compiler, app cache cleaner, and bloat optimization.
  * `FilesView.tsx`: Remote watch `/sdcard` filesystem manager.
  * `ConsoleView.tsx`: Raw ADB interactive terminal.
* `src/components/`: Modular reusable widgets:
  * `watch/`: `BatteryGauge.tsx`, `DeviceCard.tsx`, `DpadController.tsx`.
  * `layout/`: `Header.tsx`, `Sidebar.tsx`, `StatusBar.tsx`.
  * `common/`: `Button.tsx`, `Modal.tsx`, `ProgressBar.tsx`, `LogDrawer.tsx`.
* `src/store/`: Zustand reactive stores:
  * `useDeviceStore.ts`: Connected device list, selected device, telemetry state, packages, history.
  * `useAppStore.ts`: Theme, active view, UI notifications, dialog states.
  * `useLogStore.ts`: Real-time execution logs with timestamps.
* `src/i18n/`: Internationalization configuration and language resource dictionaries (`en.json`, `es.json`).
* `src/types/`: TypeScript definitions (`adb.ts`).

### Backend (`src-tauri/`)
* `src-tauri/src/adb/`:
  * `runner.rs`: Low-level asynchronous execution of `adb` commands via `tokio::process::Command`.
  * `connection.rs`: `adb connect`, `adb disconnect`, `adb pair`, and `adb devices -l` parsing.
  * `device_info.rs`: Hardware queries (battery, temperature, density, resolution, OS/Wear version).
  * `packages.rs`: `pm list packages`, `pm install`, `pm disable`, `pm clear`, companion APK search.
  * `backup.rs`: Multi-app pulling (`pm path` -> `adb pull`) and manifest generation.
  * `display.rs`: `settings put system/global`, `wm density`, reboot modes.
  * `audio.rs`: Audio upload with `mkdir`, `push`, and `MEDIA_SCANNER_SCAN_FILE` broadcast.
  * `optimizer.rs`: Animation scale manipulation, `cmd package compile` (Dexopt), `pm trim-caches`.
  * `file_manager.rs`: `ls -la /sdcard` parsing, file push, pull, directory creation, deletion.
  * `remote.rs`: D-Pad keyevents (`input keyevent`), text injection (`input text`), screenshot capture (`screencap`), `scrcpy` launch.
* `src-tauri/src/commands/mod.rs`: Bridge mapping Rust async functions to Tauri command invokers (`#[command]`).
* `src-tauri/src/history.rs`: JSON and legacy text device connection history serialization.
* `src-tauri/src/lib.rs`: Tauri application initialization and plugin registration.

---

## 🔌 Adding a New ADB Command

To expose a new feature through the Tauri IPC pipeline:

### 1. Implement the Rust Logic in `src-tauri/src/adb/`
```rust
// in src-tauri/src/adb/my_feature.rs
use super::runner::run_adb_shell;

pub async fn my_custom_tweak(serial: &str, value: i32) -> Result<String, String> {
    run_adb_shell(serial, &format!("settings put global my_setting {}", value)).await
}
```

### 2. Register the Tauri Command in `src-tauri/src/commands/mod.rs`
```rust
#[command]
pub async fn apply_my_custom_tweak(serial: String, value: i32) -> Result<String, String> {
    my_custom_tweak(&serial, value).await
}
```

### 3. Add to the Handler List in `src-tauri/src/lib.rs`
```rust
.invoke_handler(tauri::generate_handler![
    // ... existing commands
    apply_my_custom_tweak,
])
```

### 4. Invoke from the React Frontend
```typescript
import { invoke } from "@tauri-apps/api/core";

const handleApply = async () => {
  try {
    const result = await invoke<string>("apply_my_custom_tweak", {
      serial: selectedDevice.serial,
      value: 42,
    });
    console.log(result);
  } catch (error) {
    console.error("Failed to apply tweak:", error);
  }
};
```

---

## 🧪 Testing & Validation

### Rust Unit & Integration Tests
```bash
cd src-tauri
cargo test
```

### Frontend Typecheck & Build
```bash
bun run build
```

---

## 📦 Building Releases
```bash
# Build complete installer bundle
bun run tauri build
```
The output installers will be placed in `src-tauri/target/release/bundle/`.
