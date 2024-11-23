
// src/telemetry/mod.rs
pub use metrics::METRICS;
pub mod tracing;

use crate::config::Config;
use anyhow::Result;

pub fn init_telemetry(config: &Config) -> Result<()> {
    if config.telemetry.tracing_enabled {
        tracing::init_tracing(&config.telemetry.log_level)?;
    }

    if config.telemetry.metrics_enabled {
        metrics::init_metrics(config.telemetry.metrics_port)?;
    }

    Ok(())
}

pub fn shutdown_telemetry() {
    tracing::shutdown_tracing();
    metrics::shutdown_metrics();
}

pub use metrics::METRICS;
pub use tracing::get_tracer;