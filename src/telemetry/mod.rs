mod metrics;
mod tracing;

use anyhow::Result;
use crate::config::Config;
use tracing_subscriber::{self, fmt::format::FmtSpan};

pub fn init_telemetry(config: &Config) -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(&config.telemetry.log_level)
        .with_span_events(FmtSpan::FULL)
        .init();

    // Initialize metrics if enabled
    if config.telemetry.metrics_enabled {
        metrics::init_metrics(config.telemetry.metrics_port)?;
    }

    Ok(())
}