pub mod metrics;
pub mod tracing;

use anyhow::Result;
use crate::config::Config;

pub fn init_telemetry(config: &Config) -> Result<()> {
    if config.telemetry.log_level.parse::<tracing::Level>().is_ok() {
        tracing::init();
    }

    if config.telemetry.metrics_enabled {
        metrics::init_metrics(config.telemetry.metrics_port)?;
    }

    Ok(())
}