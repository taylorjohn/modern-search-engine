use anyhow::Result;
use tracing::{info};
use tracing_subscriber::{
    fmt::{format::FmtSpan, time},
    EnvFilter,
};

pub fn init_tracing(log_level: &str) -> Result<()> {
    let subscriber = tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from(log_level))
        .with_timer(time::SystemTime::default()) // Use SystemTime instead of UtcTime
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_target(true)
        .with_span_events(FmtSpan::CLOSE)
        .compact()
        .finish();

    tracing::subscriber::set_global_default(subscriber)?;
    info!("Tracing initialized with log level: {}", log_level);
    Ok(())
}

pub fn shutdown_tracing() {
    info!("Shutting down tracing...");
}