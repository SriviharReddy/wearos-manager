use crate::adb::audio::{
    get_audio_vibration_settings, set_haptic_feedback, set_notification_vibration,
    set_ringtone_vibration, upload_audio_file,
};
use crate::adb::backup::{backup_user_apps, list_backups, restore_backup};
use crate::adb::connection::{
    connect_device as adb_connect, disconnect_device as adb_disconnect, list_devices as adb_list_devices,
    pair_device as adb_pair, restart_server as adb_restart_server,
};
use crate::adb::device_info::{get_battery_info, get_device_info};
use crate::adb::display::{
    get_display_settings, reboot_device, reset_density, set_aod, set_auto_brightness,
    set_brightness, set_density, set_dev_options, set_font_scale, set_location_mode,
    set_screen_timeout, set_theater_mode,
};
use crate::adb::file_manager::{delete_remote, list_remote_files, make_remote_dir, pull_file, push_file};
use crate::adb::find_uad_path;
use crate::adb::optimizer::{
    apply_watch_optimizations, clear_all_caches, get_animation_scales, run_dexopt,
    set_adaptive_battery, set_animation_scales,
};
use crate::adb::packages::{
    clear_package, disable_package, enable_package, force_stop_package, install_apk,
    launch_package, list_bundled_apks, list_packages, uninstall_package, BundledApk,
};
use crate::adb::remote::{launch_scrcpy, send_keyevent, send_text, take_screenshot};
use crate::adb::runner::run_adb;
use crate::adb::{
    AdbDevice, AnimationScales, AudioVibrationSettings, BackupMetadata, BatteryInfo, DeviceInfo,
    DisplaySettings, FileEntry, PackageInfo,
};
use crate::history::{clear_all_history, load_history, record_connection, remove_history_record, DeviceHistoryRecord};
use tauri::command;

// ==================== DEVICE & CONNECTION ====================

#[command]
pub async fn list_devices() -> Result<Vec<AdbDevice>, String> {
    adb_list_devices().await
}

#[command]
pub async fn connect_device(ip: String, port: u16) -> Result<String, String> {
    let res = adb_connect(&ip, port).await?;
    // Fetch device model to record in history
    let serial = format!("{}:{}", ip, port);
    let model = get_device_info(&serial)
        .await
        .map(|info| info.model)
        .unwrap_or_else(|_| "WearOS Device".to_string());
    record_connection(&ip, port, &model);
    Ok(res)
}

#[command]
pub async fn disconnect_device(ip: String, port: Option<u16>) -> Result<String, String> {
    adb_disconnect(&ip, port).await
}

#[command]
pub async fn pair_device(ip: String, port: u16, code: String) -> Result<String, String> {
    adb_pair(&ip, port, &code).await
}

#[command]
pub async fn restart_adb() -> Result<String, String> {
    adb_restart_server().await
}

#[command]
pub async fn fetch_device_info(serial: String) -> Result<DeviceInfo, String> {
    get_device_info(&serial).await
}

#[command]
pub async fn fetch_battery_info(serial: String) -> Result<BatteryInfo, String> {
    get_battery_info(&serial).await
}

#[command]
pub fn fetch_history() -> Vec<DeviceHistoryRecord> {
    load_history()
}

#[command]
pub fn clear_device_history() -> Result<(), String> {
    clear_all_history()
}

#[command]
pub fn delete_history_record(ip: String, port: u16) -> Result<(), String> {
    remove_history_record(&ip, port)
}

// ==================== PACKAGES & SIDELOAD ====================

#[command]
pub async fn fetch_packages(serial: String, filter: String) -> Result<Vec<PackageInfo>, String> {
    list_packages(&serial, &filter).await
}

#[command]
pub async fn sideload_apk(serial: String, apk_path: String) -> Result<String, String> {
    install_apk(&serial, &apk_path).await
}

#[command]
pub async fn uninstall_app(serial: String, package_name: String, keep_data: bool) -> Result<String, String> {
    uninstall_package(&serial, &package_name, keep_data).await
}

#[command]
pub async fn enable_app(serial: String, package_name: String) -> Result<String, String> {
    enable_package(&serial, &package_name).await
}

#[command]
pub async fn disable_app(serial: String, package_name: String) -> Result<String, String> {
    disable_package(&serial, &package_name).await
}

#[command]
pub async fn clear_app_data(serial: String, package_name: String) -> Result<String, String> {
    clear_package(&serial, &package_name).await
}

#[command]
pub async fn force_stop_app(serial: String, package_name: String) -> Result<String, String> {
    force_stop_package(&serial, &package_name).await
}

#[command]
pub async fn launch_app(serial: String, package_name: String) -> Result<String, String> {
    launch_package(&serial, &package_name).await
}

#[command]
pub fn fetch_bundled_apks() -> Vec<BundledApk> {
    list_bundled_apks()
}

#[command]
pub fn launch_uad() -> Result<String, String> {
    let uad_path = find_uad_path().ok_or_else(|| {
        "Universal Android Debloater (uad-ng) executable not found in aux files.".to_string()
    })?;

    std::process::Command::new(uad_path)
        .spawn()
        .map_err(|e| format!("Failed to spawn UAD: {}", e))?;

    Ok("Universal Android Debloater launched successfully".to_string())
}

// ==================== BACKUP & RESTORE ====================

#[command]
pub async fn create_backup(
    serial: String,
    target_packages: Option<Vec<String>>,
    output_dir: Option<String>,
) -> Result<BackupMetadata, String> {
    backup_user_apps(&serial, target_packages, output_dir).await
}

#[command]
pub fn fetch_backups(base_dir: Option<String>) -> Result<Vec<BackupMetadata>, String> {
    list_backups(base_dir)
}

#[command]
pub async fn restore_backup_snapshot(
    serial: String,
    backup_folder: String,
    selected_packages: Option<Vec<String>>,
) -> Result<Vec<String>, String> {
    restore_backup(&serial, &backup_folder, selected_packages).await
}

// ==================== DISPLAY & SYSTEM ====================

#[command]
pub async fn fetch_display_settings(serial: String) -> Result<DisplaySettings, String> {
    get_display_settings(&serial).await
}

#[command]
pub async fn apply_screen_timeout(serial: String, seconds: i32) -> Result<String, String> {
    set_screen_timeout(&serial, seconds).await
}

#[command]
pub async fn apply_density(serial: String, dpi: i32) -> Result<String, String> {
    set_density(&serial, dpi).await
}

#[command]
pub async fn restore_density(serial: String) -> Result<String, String> {
    reset_density(&serial).await
}

#[command]
pub async fn apply_font_scale(serial: String, scale: f32) -> Result<String, String> {
    set_font_scale(&serial, scale).await
}

#[command]
pub async fn apply_aod(serial: String, enabled: bool) -> Result<String, String> {
    set_aod(&serial, enabled).await
}

#[command]
pub async fn apply_auto_brightness(serial: String, enabled: bool) -> Result<String, String> {
    set_auto_brightness(&serial, enabled).await
}

#[command]
pub async fn apply_brightness(serial: String, level: i32) -> Result<String, String> {
    set_brightness(&serial, level).await
}

#[command]
pub async fn apply_theater_mode(serial: String, enabled: bool) -> Result<String, String> {
    set_theater_mode(&serial, enabled).await
}

#[command]
pub async fn apply_dev_options(serial: String, enabled: bool) -> Result<String, String> {
    set_dev_options(&serial, enabled).await
}

#[command]
pub async fn apply_location_mode(serial: String, mode: i32) -> Result<String, String> {
    set_location_mode(&serial, mode).await
}

#[command]
pub async fn trigger_reboot(serial: String, mode: String) -> Result<String, String> {
    reboot_device(&serial, &mode).await
}

// ==================== AUDIO & VIBRATION ====================

#[command]
pub async fn fetch_audio_vibration(serial: String) -> Result<AudioVibrationSettings, String> {
    get_audio_vibration_settings(&serial).await
}

#[command]
pub async fn apply_ringtone_vibration(serial: String, enabled: bool) -> Result<String, String> {
    set_ringtone_vibration(&serial, enabled).await
}

#[command]
pub async fn apply_notification_vibration(serial: String, enabled: bool) -> Result<String, String> {
    set_notification_vibration(&serial, enabled).await
}

#[command]
pub async fn apply_haptic_feedback(serial: String, enabled: bool) -> Result<String, String> {
    set_haptic_feedback(&serial, enabled).await
}

#[command]
pub async fn send_audio_file(
    serial: String,
    local_path: String,
    category: String,
) -> Result<String, String> {
    upload_audio_file(&serial, &local_path, &category).await
}

// ==================== OPTIMIZER ====================

#[command]
pub async fn fetch_animation_scales(serial: String) -> Result<AnimationScales, String> {
    get_animation_scales(&serial).await
}

#[command]
pub async fn apply_animation_scales(serial: String, scale: f32) -> Result<String, String> {
    set_animation_scales(&serial, scale).await
}

#[command]
pub async fn trigger_dexopt(
    serial: String,
    mode: String,
    package: Option<String>,
) -> Result<String, String> {
    run_dexopt(&serial, &mode, package).await
}

#[command]
pub async fn trigger_clear_cache(serial: String) -> Result<usize, String> {
    clear_all_caches(&serial).await
}

#[command]
pub async fn apply_adaptive_battery(serial: String, enabled: bool) -> Result<String, String> {
    set_adaptive_battery(&serial, enabled).await
}

#[command]
pub async fn trigger_watch_optimizations(serial: String) -> Result<Vec<String>, String> {
    apply_watch_optimizations(&serial).await
}

// ==================== FILE MANAGER ====================

#[command]
pub async fn fetch_remote_files(serial: String, path: String) -> Result<Vec<FileEntry>, String> {
    list_remote_files(&serial, &path).await
}

#[command]
pub async fn upload_file_to_watch(
    serial: String,
    local_path: String,
    remote_path: String,
) -> Result<String, String> {
    push_file(&serial, &local_path, &remote_path).await
}

#[command]
pub async fn download_file_from_watch(
    serial: String,
    remote_path: String,
    local_path: String,
) -> Result<String, String> {
    pull_file(&serial, &remote_path, &local_path).await
}

#[command]
pub async fn remove_remote_file(serial: String, remote_path: String) -> Result<String, String> {
    delete_remote(&serial, &remote_path).await
}

#[command]
pub async fn create_remote_folder(serial: String, remote_path: String) -> Result<String, String> {
    make_remote_dir(&serial, &remote_path).await
}

// ==================== REMOTE & SCREEN ====================

#[command]
pub async fn send_remote_key(serial: String, keycode: i32) -> Result<String, String> {
    send_keyevent(&serial, keycode).await
}

#[command]
pub async fn inject_text(serial: String, text: String) -> Result<String, String> {
    send_text(&serial, &text).await
}

#[command]
pub async fn capture_screen(serial: String) -> Result<String, String> {
    take_screenshot(&serial).await
}

#[command]
pub fn start_screen_mirror(serial: String) -> Result<String, String> {
    launch_scrcpy(&serial)
}

#[command]
pub async fn execute_raw_adb(args: Vec<String>) -> Result<String, String> {
    let str_args: Vec<&str> = args.iter().map(|s| s.as_str()).collect();
    run_adb(&str_args).await
}
