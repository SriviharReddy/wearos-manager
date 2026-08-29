# 📡 Wear OS Wireless Debugging & Pairing Guide

This guide provides step-by-step instructions for configuring wireless debugging on various Wear OS smartwatches and connecting them to **WearOS Manager**.

---

## 📑 Table of Contents
1. [General Concepts & Version Differences](#1-general-concepts--version-differences)
2. [Step 1: Enabling Developer Options](#2-step-1-enabling-developer-options)
3. [Step 2: Connecting by Wear OS Version](#3-step-2-connecting-by-wear-os-version)
   - [Wear OS 3, 4, 5+ (Galaxy Watch 4/5/6/7/Ultra, Pixel Watch, OnePlus Watch 2)](#wear-os-3-4-5-devices)
   - [Wear OS 2.x & Legacy Devices](#wear-os-2x--legacy-devices)
4. [Manufacturer-Specific Notes](#4-manufacturer-specific-notes)
   - [Samsung Galaxy Watch (One UI Watch)](#samsung-galaxy-watch)
   - [Google Pixel Watch](#google-pixel-watch)
   - [OnePlus Watch 2 / 2R](#oneplus-watch-2--2r)
5. [Troubleshooting Connection Issues](#5-troubleshooting-connection-issues)

---

## 1. General Concepts & Version Differences

Android introduced a more secure wireless debugging protocol in Android 11 (Wear OS 3+).

| Feature | Wear OS 2.x (Android 8/9) | Wear OS 3 / 4 / 5 (Android 11/13/14/15) |
| :--- | :--- | :--- |
| **Port Type** | Static (default `5555`) | **Dynamic** (e.g. `38491`, changes on Wi-Fi reconnect) |
| **Pairing Required** | No (RSA prompt on screen) | **Yes** (6-digit PIN + separate pairing port) |
| **Connection Method** | `adb connect IP:5555` | `adb pair IP:PORT PIN` followed by `adb connect IP:PORT` |
| **Wi-Fi Requirement** | Same local network | Same local network (2.4 GHz or 5 GHz) |

---

## 2. Step 1: Enabling Developer Options

1. On your smartwatch, open **Settings**.
2. Scroll down and tap **System** (or **About watch** > **Software info** on Samsung).
3. Locate **Build number**.
4. Tap **Build number** **7 times** quickly until you see a toast notification:
   > *"You are now a developer!"* or *"Developer mode turned on"*.

---

## 3. Step 2: Connecting by Wear OS Version

### Wear OS 3, 4, 5+ Devices

#### Phase A: Wireless Pairing (One-Time per PC)
1. On your watch, go to **Settings** > **Developer options**.
2. Scroll down and toggle **ADB debugging** to **ON**.
3. Toggle **Wireless debugging** to **ON**.
4. Tap on **Wireless debugging** (tap the text, not just the toggle).
5. Tap **Pair new device**.
6. A screen will display:
   * **Wi-Fi pairing code** (6 digits, e.g. `849201`)
   * **IP address & Port** (e.g. `192.168.1.50:38412`)
7. Open **WearOS Manager** on your computer:
   * Navigate to the **Connect & Pair** tab.
   * Click **Pair New Device (Wear OS 3+)**.
   * Enter the **Watch IP**, **Pairing Port** (`38412`), and the **6-digit Pairing Code**.
   * Click **Pair Device**.

#### Phase B: Establishing Connection
1. After pairing succeeds, tap the back button on your watch to return to the main **Wireless debugging** screen.
2. Look at the section labeled **IP address & Port** (Note: this port is *different* from the pairing port, e.g. `192.168.1.50:42195`).
3. In **WearOS Manager**:
   * Enter the Watch IP and the active **Connection Port** (`42195`).
   * Click **Connect Device**.
4. The status indicator in the top header will change to **Connected**, and your watch model and battery level will appear in the Dashboard.

---

### Wear OS 2.x & Legacy Devices

1. On your watch, go to **Settings** > **Developer options**.
2. Turn ON **ADB debugging**.
3. Turn ON **Debug over Wi-Fi**.
4. Go to **Settings** > **Connectivity** > **Wi-Fi** > tap your connected network to find your watch's IP address (e.g. `192.168.1.35`).
5. In **WearOS Manager**:
   * Enter your watch IP address and default port `5555`.
   * Click **Connect Device**.
6. Check your watch screen and tap **Always allow from this computer** to grant debugging permissions.

---

## 4. Manufacturer-Specific Notes

### Samsung Galaxy Watch
* **One UI Watch 4 / 5 / 6**:
  * If Wi-Fi turns off automatically to save battery, go to **Settings** > **Connections** > **Wi-Fi** and ensure Wi-Fi is set to **Always On** while configuring debugging.
  * You can keep the watch on its charger while performing heavy operations (such as DEXOPT compilation or full app backups) to prevent sleep mode.

### Google Pixel Watch
* **Pixel Watch 1 / 2 / 3**:
  * Wireless Debugging automatically turns off after a few minutes of inactivity. Keep the watch display awake while pairing.

### OnePlus Watch 2 / 2R
* Dual-engine architecture: Ensure the watch is running in **Smart Mode** (Wear OS) and not Power Saver mode (RTOS) when connecting over Wi-Fi.

---

## 5. Troubleshooting Connection Issues

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| **"Connection refused"** | Incorrect connection port | Check the dynamic port currently displayed under *Settings > Developer options > Wireless debugging*. |
| **"Device unauthorized"** | RSA prompt was dismissed or expired | Look at the watch screen and accept the authorization prompt. Toggle ADB debugging off/on if not prompted. |
| **Watch drops Wi-Fi connection** | Wear OS powers down Wi-Fi when Bluetooth is active | Disconnect Bluetooth on your phone temporarily or put the watch on its charger to force active Wi-Fi. |
| **Pairing fails** | IP mismatch or pairing screen closed | Keep the 6-digit code screen open on the watch while clicking "Pair Device" in WearOS Manager. |
| **ADB daemon unresponsive** | Deadlocked ADB server instance | Click the **Restart ADB** button in the WearOS Manager top navigation bar. |
