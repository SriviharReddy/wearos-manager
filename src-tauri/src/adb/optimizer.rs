use super::packages::list_packages;
use super::runner::run_adb_shell;
use super::AnimationScales;

/// Retrieves current window and transition animation scales
pub async fn get_animation_scales(serial: &str) -> Result<AnimationScales, String> {
    let win_str = run_adb_shell(serial, "settings get global window_animation_scale")
        .await
        .unwrap_or_default();
    let trans_str = run_adb_shell(serial, "settings get global transition_animation_scale")
        .await
        .unwrap_or_default();
    let anim_str = run_adb_shell(serial, "settings get global animator_duration_scale")
        .await
        .unwrap_or_default();

    let window_animation_scale = win_str.trim().parse::<f32>().unwrap_or(1.0);
    let transition_animation_scale = trans_str.trim().parse::<f32>().unwrap_or(1.0);
    let animator_duration_scale = anim_str.trim().parse::<f32>().unwrap_or(1.0);

    Ok(AnimationScales {
        window_animation_scale,
        transition_animation_scale,
        animator_duration_scale,
    })
}

/// Sets animation scale (e.g. 0.5 for 2x faster, 0.0 for instant, 1.0 for default)
pub async fn set_animation_scales(serial: &str, scale: f32) -> Result<String, String> {
    let scale_str = format!("{:.2}", scale);
    let _ = run_adb_shell(
        serial,
        &format!("settings put global window_animation_scale {}", scale_str),
    )
    .await;
    let _ = run_adb_shell(
        serial,
        &format!("settings put global transition_animation_scale {}", scale_str),
    )
    .await;
    let _ = run_adb_shell(
        serial,
        &format!("settings put global animator_duration_scale {}", scale_str),
    )
    .await;

    Ok(format!("Animation scales updated to {}x", scale_str))
}

/// Executes ART dexopt compilation to optimize CPU and battery performance
pub async fn run_dexopt(
    serial: &str,
    mode: &str, // "speed-profile" or "everything"
    package: Option<String>,
) -> Result<String, String> {
    let compile_mode = match mode {
        "everything" => "everything",
        _ => "speed-profile",
    };

    if let Some(pkg) = package {
        run_adb_shell(
            serial,
            &format!("cmd package compile -m {} -f {}", compile_mode, pkg),
        )
        .await
    } else {
        run_adb_shell(
            serial,
            &format!("cmd package compile -m {} -a", compile_mode),
        )
        .await
    }
}

/// Clears cache across user applications
pub async fn clear_all_caches(serial: &str) -> Result<usize, String> {
    let packages = list_packages(serial, "user").await?;
    let mut cleared_count = 0;

    let _ = run_adb_shell(serial, "pm trim-caches 2048M").await;

    for pkg in packages {
        let res = run_adb_shell(serial, &format!("pm trim-caches 500M {}", pkg.package_name)).await;
        if res.is_ok() {
            cleared_count += 1;
        }
    }

    Ok(cleared_count)
}

/// Toggles Android adaptive battery optimization
pub async fn set_adaptive_battery(serial: &str, enabled: bool) -> Result<String, String> {
    let val = if enabled { "1" } else { "0" };
    run_adb_shell(
        serial,
        &format!("settings put global adaptive_battery_management_enabled {}", val),
    )
    .await
}

/// Applies common Galaxy Watch & Wear OS debloat tweaks
pub async fn apply_watch_optimizations(serial: &str) -> Result<Vec<String>, String> {
    let bloat_candidates = [
        "com.samsung.android.bixby.agent",
        "com.samsung.android.bixby.wakeup",
        "com.samsung.android.easysetup",
        "com.google.android.apps.wearable.retailattractloop",
    ];

    let mut disabled = Vec::new();
    for pkg in &bloat_candidates {
        let res = run_adb_shell(serial, &format!("pm disable-user --user 0 {}", pkg)).await;
        if let Ok(out) = res {
            if out.to_lowercase().contains("disabled") || out.to_lowercase().contains("new state") {
                disabled.push(pkg.to_string());
            }
        }
    }

    Ok(disabled)
}
