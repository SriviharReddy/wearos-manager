use super::runner::run_adb_shell;
use super::{BatteryInfo, DeviceInfo};

/// Retrieves comprehensive device and hardware information
pub async fn get_device_info(serial: &str) -> Result<DeviceInfo, String> {
    let manufacturer = run_adb_shell(serial, "getprop ro.product.manufacturer")
        .await
        .unwrap_or_else(|_| "Unknown".to_string())
        .trim()
        .to_string();

    let model = run_adb_shell(serial, "getprop ro.product.model")
        .await
        .unwrap_or_else(|_| "WearOS Device".to_string())
        .trim()
        .to_string();

    let android_version = run_adb_shell(serial, "getprop ro.build.version.release")
        .await
        .unwrap_or_else(|_| "11".to_string())
        .trim()
        .to_string();

    let sdk_level = run_adb_shell(serial, "getprop ro.build.version.sdk")
        .await
        .unwrap_or_else(|_| "30".to_string())
        .trim()
        .to_string();

    let build_number = run_adb_shell(serial, "getprop ro.build.display.id")
        .await
        .unwrap_or_else(|_| "Unknown".to_string())
        .trim()
        .to_string();

    // Check WearOS version
    let mut wearos_version = run_adb_shell(serial, "getprop ro.wear.version")
        .await
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && s != "null");

    if wearos_version.is_none() {
        let sdk_num = sdk_level.parse::<i32>().unwrap_or(30);
        let mapped = match sdk_num {
            s if s >= 35 => "Wear OS 6.0",
            34 => "Wear OS 5.0",
            33 => "Wear OS 4.0",
            30 => "Wear OS 3.5",
            28 => "Wear OS 2.x",
            s if s <= 27 => "Wear OS 1.x / 2.0",
            _ => "Wear OS",
        };
        wearos_version = Some(mapped.to_string());
    } else if let Some(ref ver) = wearos_version {
        if !ver.to_lowercase().starts_with("wear os") {
            wearos_version = Some(format!("Wear OS {}", ver));
        }
    }

    // Resolution & Density
    let resolution_raw = run_adb_shell(serial, "wm size").await.unwrap_or_default();
    let resolution = resolution_raw
        .lines()
        .find(|l| l.contains("size:"))
        .map(|l| l.replace("Physical size:", "").replace("Override size:", "").trim().to_string())
        .unwrap_or_else(|| "454x454".to_string());

    let density_raw = run_adb_shell(serial, "wm density").await.unwrap_or_default();
    let density = density_raw
        .lines()
        .find(|l| l.contains("density:"))
        .map(|l| l.replace("Physical density:", "").replace("Override density:", "").trim().to_string())
        .unwrap_or_else(|| "320".to_string());

    // Battery
    let battery = get_battery_info(serial).await.unwrap_or(BatteryInfo {
        level: 100,
        status: "Unknown".to_string(),
        health: "Good".to_string(),
        temperature: 25.0,
        is_charging: false,
    });

    // IP Address on watch
    let ip_out = run_adb_shell(serial, "ip route").await.unwrap_or_default();
    let ip_address = ip_out
        .lines()
        .find(|l| l.contains("src"))
        .and_then(|l| l.split_whitespace().last().map(|s| s.to_string()));

    Ok(DeviceInfo {
        serial: serial.to_string(),
        manufacturer,
        model,
        android_version,
        sdk_level,
        wearos_version,
        build_number,
        resolution,
        density,
        battery_level: battery.level,
        battery_status: battery.status,
        battery_temperature: battery.temperature,
        ip_address,
    })
}

/// Parses `dumpsys battery` output for battery percentage, status, and temperature
pub async fn get_battery_info(serial: &str) -> Result<BatteryInfo, String> {
    let output = run_adb_shell(serial, "dumpsys battery").await?;
    Ok(parse_battery_output(&output))
}

pub fn parse_battery_output(output: &str) -> BatteryInfo {
    let mut level = 100;
    let mut status_code = 1;
    let mut health_code = 1;
    let mut temp_raw = 250;

    for line in output.lines() {
        let line = line.trim();
        if let Some(val) = line.strip_prefix("level:") {
            level = val.trim().parse::<i32>().unwrap_or(100);
        } else if let Some(val) = line.strip_prefix("status:") {
            status_code = val.trim().parse::<i32>().unwrap_or(1);
        } else if let Some(val) = line.strip_prefix("health:") {
            health_code = val.trim().parse::<i32>().unwrap_or(1);
        } else if let Some(val) = line.strip_prefix("temperature:") {
            temp_raw = val.trim().parse::<i32>().unwrap_or(250);
        }
    }

    let status = match status_code {
        2 => "Charging",
        3 => "Discharging",
        4 => "Not Charging",
        5 => "Full",
        _ => "Unknown",
    }
    .to_string();

    let health = match health_code {
        2 => "Good",
        3 => "Overheat",
        4 => "Dead",
        5 => "Over Voltage",
        _ => "Normal",
    }
    .to_string();

    let temperature = temp_raw as f32 / 10.0;
    let is_charging = status_code == 2 || status_code == 5;

    BatteryInfo {
        level,
        status,
        health,
        temperature,
        is_charging,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_battery_output() {
        let sample = "Current Battery Service state:\n  AC powered: false\n  USB powered: true\n  status: 2\n  health: 2\n  present: true\n  level: 84\n  scale: 100\n  voltage: 4120\n  temperature: 285\n  technology: Li-ion";
        let info = parse_battery_output(sample);
        assert_eq!(info.level, 84);
        assert_eq!(info.status, "Charging");
        assert_eq!(info.health, "Good");
        assert_eq!(info.temperature, 28.5);
        assert!(info.is_charging);
    }
}
