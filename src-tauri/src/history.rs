use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceHistoryRecord {
    pub date: String,
    pub time: String,
    pub ip: String,
    pub port: u16,
    pub model: String,
}

fn get_history_file_path() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    let app_dir = base.join("wearos-manager");
    let _ = fs::create_dir_all(&app_dir);
    app_dir.join("device_history.json")
}

/// Loads all saved device connection history records
pub fn load_history() -> Vec<DeviceHistoryRecord> {
    let json_path = get_history_file_path();
    if json_path.exists() {
        if let Ok(content) = fs::read_to_string(&json_path) {
            if let Ok(records) = serde_json::from_str::<Vec<DeviceHistoryRecord>>(&content) {
                return records;
            }
        }
    }

    // Check for seed Device_history.txt if initial run
    let seed_paths = [
        "bin/Device_history.txt",
        "Device_history.txt",
    ];
    for path_str in &seed_paths {
        let p = Path::new(path_str);
        if p.exists() {
            if let Ok(content) = fs::read_to_string(p) {
                let records = parse_legacy_history(&content);
                if !records.is_empty() {
                    let _ = save_history(&records);
                    return records;
                }
            }
        }
    }

    Vec::new()
}

/// Appends a new device connection to the history
pub fn record_connection(ip: &str, port: u16, model: &str) {
    let mut history = load_history();
    let now = Local::now();
    let date = now.format("%d-%m-%Y").to_string();
    let time = now.format("%H:%M:%S").to_string();

    // Deduplicate or update
    history.retain(|r| !(r.ip == ip && r.port == port));

    history.insert(
        0,
        DeviceHistoryRecord {
            date,
            time,
            ip: ip.to_string(),
            port,
            model: model.to_string(),
        },
    );

    // Keep top 50
    if history.len() > 50 {
        history.truncate(50);
    }

    let _ = save_history(&history);
}

/// Saves history array to JSON
pub fn save_history(records: &[DeviceHistoryRecord]) -> Result<(), String> {
    let path = get_history_file_path();
    let json = serde_json::to_string_pretty(records).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

/// Clears all connection history records
pub fn clear_all_history() -> Result<(), String> {
    save_history(&[])
}

/// Removes a single history entry by IP and Port
pub fn remove_history_record(ip: &str, port: u16) -> Result<(), String> {
    let mut history = load_history();
    history.retain(|r| !(r.ip == ip && r.port == port));
    save_history(&history)
}

/// Parses the legacy Device_history.txt format
fn parse_legacy_history(content: &str) -> Vec<DeviceHistoryRecord> {
    let mut records = Vec::new();
    for line in content.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        // Format: 12-03-2025 22:04:20.22 192.168.1.37 36539 samsung SM-R870
        if parts.len() >= 4 {
            let date = parts[0];
            if !date.contains('-') {
                continue;
            }
            let time = parts[1];
            let ip = parts[2];
            let port_str = parts[3];

            if let Ok(port) = port_str.parse::<u16>() {
                let model = if parts.len() > 4 {
                    parts[4..].join(" ")
                } else {
                    "WearOS Device".to_string()
                };

                records.push(DeviceHistoryRecord {
                    date: date.to_string(),
                    time: time.to_string(),
                    ip: ip.to_string(),
                    port,
                    model,
                });
            }
        }
    }
    records.reverse(); // Newest first
    records
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_legacy_history() {
        let sample = "Date       Time          IP Device     port                Device \n12-03-2025 22:04:20.22    192.168.1.37  36539        samsung SM-R870\n20-03-2026 12:07:14.10    192.168.1.14  45691        OnePlus OPWWE231";
        let records = parse_legacy_history(sample);
        assert_eq!(records.len(), 2);
        assert_eq!(records[0].ip, "192.168.1.14");
        assert_eq!(records[0].port, 45691);
        assert_eq!(records[0].model, "OnePlus OPWWE231");
        assert_eq!(records[1].ip, "192.168.1.37");
        assert_eq!(records[1].port, 36539);
        assert_eq!(records[1].model, "samsung SM-R870");
    }
}
