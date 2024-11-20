use tracing::{Level, Subscriber};
use tracing_subscriber::{
    fmt::{format::FmtSpan, time::UtcTime},
    EnvFilter,
    FmtSubscriber,
};
use anyhow::Result;

pub fn init_tracing(log_level: &str) -> Result<()> {
    let subscriber = FmtSubscriber::builder()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new(log_level)),
        )
        .with_timer(UtcTime::rfc_3339())
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .with_span_events(FmtSpan::FULL)
        .with_target(true)
        .with_level(true)
        .pretty()
        .try_init()?;

    Ok(())
}

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