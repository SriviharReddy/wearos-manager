use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Default)]
#[allow(dead_code)]
pub struct AppState {
    pub active_serial: Arc<Mutex<Option<String>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            active_serial: Arc::new(Mutex::new(None)),
        }
    }
}
