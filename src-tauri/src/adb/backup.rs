use super::packages::list_packages;
use super::runner::{run_adb_device, run_adb_shell};
use super::BackupMetadata;
use chrono::Local;
use std::fs;
use std::path::{Path, PathBuf};

/// Creates a full or selective backup of installed user applications
pub async fn backup_user_apps(
    serial: &str,
    target_packages: Option<Vec<String>>,
    output_base_dir: Option<String>,
) -> Result<BackupMetadata, String> {
    let base_dir = output_base_dir
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("Apps_Backup"));

    let timestamp_str = Local::now().format("%d-%m-%Y_%H-%M").to_string();
    let folder_name = format!("Backup_--{}", timestamp_str);
    let backup_folder = base_dir.join(&folder_name);

    fs::create_dir_all(&backup_folder)
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    // Determine packages to back up
    let packages_to_backup = if let Some(pkgs) = target_packages {
        pkgs
    } else {
        let all_user = list_packages(serial, "user").await?;
        all_user.into_iter().map(|p| p.package_name).collect()
    };

    let mut successful_packages = Vec::new();
    let mut total_bytes: u64 = 0;

    for pkg in &packages_to_backup {
        // Query APK path on device
        let path_out = run_adb_shell(serial, &format!("pm path {}", pkg)).await?;
        let remote_apk_path = path_out
            .lines()
            .find(|l| l.starts_with("package:"))
            .map(|l| l.replace("package:", "").trim().to_string());

        if let Some(remote_path) = remote_apk_path {
            let pkg_dir = backup_folder.join(pkg);
            let _ = fs::create_dir_all(&pkg_dir);
            let local_apk_dest = pkg_dir.join("base.apk");

            let pull_res = run_adb_device(
                serial,
                &[
                    "pull",
                    &remote_path,
                    &local_apk_dest.to_string_lossy(),
                ],
            )
            .await;

            if pull_res.is_ok() && local_apk_dest.exists() {
                if let Ok(meta) = local_apk_dest.metadata() {
                    total_bytes += meta.len();
                }
                successful_packages.push(pkg.clone());
            }
        }
    }

    let id = format!("backup-{}", Local::now().timestamp());
    let metadata = BackupMetadata {
        id,
        timestamp: timestamp_str,
        folder_name,
        folder_path: backup_folder.to_string_lossy().to_string(),
        device_model: None,
        app_count: successful_packages.len(),
        packages: successful_packages.clone(),
        size_bytes: total_bytes,
    };

    // Write manifest JSON
    let manifest_path = backup_folder.join("backup_manifest.json");
    if let Ok(json) = serde_json::to_string_pretty(&metadata) {
        let _ = fs::write(manifest_path, json);
    }

    Ok(metadata)
}

/// Discovers and lists previous backup snapshots
pub fn list_backups(base_dir: Option<String>) -> Result<Vec<BackupMetadata>, String> {
    let mut backups = Vec::new();
    let search_roots = if let Some(dir) = base_dir {
        vec![PathBuf::from(dir)]
    } else {
        vec![PathBuf::from("Apps_Backup"), PathBuf::from("Apps_Backup_old")]
    };

    for root in search_roots {
        if !root.exists() {
            continue;
        }

        if let Ok(entries) = fs::read_dir(&root) {
            for entry in entries.flatten() {
                let path = entry.path();
                if !path.is_dir() {
                    continue;
                }

                let folder_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                if !folder_name.starts_with("Backup_--") {
                    continue;
                }

                // Check for manifest
                let manifest_path = path.join("backup_manifest.json");
                if manifest_path.exists() {
                    if let Ok(content) = fs::read_to_string(&manifest_path) {
                        if let Ok(meta) = serde_json::from_str::<BackupMetadata>(&content) {
                            backups.push(meta);
                            continue;
                        }
                    }
                }

                // Infer from subdirectories
                let mut pkgs = Vec::new();
                let mut size: u64 = 0;
                if let Ok(sub_entries) = fs::read_dir(&path) {
                    for sub in sub_entries.flatten() {
                        if sub.path().is_dir() {
                            pkgs.push(sub.file_name().to_string_lossy().to_string());
                            let apk_file = sub.path().join("base.apk");
                            if let Ok(m) = apk_file.metadata() {
                                size += m.len();
                            }
                        }
                    }
                }

                let raw_time = folder_name.replace("Backup_--", "");
                backups.push(BackupMetadata {
                    id: format!("inferred-{}", folder_name),
                    timestamp: raw_time,
                    folder_name,
                    folder_path: path.to_string_lossy().to_string(),
                    device_model: None,
                    app_count: pkgs.len(),
                    packages: pkgs,
                    size_bytes: size,
                });
            }
        }
    }

    backups.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    Ok(backups)
}

/// Restores applications from a chosen backup folder to the watch
pub async fn restore_backup(
    serial: &str,
    backup_folder: &str,
    selected_packages: Option<Vec<String>>,
) -> Result<Vec<String>, String> {
    let folder_path = Path::new(backup_folder);
    if !folder_path.exists() {
        return Err(format!("Backup folder '{}' does not exist", backup_folder));
    }

    let mut restored = Vec::new();
    let entries = fs::read_dir(folder_path).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let pkg_path = entry.path();
        if !pkg_path.is_dir() {
            continue;
        }

        let pkg_name = pkg_path.file_name().unwrap_or_default().to_string_lossy().to_string();
        if let Some(ref filter_list) = selected_packages {
            if !filter_list.contains(&pkg_name) {
                continue;
            }
        }

        // Look for .apk inside the package directory
        if let Ok(files) = fs::read_dir(&pkg_path) {
            for f in files.flatten() {
                let fpath = f.path();
                if fpath.is_file() && fpath.extension().is_some_and(|e| e == "apk") {
                    let install_res = run_adb_device(
                        serial,
                        &["install", "-r", "-g", &fpath.to_string_lossy()],
                    )
                    .await;

                    if install_res.is_ok() {
                        restored.push(pkg_name.clone());
                    }
                    break;
                }
            }
        }
    }

    Ok(restored)
}
