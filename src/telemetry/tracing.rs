use tracing::{info, warn, error, Level};
use tracing_subscriber::{FmtSubscriber, EnvFilter};

pub fn init_tracing() {
    FmtSubscriber::builder()
        .with_env_filter(EnvFilter::from_default_env())
        .with_target(true)
        .with_thread_ids(true)
        .with_thread_names(true)
        .with_file(true)
        .with_line_number(true)
        .init();
}

pub fn log_startup_info() {
    info!("Starting modern search engine...");
}

pub fn log_config_error(err: &str) {
    error!("Configuration error: {}", err);
}

pub fn log_search_request(query: &str) {
    info!("Search request received: {}", query);
}

pub fn log_processing_error(err: &str) {
    error!("Document processing error: {}", err);
}