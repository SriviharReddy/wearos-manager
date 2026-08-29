use super::runner::{run_adb_device, run_adb_shell};
use super::DisplaySettings;

/// Retrieves current watch display and system customization settings
pub async fn get_display_settings(serial: &str) -> Result<DisplaySettings, String> {
    // 1. Timeout
    let timeout_str = run_adb_shell(serial, "settings get system screen_off_timeout")
        .await
        .unwrap_or_default();
    let timeout_ms = timeout_str.trim().parse::<i32>().unwrap_or(15000);
    let timeout_seconds = timeout_ms / 1000;

    // 2. Density
    let density_raw = run_adb_shell(serial, "wm density").await.unwrap_or_default();
    let mut density_dpi = 320;
    let mut default_density_dpi = 320;
    for line in density_raw.lines() {
        if line.contains("Physical density:") {
            default_density_dpi = line.replace("Physical density:", "").trim().parse::<i32>().unwrap_or(320);
            density_dpi = default_density_dpi;
        } else if line.contains("Override density:") {
            density_dpi = line.replace("Override density:", "").trim().parse::<i32>().unwrap_or(default_density_dpi);
        }
    }

    // 3. Font Scale
    let font_str = run_adb_shell(serial, "settings get system font_scale")
        .await
        .unwrap_or_default();
    let font_scale = font_str.trim().parse::<f32>().unwrap_or(1.0);

    // 4. AOD (Always-On Display)
    let aod_str = run_adb_shell(serial, "settings get secure doze_enabled")
        .await
        .unwrap_or_default();
    let aod_enabled = aod_str.trim() == "1";

    // 5. Auto Brightness
    let auto_bright_str = run_adb_shell(serial, "settings get system screen_brightness_mode")
        .await
        .unwrap_or_default();
    let auto_brightness_enabled = auto_bright_str.trim() == "1";

    // 6. Brightness Level
    let bright_str = run_adb_shell(serial, "settings get system screen_brightness")
        .await
        .unwrap_or_default();
    let brightness_level = bright_str.trim().parse::<i32>().unwrap_or(128);

    // 7. Theater Mode
    let theater_str = run_adb_shell(serial, "settings get global theater_mode_on")
        .await
        .unwrap_or_default();
    let theater_mode_enabled = theater_str.trim() == "1";

    // 8. Developer Options
    let dev_str = run_adb_shell(serial, "settings get global development_settings_enabled")
        .await
        .unwrap_or_default();
    let dev_options_enabled = dev_str.trim() == "1";

    // 9. Location Mode
    let loc_str = run_adb_shell(serial, "settings get secure location_mode")
        .await
        .unwrap_or_default();
    let location_mode = loc_str.trim().parse::<i32>().unwrap_or(3);

    Ok(DisplaySettings {
        timeout_seconds,
        density_dpi,
        default_density_dpi,
        font_scale,
        aod_enabled,
        auto_brightness_enabled,
        brightness_level,
        theater_mode_enabled,
        dev_options_enabled,
        location_mode,
    })
}

pub async fn set_screen_timeout(serial: &str, seconds: i32) -> Result<String, String> {
    let ms = seconds * 1000;
    run_adb_shell(serial, &format!("settings put system screen_off_timeout {}", ms)).await
}

pub async fn set_density(serial: &str, dpi: i32) -> Result<String, String> {
    run_adb_shell(serial, &format!("wm density {}", dpi)).await
}

pub async fn reset_density(serial: &str) -> Result<String, String> {
    run_adb_shell(serial, "wm density reset").await
}

pub async fn set_font_scale(serial: &str, scale: f32) -> Result<String, String> {
    run_adb_shell(serial, &format!("settings put system font_scale {:.2}", scale)).await
}

pub async fn set_aod(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(serial, &format!("settings put secure doze_enabled {}", val)).await
}

pub async fn set_auto_brightness(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(serial, &format!("settings put system screen_brightness_mode {}", val)).await
}

pub async fn set_brightness(serial: &str, level: i32) -> Result<String, String> {
    let clamped = level.clamp(0, 255);
    run_adb_shell(serial, &format!("settings put system screen_brightness {}", clamped)).await
}

pub async fn set_theater_mode(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(serial, &format!("settings put global theater_mode_on {}", val)).await
}

pub async fn set_dev_options(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(serial, &format!("settings put global development_settings_enabled {}", val)).await
}

pub async fn set_location_mode(serial: &str, mode: i32) -> Result<String, String> {
    run_adb_shell(serial, &format!("settings put secure location_mode {}", mode)).await
}

pub async fn reboot_device(serial: &str, mode: &str) -> Result<String, String> {
    match mode {
        "recovery" => run_adb_device(serial, &["reboot", "recovery"]).await,
        "bootloader" => run_adb_device(serial, &["reboot", "bootloader"]).await,
        _ => run_adb_device(serial, &["reboot"]).await,
    }
}
