export interface AdbDevice {
  serial: string;
  state: string;
  model?: string;
  product?: string;
  device?: string;
  is_wireless: boolean;
  ip?: string;
  port?: number;
}

export interface DeviceInfo {
  serial: string;
  manufacturer: string;
  model: string;
  android_version: string;
  sdk_level: string;
  wearos_version?: string;
  build_number: string;
  resolution: string;
  density: string;
  battery_level: number;
  battery_status: string;
  battery_temperature: number;
  ip_address?: string;
}

export interface BatteryInfo {
  level: number;
  status: string;
  health: string;
  temperature: number;
  is_charging: boolean;
}

export interface PackageInfo {
  package_name: string;
  apk_path?: string;
  is_system: boolean;
  is_enabled: boolean;
  is_play_store: boolean;
  version_name?: string;
  version_code?: string;
}

export interface BundledApk {
  name: string;
  file_name: string;
  path: string;
  size_bytes: number;
}

export interface BackupMetadata {
  id: string;
  timestamp: string;
  folder_name: string;
  folder_path: string;
  device_model?: string;
  app_count: number;
  packages: string[];
  size_bytes: number;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes: number;
  permissions: string;
  modified: string;
}

export interface DisplaySettings {
  timeout_seconds: number;
  density_dpi: number;
  default_density_dpi: number;
  font_scale: number;
  aod_enabled: boolean;
  auto_brightness_enabled: boolean;
  brightness_level: number;
  theater_mode_enabled: boolean;
  dev_options_enabled: boolean;
  location_mode: number;
}

export interface AudioVibrationSettings {
  ringtone_vibration: boolean;
  notification_vibration: boolean;
  haptic_feedback: boolean;
  ringtone_uri?: string;
  notification_uri?: string;
  alarm_uri?: string;
}

export interface AnimationScales {
  window_animation_scale: number;
  transition_animation_scale: number;
  animator_duration_scale: number;
}

export interface DeviceHistoryRecord {
  date: string;
  time: string;
  ip: string;
  port: number;
  model: string;
}

export type ViewType =
  | "dashboard"
  | "connect"
  | "sideload"
  | "debloat"
  | "backup"
  | "remote"
  | "customizer"
  | "optimizer"
  | "files"
  | "console";
