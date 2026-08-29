# ⚡ Wear OS Performance, Battery & Debloat Optimization Guide

This guide details the internal mechanisms behind the optimization and debloating features available in **WearOS Manager**.

---

## 📑 Table of Contents
1. [Animation Speed Scaling](#1-animation-speed-scaling)
2. [Ahead-Of-Time (AOT) ART Dexopt Compilation](#2-ahead-of-time-aot-art-dexopt-compilation)
3. [System App Cache Trimming](#3-system-app-cache-trimming)
4. [Screen Density (DPI) Tuning](#4-screen-density-dpi-tuning)
5. [OEM Debloating Guide (Galaxy Watch & Wear OS)](#5-oem-debloating-guide)
6. [Adaptive Battery Management](#6-adaptive-battery-management)

---

## 1. Animation Speed Scaling

### How It Works
Android renders window transitions, dialogs, and UI animations using three global system properties:
* `window_animation_scale`: Controls window entry/exit animations.
* `transition_animation_scale`: Controls activity and view transitions.
* `animator_duration_scale`: Controls in-app animation durations (spinners, menus, cards).

### Presets Available in WearOS Manager
* **1.0x (Default)**: Factory standard animation speeds.
* **0.5x (Double Speed)**: UI feels significantly snappier without losing visual polish (Recommended).
* **0.25x (Super Fast)**: Minimal delay for high responsiveness.
* **0.0x (Instant / Off)**: Animations disabled completely; maximizes speed and reduces GPU rendering load on constrained smartwatch chips.

### ADB Equivalent
```bash
adb shell settings put global window_animation_scale 0.50
adb shell settings put global transition_animation_scale 0.50
adb shell settings put global animator_duration_scale 0.50
```

---

## 2. Ahead-Of-Time (AOT) ART Dexopt Compilation

### How It Works
Smartwatches use low-power CPU architectures (e.g. Exynos W930/W1000, Snapdragon W5+ Gen 1). Android's runtime (ART) compiles app bytecode using a combination of **Just-In-Time (JIT)** interpretation and **Ahead-Of-Time (AOT)** compilation.

When apps run in JIT mode, the CPU has to compile bytecode into machine instructions *on the fly*, creating micro-stutters, delayed app launches, and excessive battery drain.

### Compilation Modes
1. **Speed Profile (`speed-profile`)**: Compiles methods and paths frequently used by the user based on collected runtime profiles. **Fast, balanced, and recommended.**
2. **Full Compilation (`everything`)**: Compiles all bytecode in every installed application directly into native machine code. Eliminates JIT overhead entirely at the expense of storage space.

### Execution via WearOS Manager
* Running Dexopt across all applications:
  ```bash
  adb shell cmd package compile -m speed-profile -a
  # Or full AOT:
  adb shell cmd package compile -m everything -a
  ```
> **Recommendation:** Run DEXOPT while the watch is connected to its magnetic charger.

---

## 3. System App Cache Trimming

### How It Works
Over time, watch apps (media players, messaging, health trackers) store temporary image thumbnails, cached network responses, and logs in their private cache directories.

WearOS Manager issues high-level cache trimming requests via Android's Package Manager:
```bash
adb shell pm trim-caches 2048M
```
This forces Android to reclaim storage from inactive app caches without deleting user credentials or preferences.

---

## 4. Screen Density (DPI) Tuning

### How It Works
Smartwatch screens typically range between 1.2" and 1.5" with circular resolutions (e.g., 450x450, 480x480). Changing the **Window Manager density (DPI)** scales the entire user interface:
* **Lowering DPI** (e.g. from 320 to 280): Shrinks UI elements, allowing more text, list items, and tiles to fit on screen simultaneously.
* **Raising DPI** (e.g. from 320 to 360): Enlarges buttons and text for improved readability.

### Commands
```bash
# Query current physical and overridden density
adb shell wm density

# Set new custom DPI
adb shell wm density 280

# Restore factory hardware default DPI
adb shell wm density reset
```

---

## 5. OEM Debloating Guide

### Safe-to-Disable Packages (Galaxy Watch & Wear OS)

WearOS Manager allows filtering and disabling non-essential background processes that continuously consume RAM and CPU cycles:

| Package Name | Service | Safe to Disable? | Notes |
| :--- | :--- | :--- | :--- |
| `com.samsung.android.bixby.agent` | Samsung Bixby Assistant | ✅ Yes | Safe if you use Google Assistant or no assistant. |
| `com.samsung.android.bixby.wakeup` | Bixby Voice Hotword Listener | ✅ Yes | Frees continuous microphone listening cycle. |
| `com.samsung.android.easysetup` | Samsung Easy Setup | ✅ Yes | Only needed during initial out-of-box pairing. |
| `com.google.android.apps.wearable.retailattractloop` | Retail Demo Mode | ✅ Yes | Demo mode for store display units. |
| `com.samsung.android.samsungpay.gear` | Samsung Pay / Wallet | ⚠️ Optional | Disable if you use Google Wallet or do not use NFC payments. |

### Disabling vs. Uninstalling
* **Disable (`pm disable-user --user 0 <package>`)**: Deactivates the app and stops all background services without deleting files. Can be re-enabled at any time. (Recommended)
* **Uninstall (`pm uninstall -k --user 0 <package>`)**: Removes the app for user 0 while retaining APKs in system partitions.

---

## 6. Adaptive Battery Management

Enables Android's machine-learning battery governor to restrict background CPU allocation for infrequently used watch applications:
```bash
adb shell settings put global adaptive_battery_management_enabled 1
```
