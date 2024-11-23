ß
use anyhow::Result;

use tracing::{Level, Subscriber};

pub fn get_tracer() -> impl Subscriber {
    FmtSubscriber::builder()
        .with_max_level(Level::TRACE)
        .with_timer(UtcTime::rfc_3339())
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_target(true)
        .compact()
        .finish()
}

pub fn shutdown_tracing() {
    // Clean up any tracing resources if needed
}

#[cfg(test)]
mod tests {
    use super::*;
    use tracing::{info, error, warn};

    #[test]
    fn test_tracing() {
        init_tracing("debug").unwrap();

        info!("Test info message");
        warn!("Test warning message");
        error!("Test error message");
    }
}