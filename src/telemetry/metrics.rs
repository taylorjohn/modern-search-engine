use anyhow::Result;
use lazy_static::lazy_static;
use std::sync::Arc;
use metrics::{counter, gauge, histogram};
use metrics_exporter_prometheus::PrometheusBuilder;

lazy_static! {
    pub static ref METRICS: Arc<Metrics> = Arc::new(Metrics::new());
}

pub struct Metrics {
    pub search_requests: &'static str,
    pub search_latency: &'static str,
    pub processing_latency: &'static str,
    pub active_connections: &'static str,
}

impl Metrics {
    fn new() -> Self {
        Self {
            search_requests: "search_requests_total",
            search_latency: "search_latency_seconds",
            processing_latency: "document_processing_seconds",
            active_connections: "active_connections",
        }
    }

    pub fn increment_search_requests(&self) {
        counter!(self.search_requests, 1);
    }

    pub fn record_search_latency(&self, duration: f64) {
        histogram!(self.search_latency, duration);
    }

    pub fn record_processing_latency(&self, duration: f64) {
        histogram!(self.processing_latency, duration);
    }

    pub fn set_active_connections(&self, count: i64) {
        gauge!(self.active_connections, count as f64);
    }
}

pub fn init_metrics(port: u16) -> Result<()> {
    PrometheusBuilder::new()
        .with_http_listener(([0, 0, 0, 0], port))
        .install()?;
    Ok(())
}