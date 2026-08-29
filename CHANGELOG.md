# Changelog

All notable changes to **WearOS Manager** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-29

### 🚀 Initial Release
* **Native Desktop GUI**: Cross-platform desktop application built with **Tauri v2**, **Rust**, and **React 19**.
* **Cross-Platform Compatibility**: Native support for Windows, macOS, and Linux.
* **Non-blocking Asynchronous Engine**: Ported all ADB command execution to Tokio async subprocesses, eliminating UI freezes and providing real-time log streaming.
### ✨ New Features

#### 📡 Connection & Pairing
* Added native support for **Wear OS 3, 4, and 5** 6-digit wireless pairing codes with dynamic port detection.
* Added persistent device connection history with hardware model discovery and 1-click quick reconnection.
* Added 1-click ADB server daemon restart and connection health check.

#### 📊 Telemetry & Watch Overview
* Real-time hardware telemetry dashboard displaying live battery percentage, charging state, and temperature.
* Display resolution and screen density (DPI) reporting with physical vs. override indicators.
* Android OS version, Wear OS release, SDK level, build number, and Wi-Fi IP display.
* Quick reboot shortcuts for System, Recovery mode, and Bootloader.

#### 📦 Sideloading Engine
* Drag-and-drop batch APK installation directly onto the window.
* Real-time installation queue with individual status badges.
* Automatic companion APK discovery in repository folders.

#### 🧹 App Manager & Debloater
* Complete package list inspector with multi-category filters (User, System, Play Store, Sideloaded, Disabled).
* Package management actions: Enable, Disable, Force Stop, Clear App Data, Launch, and Clean Uninstall.
* One-click launcher integration for Universal Android Debloater (UAD-NG).

#### 💾 Snapshot Backup & Restore
* Timestamped app backup snapshot creation saved into `Apps_Backup/`.
* Automated `backup_manifest.json` generation tracking app metadata, package names, versions, and total size.
* Granular restoration: Restore individual APKs or entire snapshot archives back to the watch after a factory reset or migration.

#### 🖥️ Remote Control & Screen Mirroring
* Low-latency screen mirroring stream via `scrcpy` with hardware acceleration.
* Interactive D-Pad remote control with hardware buttons (Home, Back, Power/Crown, Enter).
* Instant watch screenshot capture with 1-click PNG file save or direct clipboard copy.
* Remote text and password keyboard typing injection via ADB.

#### 🎨 Display & Audio Customizer
* Custom display sleep timeout configuration beyond standard watch limits.
* Screen density (DPI) modifier with instant factory default reset.
* Font scaling factor slider.
* Toggles for Always-On Display (AOD), Auto Brightness, Theater Mode, Developer Options, and Location/GPS.
* Custom audio file uploader for Ringtones, Notifications, and Alarms with automatic Android MediaScanner indexing.
* Vibration toggles for incoming calls, notifications, and haptic feedback.

#### ⚡ Performance & Battery Optimizer
* Animation speed multiplier presets (0.5x, 0.25x, 0.0x instant, 1.0x default).
* Ahead-Of-Time (AOT) ART Dexopt bytecode compilation (`speed-profile` and `everything` modes).
* System-wide app cache cleaner (`pm trim-caches`).
* Android Adaptive Battery management toggle.
* Automated OEM bloatware disabling for Samsung Galaxy Watch and Wear OS services.

#### 📁 File Explorer
* Interactive filesystem navigation of the watch storage (`/sdcard`).
* Upload files from PC to watch and download files from watch to PC.
* Remote directory creation and file deletion.

#### 💻 ADB Console & Logger
* Embedded interactive ADB terminal for running raw ADB shell commands.
* Real-time collapsible log drawer with search and export capabilities.

#### 🌐 Internationalization
* Added multi-language localization system with English (`en`) and Spanish (`es`) language support.

