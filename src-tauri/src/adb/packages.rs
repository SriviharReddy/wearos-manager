use super::runner::{run_adb_device, run_adb_shell};
use super::PackageInfo;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BundledApk {
    pub name: String,
    pub file_name: String,
    pub path: String,
    pub size_bytes: u64,
}

/// Lists packages installed on the watch with advanced metadata and filtering
pub async fn list_packages(serial: &str, filter: &str) -> Result<Vec<PackageInfo>, String> {
    // 1. Get package paths (-f flag)
    let pm_flags = match filter {
        "user" | "playstore" | "sideloaded" => "-3 -f",
        "system" => "-s -f",
        "uninstalled" | "hidden" => "-u -f",
        _ => "-f",
    };

    let list_output = run_adb_shell(serial, &format!("pm list packages {}", pm_flags)).await?;

    // 2. Get installer packages (-i flag) to distinguish Play Store vs sideloaded
    let installer_output = run_adb_shell(serial, "pm list packages -i")
        .await
        .unwrap_or_default();

    let mut play_store_packages = HashSet::new();
    for line in installer_output.lines() {
        let line = line.trim();
        // format: package:com.example.app  installer=com.android.vending
        if let Some(pkg_part) = line.strip_prefix("package:") {
            let parts: Vec<&str> = pkg_part.split("installer=").collect();
            if parts.len() == 2 {
                let pkg_name = parts[0].trim();
                let installer = parts[1].trim();
                if installer == "com.android.vending" || installer == "com.google.android.packageinstaller" {
                    play_store_packages.insert(pkg_name.to_string());
                }
            }
        }
    }

    // 3. Get disabled packages (-d flag)
    let disabled_output = run_adb_shell(serial, "pm list packages -d")
        .await
        .unwrap_or_default();
    let mut disabled_packages = HashSet::new();
    for line in disabled_output.lines() {
        if let Some(pkg) = line.trim().strip_prefix("package:") {
            disabled_packages.insert(pkg.trim().to_string());
        }
    }

    let mut packages = Vec::new();

    for line in list_output.lines() {
        let line = line.trim();
        if !line.starts_with("package:") {
            continue;
        }

        let content = &line[8..];
        // format: /data/app/~~.../base.apk=com.example.app
        let (apk_path, package_name) = if let Some(idx) = content.rfind('=') {
            let path_str = content[..idx].to_string();
            let pkg_str = content[idx + 1..].to_string();
            (Some(path_str), pkg_str)
        } else {
            (None, content.to_string())
        };

        if package_name.is_empty() {
            continue;
        }

        let is_system = apk_path
            .as_ref()
            .map(|p| p.starts_with("/system/") || p.starts_with("/product/") || p.starts_with("/vendor/"))
            .unwrap_or(false);

        let is_enabled = !disabled_packages.contains(&package_name);
        let is_play_store = play_store_packages.contains(&package_name);

        // Apply secondary filters
        if filter == "playstore" && !is_play_store {
            continue;
        }
        if filter == "sideloaded" && is_play_store {
            continue;
        }

        packages.push(PackageInfo {
            package_name,
            apk_path,
            is_system,
            is_enabled,
            is_play_store,
            version_name: None,
            version_code: None,
        });
    }

    packages.sort_by(|a, b| a.package_name.cmp(&b.package_name));
    Ok(packages)
}

/// Sideloads an APK file to the watch
pub async fn install_apk(serial: &str, apk_path: &str) -> Result<String, String> {
    let output = run_adb_device(serial, &["install", "-r", "-g", apk_path]).await?;
    let lower = output.to_lowercase();
    if lower.contains("success") {
        Ok(output.trim().to_string())
    } else {
        Err(output.trim().to_string())
    }
}

/// Uninstalls an application from the watch
pub async fn uninstall_package(serial: &str, package: &str, keep_data: bool) -> Result<String, String> {
    if keep_data {
        run_adb_shell(serial, &format!("pm uninstall -k --user 0 {}", package)).await
    } else {
        run_adb_shell(serial, &format!("pm uninstall --user 0 {}", package)).await
    }
}

/// Disables an application on the watch
pub async fn disable_package(serial: &str, package: &str) -> Result<String, String> {
    run_adb_shell(serial, &format!("pm disable-user --user 0 {}", package)).await
}

/// Enables an application on the watch
pub async fn enable_package(serial: &str, package: &str) -> Result<String, String> {
    // Try both pm enable and install-existing
    let _ = run_adb_shell(serial, &format!("cmd package install-existing {}", package)).await;
    run_adb_shell(serial, &format!("pm enable {}", package)).await
}

/// Clears app data and cache
pub async fn clear_package(serial: &str, package: &str) -> Result<String, String> {
    run_adb_shell(serial, &format!("pm clear {}", package)).await
}

/// Force stops an application
pub async fn force_stop_package(serial: &str, package: &str) -> Result<String, String> {
    run_adb_shell(serial, &format!("am force-stop {}", package)).await
}

/// Launches an application on the watch screen
pub async fn launch_package(serial: &str, package: &str) -> Result<String, String> {
    run_adb_shell(
        serial,
        &format!("monkey -p {} -c android.intent.category.LAUNCHER 1", package),
    )
    .await
}

/// Discovers companion APKs bundled in the workspace or Sideload_apks directory
pub fn list_bundled_apks() -> Vec<BundledApk> {
    let mut apks = Vec::new();
    let dirs_to_check = ["Sideload_apks", "# Sideload_apks", "."];

    for dir_name in &dirs_to_check {
        let dir_path = Path::new(dir_name);
        if let Ok(entries) = std::fs::read_dir(dir_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() && path.extension().is_some_and(|ext| ext == "apk") {
                    let file_name = path.file_name().unwrap_or_default().to_string_lossy().to_string();
                    let name = file_name.replace(".apk", "").replace("_wear", "").replace("_", " ");
                    let size_bytes = entry.metadata().map(|m| m.len()).unwrap_or(0);
                    let full_path = std::fs::canonicalize(&path)
                        .unwrap_or(path)
                        .to_string_lossy()
                        .to_string();

                    apks.push(BundledApk {
                        name,
                        file_name,
                        path: full_path,
                        size_bytes,
                    });
                }
            }
        }
    }

    apks.sort_by(|a, b| a.name.cmp(&b.name));
    apks
}
