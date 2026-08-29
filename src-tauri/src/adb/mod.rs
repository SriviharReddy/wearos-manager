pub mod runner;
pub mod connection;
pub mod device_info;
pub mod packages;
pub mod backup;
pub mod display;
pub mod audio;
pub mod optimizer;
pub mod file_manager;
pub mod remote;

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdbDevice {
    pub serial: String,
    pub state: String,
    pub model: Option<String>,
    pub product: Option<String>,
    pub device: Option<String>,
    pub is_wireless: bool,
    pub ip: Option<String>,
    pub port: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub serial: String,
    pub manufacturer: String,
    pub model: String,
    pub android_version: String,
    pub sdk_level: String,
    pub wearos_version: Option<String>,
    pub build_number: String,
    pub resolution: String,
    pub density: String,
    pub battery_level: i32,
    pub battery_status: String,
    pub battery_temperature: f32,
    pub ip_address: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatteryInfo {
    pub level: i32,
    pub status: String,
    pub health: String,
    pub temperature: f32,
    pub is_charging: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageInfo {
    pub package_name: String,
    pub apk_path: Option<String>,
    pub is_system: bool,
    pub is_enabled: bool,
    pub is_play_store: bool,
    pub version_name: Option<String>,
    pub version_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupMetadata {
    pub id: String,
    pub timestamp: String,
    pub folder_name: String,
    pub folder_path: String,
    pub device_model: Option<String>,
    pub app_count: usize,
    pub packages: Vec<String>,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size_bytes: u64,
    pub permissions: String,
    pub modified: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplaySettings {
    pub timeout_seconds: i32,
    pub density_dpi: i32,
    pub default_density_dpi: i32,
    pub font_scale: f32,
    pub aod_enabled: bool,
    pub auto_brightness_enabled: bool,
    pub brightness_level: i32,
    pub theater_mode_enabled: bool,
    pub dev_options_enabled: bool,
    pub location_mode: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioVibrationSettings {
    pub ringtone_vibration: bool,
    pub notification_vibration: bool,
    pub haptic_feedback: bool,
    pub ringtone_uri: Option<String>,
    pub notification_uri: Option<String>,
    pub alarm_uri: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnimationScales {
    pub window_animation_scale: f32,
    pub transition_animation_scale: f32,
    pub animator_duration_scale: f32,
}

/// Locates the adb executable
pub fn find_adb_path() -> PathBuf {
    // 1. Check system PATH
    if let Ok(path) = which::which("adb") {
        return path;
    }

    // 2. Check well-known Windows locations
    let candidates = [
        r"C:\Program Files\platform-tools\adb.exe",
        r"C:\Software\platform-tools\adb.exe",
        r"C:\platform-tools\adb.exe",
        r"C:\adb\adb.exe",
        r"C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe",
    ];

    for candidate in &candidates {
        let p = Path::new(candidate);
        if p.exists() {
            return p.to_path_buf();
        }
    }

    // 3. Fallback to bare command name
    PathBuf::from("adb")
}

/// Locates the scrcpy executable
pub fn find_scrcpy_path() -> Option<PathBuf> {
    if let Ok(path) = which::which("scrcpy") {
        return Some(path);
    }

    let candidates = [
        r"C:\Program Files\scrcpy\scrcpy.exe",
        r"C:\scrcpy\scrcpy.exe",
        r"scrcpy.exe",
    ];

    for candidate in &candidates {
        let p = Path::new(candidate);
        if p.exists() {
            return Some(p.to_path_buf());
        }
    }

    None
}

/// Locates the uad-ng executable (Universal Android Debloater)
pub fn find_uad_path() -> Option<PathBuf> {
    let candidates = [
        "bin/uad-ng-windows.exe",
        "resources/bin/uad-ng-windows.exe",
        "uad-ng-windows.exe",
    ];

    for c in &candidates {
        let p = Path::new(c);
        if p.exists() {
            return Some(p.to_path_buf());
        }
    }

    if let Ok(path) = which::which("uad-ng") {
        return Some(path);
    }

    None
}
