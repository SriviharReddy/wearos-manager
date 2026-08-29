use super::runner::{run_adb_device, run_adb_shell};
use super::AudioVibrationSettings;
use std::path::Path;

/// Retrieves vibration and audio settings from the watch
pub async fn get_audio_vibration_settings(serial: &str) -> Result<AudioVibrationSettings, String> {
    let ring_vib_raw = run_adb_shell(serial, "settings get system viberate_when_ringing")
        .await
        .unwrap_or_default();
    let ringtone_vibration = ring_vib_raw.trim() == "1";

    let notif_vib_raw = run_adb_shell(serial, "settings get system notification_vibration")
        .await
        .unwrap_or_default();
    let notification_vibration = notif_vib_raw.trim() == "1";

    let haptic_raw = run_adb_shell(serial, "settings get system haptic_feedback_enabled")
        .await
        .unwrap_or_default();
    let haptic_feedback = haptic_raw.trim() == "1";

    let ringtone_uri = run_adb_shell(serial, "settings get system ringtone")
        .await
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && s != "null");

    let notification_uri = run_adb_shell(serial, "settings get system notification_sound")
        .await
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && s != "null");

    let alarm_uri = run_adb_shell(serial, "settings get system alarm_alert")
        .await
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && s != "null");

    Ok(AudioVibrationSettings {
        ringtone_vibration,
        notification_vibration,
        haptic_feedback,
        ringtone_uri,
        notification_uri,
        alarm_uri,
    })
}

pub async fn set_ringtone_vibration(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    let _ = run_adb_shell(serial, &format!("settings put system vibrate_when_ringing {}", val)).await;
    run_adb_shell(serial, &format!("settings put system viberate_when_ringing {}", val)).await
}

pub async fn set_notification_vibration(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(serial, &format!("settings put system notification_vibration {}", val)).await
}

pub async fn set_haptic_feedback(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(serial, &format!("settings put system haptic_feedback_enabled {}", val)).await
}

/// Uploads an audio file (MP3/OGG/WAV) to the watch and registers it with the media store
pub async fn upload_audio_file(
    serial: &str,
    local_file_path: &str,
    category: &str, // "ringtone", "notification", "alarm"
) -> Result<String, String> {
    let path = Path::new(local_file_path);
    if !path.exists() {
        return Err(format!("File does not exist: {}", local_file_path));
    }

    let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
    let remote_dir = match category {
        "notification" => "/sdcard/Notifications",
        "alarm" => "/sdcard/Alarms",
        _ => "/sdcard/Ringtones",
    };

    // 1. Ensure remote directory exists
    let _ = run_adb_shell(serial, &format!("mkdir -p {}", remote_dir)).await;

    let remote_path = format!("{}/{}", remote_dir, file_name);

    // 2. Push audio file
    run_adb_device(serial, &["push", local_file_path, &remote_path]).await?;

    // 3. Trigger media scanner broadcast so Android registers the sound
    let _ = run_adb_shell(
        serial,
        &format!(
            "am broadcast -a android.intent.action.MEDIA_SCANNER_SCAN_FILE -d file://{}",
            remote_path
        ),
    )
    .await;

    Ok(format!("Audio file '{}' uploaded successfully to {}", file_name, remote_dir))
}
