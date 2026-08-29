use super::find_scrcpy_path;
use super::runner::{run_adb_device, run_adb_raw, run_adb_shell};
use base64::Engine;
use std::process::Stdio;
use tokio::process::Command;

/// Emits an Android hardware / DPAD key event
pub async fn send_keyevent(serial: &str, keycode: i32) -> Result<String, String> {
    run_adb_shell(serial, &format!("input keyevent {}", keycode)).await
}

/// Injects text into the focused watch input field (e.g. keyboard typing)
pub async fn send_text(serial: &str, text: &str) -> Result<String, String> {
    // Android `input text` replaces spaces with %s
    let escaped = text
        .replace('\\', "\\\\")
        .replace(' ', "%s")
        .replace('"', "\\\"")
        .replace('&', "\\&")
        .replace('<', "\\<")
        .replace('>', "\\>")
        .replace(';', "\\;");

    run_adb_shell(serial, &format!("input text \"{}\"", escaped)).await
}

/// Takes a screenshot from the watch and returns it as a Base64 data URL
pub async fn take_screenshot(serial: &str) -> Result<String, String> {
    // Capture to device temp, then pull raw bytes or use exec-out screencap -p
    let png_bytes = match run_adb_raw(serial, &["exec-out", "screencap", "-p"]).await {
        Ok(bytes) if !bytes.is_empty() => bytes,
        _ => {
            // Fallback: screencap to /sdcard/screenshot.png and pull
            let _ = run_adb_shell(serial, "screencap -p /sdcard/temp_screenshot.png").await?;
            let temp_dir = std::env::temp_dir();
            let local_dest = temp_dir.join("wearos_screenshot.png");
            run_adb_device(
                serial,
                &[
                    "pull",
                    "/sdcard/temp_screenshot.png",
                    &local_dest.to_string_lossy(),
                ],
            )
            .await?;
            let _ = run_adb_shell(serial, "rm /sdcard/temp_screenshot.png").await;
            std::fs::read(&local_dest).map_err(|e| format!("Failed to read pulled screenshot: {}", e))?
        }
    };

    let b64 = base64::engine::general_purpose::STANDARD.encode(&png_bytes);
    Ok(format!("data:image/png;base64,{}", b64))
}

/// Launches scrcpy in a standalone window for low-latency live screen mirroring and control
pub fn launch_scrcpy(serial: &str) -> Result<String, String> {
    let scrcpy_bin = find_scrcpy_path().ok_or_else(|| {
        "scrcpy was not found on your system. Please install scrcpy or place it in the application directory."
            .to_string()
    })?;

    let mut cmd = Command::new(scrcpy_bin);
    cmd.arg("-s")
        .arg(serial)
        .arg("--window-title")
        .arg("WearOS Manager - Watch Mirror")
        .arg("--max-size")
        .arg("800")
        .arg("--stay-awake")
        .arg("--always-on-top")
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        const DETACHED_PROCESS: u32 = 0x00000008;
        cmd.creation_flags(CREATE_NO_WINDOW | DETACHED_PROCESS);
    }

    cmd.spawn().map_err(|e| format!("Failed to start scrcpy: {}", e))?;
    Ok("scrcpy screen mirror launched successfully".to_string())
}
