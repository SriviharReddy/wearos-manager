use super::runner::run_adb;
use super::AdbDevice;
use regex::Regex;

/// Lists all connected ADB devices and parses their attributes
pub async fn list_devices() -> Result<Vec<AdbDevice>, String> {
    let output = run_adb(&["devices", "-l"]).await?;
    let mut devices = Vec::new();

    let ip_port_re = Regex::new(r"^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)$").unwrap();
    let prop_re = Regex::new(r"(\w+):(\S+)").unwrap();

    for line in output.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with("* daemon") || line.starts_with("List of devices") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.is_empty() {
            continue;
        }

        let serial = parts[0].to_string();
        let state = if parts.len() > 1 {
            parts[1].to_string()
        } else {
            "unknown".to_string()
        };

        let mut model = None;
        let mut product = None;
        let mut device_name = None;

        for cap in prop_re.captures_iter(line) {
            let key = &cap[1];
            let val = &cap[2];
            match key {
                "model" => model = Some(val.replace('_', " ")),
                "product" => product = Some(val.to_string()),
                "device" => device_name = Some(val.to_string()),
                _ => {}
            }
        }

        let (is_wireless, ip, port) = if let Some(caps) = ip_port_re.captures(&serial) {
            let ip_str = caps[1].to_string();
            let port_num = caps[2].parse::<u16>().ok();
            (true, Some(ip_str), port_num)
        } else {
            (false, None, None)
        };

        devices.push(AdbDevice {
            serial,
            state,
            model,
            product,
            device: device_name,
            is_wireless,
            ip,
            port,
        });
    }

    Ok(devices)
}

/// Connects to a device via IP and Port (e.g. 192.168.1.37:5555 or dynamic port)
pub async fn connect_device(ip: &str, port: u16) -> Result<String, String> {
    let target = format!("{}:{}", ip.trim(), port);
    let output = run_adb(&["connect", &target]).await?;
    let lower = output.to_lowercase();
    if lower.contains("connected to") || lower.contains("already connected") {
        Ok(output.trim().to_string())
    } else {
        Err(output.trim().to_string())
    }
}

/// Disconnects a device via IP and Port, or disconnects all if None
pub async fn disconnect_device(ip: &str, port: Option<u16>) -> Result<String, String> {
    let target = if let Some(p) = port {
        format!("{}:{}", ip.trim(), p)
    } else {
        ip.trim().to_string()
    };
    run_adb(&["disconnect", &target]).await
}

/// Pairs a device (Wear OS 3 / 4 / 5 wireless debugging) using pair port and code
pub async fn pair_device(ip: &str, port: u16, code: &str) -> Result<String, String> {
    let target = format!("{}:{}", ip.trim(), port);
    let output = run_adb(&["pair", &target, code.trim()]).await?;
    let lower = output.to_lowercase();
    if lower.contains("successfully paired") {
        Ok(output.trim().to_string())
    } else {
        Err(output.trim().to_string())
    }
}

/// Restarts the ADB server
pub async fn restart_server() -> Result<String, String> {
    let _ = run_adb(&["kill-server"]).await;
    run_adb(&["start-server"]).await
}
