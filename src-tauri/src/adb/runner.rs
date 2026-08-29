use super::find_adb_path;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;
use tokio::time::timeout;

const ADB_TIMEOUT_SECS: u64 = 45;

/// Run a general ADB command (without specific device serial)
pub async fn run_adb(args: &[&str]) -> Result<String, String> {
    let adb = find_adb_path();
    let mut cmd = Command::new(adb);
    cmd.args(args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    // Create process without popping console window on Windows
    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let future = cmd.output();
    match timeout(Duration::from_secs(ADB_TIMEOUT_SECS), future).await {
        Ok(Ok(output)) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            if output.status.success() {
                Ok(stdout)
            } else {
                let err_msg = if !stderr.trim().is_empty() {
                    stderr.trim().to_string()
                } else if !stdout.trim().is_empty() {
                    stdout.trim().to_string()
                } else {
                    format!("ADB exited with code: {:?}", output.status.code())
                };
                Err(err_msg)
            }
        }
        Ok(Err(e)) => Err(format!("Failed to execute adb: {}", e)),
        Err(_) => Err(format!("ADB command timed out after {} seconds", ADB_TIMEOUT_SECS)),
    }
}

/// Run an ADB command targeted at a specific device serial
pub async fn run_adb_device(serial: &str, args: &[&str]) -> Result<String, String> {
    let mut full_args = vec!["-s", serial];
    full_args.extend_from_slice(args);
    run_adb(&full_args).await
}

/// Run an ADB shell command targeted at a specific device serial
pub async fn run_adb_shell(serial: &str, shell_cmd: &str) -> Result<String, String> {
    run_adb_device(serial, &["shell", shell_cmd]).await
}

/// Run an ADB command and return raw stdout bytes (for screencap / binary pull)
pub async fn run_adb_raw(serial: &str, args: &[&str]) -> Result<Vec<u8>, String> {
    let adb = find_adb_path();
    let mut cmd = Command::new(adb);
    cmd.arg("-s").arg(serial);
    cmd.args(args);
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    #[cfg(windows)]
    {
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    let future = cmd.output();
    match timeout(Duration::from_secs(ADB_TIMEOUT_SECS), future).await {
        Ok(Ok(output)) => {
            if output.status.success() {
                Ok(output.stdout)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                Err(stderr)
            }
        }
        Ok(Err(e)) => Err(format!("Failed to execute adb: {}", e)),
        Err(_) => Err(format!("ADB command timed out after {} seconds", ADB_TIMEOUT_SECS)),
    }
}
