pub mod metrics;
pub mod tracing;

use crate::config::Config;
use anyhow::Result;

pub fn init_telemetry(config: &Config) -> Result<()> {
    if config.telemetry.metrics_enabled {
        metrics::init_metrics(config.telemetry.metrics_port)?;
    }

    if config.telemetry.tracing_enabled {
        tracing::init_tracing(&config.telemetry.log_level)?;
    }

    Ok(())
}

pub fn shutdown_telemetry() {
    metrics::shutdown_metrics();
    tracing::shutdown_tracing();
}