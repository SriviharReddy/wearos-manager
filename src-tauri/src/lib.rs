mod adb;
mod commands;
mod history;
mod state;

use commands::*;
use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            // Device & Connection
            list_devices,
            connect_device,
            disconnect_device,
            pair_device,
            restart_adb,
            fetch_device_info,
            fetch_battery_info,
            fetch_history,
            clear_device_history,
            delete_history_record,
            // Packages & Sideload
            fetch_packages,
            sideload_apk,
            uninstall_app,
            enable_app,
            disable_app,
            clear_app_data,
            force_stop_app,
            launch_app,
            fetch_bundled_apks,
            launch_uad,
            // Backup & Restore
            create_backup,
            fetch_backups,
            restore_backup_snapshot,
            // Display & System
            fetch_display_settings,
            apply_screen_timeout,
            apply_density,
            restore_density,
            apply_font_scale,
            apply_aod,
            apply_auto_brightness,
            apply_brightness,
            apply_theater_mode,
            apply_dev_options,
            apply_location_mode,
            trigger_reboot,
            // Audio & Vibration
            fetch_audio_vibration,
            apply_ringtone_vibration,
            apply_notification_vibration,
            apply_haptic_feedback,
            send_audio_file,
            // Optimizer
            fetch_animation_scales,
            apply_animation_scales,
            trigger_dexopt,
            trigger_clear_cache,
            apply_adaptive_battery,
            trigger_watch_optimizations,
            // File Manager
            fetch_remote_files,
            upload_file_to_watch,
            download_file_from_watch,
            remove_remote_file,
            create_remote_folder,
            // Remote & Screen
            send_remote_key,
            inject_text,
            capture_screen,
            start_screen_mirror,
            execute_raw_adb,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
