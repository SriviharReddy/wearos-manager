use super::runner::{run_adb_device, run_adb_shell};
use super::FileEntry;
use std::path::Path;

/// Lists files and directories in a given remote path on the watch
pub async fn list_remote_files(serial: &str, path: &str) -> Result<Vec<FileEntry>, String> {
    let clean_path = if path.trim().is_empty() {
        "/sdcard"
    } else {
        path.trim()
    };

    let output = run_adb_shell(serial, &format!("ls -la \"{}\"", clean_path)).await?;
    let mut entries = Vec::new();

    for line in output.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with("total") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 6 {
            continue;
        }

        let permissions = parts[0].to_string();
        let is_dir = permissions.starts_with('d') || permissions.starts_with('l');

        // Parse filename which might contain spaces and is at the end
        // Standard ls -la on Android: perms links owner group size date time name
        // Or perms owner group size date time name
        let name_idx = if parts.len() >= 8 && (parts[4].parse::<u64>().is_ok() || parts[3].parse::<u64>().is_ok()) {
            // Find where date (YYYY-MM-DD or Month) starts
            parts.len() - 1
        } else {
            parts.len() - 1
        };

        let raw_name = parts[name_idx..].join(" ");
        let name = raw_name.split(" -> ").next().unwrap_or(&raw_name).to_string();

        if name == "." || name == ".." {
            continue;
        }

        let size_bytes = parts.iter().find_map(|p| p.parse::<u64>().ok()).unwrap_or(0);
        let modified = if parts.len() >= 4 {
            format!("{} {}", parts[parts.len() - 3], parts[parts.len() - 2])
        } else {
            "Unknown".to_string()
        };

        let full_remote_path = if clean_path.ends_with('/') {
            format!("{}{}", clean_path, name)
        } else {
            format!("{}/{}", clean_path, name)
        };

        entries.push(FileEntry {
            name,
            path: full_remote_path,
            is_dir,
            size_bytes,
            permissions,
            modified,
        });
    }

    entries.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });

    Ok(entries)
}

/// Pushes a local file from PC to watch filesystem
pub async fn push_file(serial: &str, local_path: &str, remote_path: &str) -> Result<String, String> {
    let p = Path::new(local_path);
    if !p.exists() {
        return Err(format!("Local file does not exist: {}", local_path));
    }

    run_adb_device(serial, &["push", local_path, remote_path]).await
}

/// Pulls a remote file from watch filesystem to PC
pub async fn pull_file(serial: &str, remote_path: &str, local_path: &str) -> Result<String, String> {
    run_adb_device(serial, &["pull", remote_path, local_path]).await
}

/// Deletes a file or directory on the watch
pub async fn delete_remote(serial: &str, remote_path: &str) -> Result<String, String> {
    run_adb_shell(serial, &format!("rm -rf \"{}\"", remote_path)).await
}

/// Creates a new directory on the watch
pub async fn make_remote_dir(serial: &str, remote_path: &str) -> Result<String, String> {
    run_adb_shell(serial, &format!("mkdir -p \"{}\"", remote_path)).await
}
