// src/telemetry/mod.rs
use crate::config::Config;
use anyhow::Result;
use tracing_subscriber::{fmt, EnvFilter};

pub fn init_telemetry(config: &Config) -> Result<()> {
    if config.telemetry.tracing_enabled {
        init_tracing(&config.telemetry.log_level)?;
    }

    Ok(())
}

fn init_tracing(log_level: &str) -> Result<()> {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(log_level));

    fmt()
        .with_env_filter(env_filter)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_target(true)
        .init();

    Ok(())
}

pub fn shutdown_telemetry() {
    // Cleanup if needed
}