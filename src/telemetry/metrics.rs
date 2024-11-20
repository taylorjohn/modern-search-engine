use lazy_static::lazy_static;
use metrics::{Counter, Gauge, Histogram, Key, Registry, Unit};
use metrics_exporter_prometheus::PrometheusBuilder;
use std::sync::Arc;
use anyhow::Result;

lazy_static! {
    pub static ref METRICS: Metrics = Metrics::new();
}

pub struct Metrics {
    registry: Arc<Registry>,
    
    // Search metrics
    pub search_requests: Counter,
    pub search_latency: Histogram,
    pub search_errors: Counter,
    pub active_searches: Gauge,
    
    // Document processing metrics
    pub documents_processed: Counter,
    pub processing_latency: Histogram,
    pub processing_errors: Counter,
    pub active_processing: Gauge,
    
    // Vector store metrics
    pub vector_store_operations: Counter,
    pub vector_store_latency: Histogram,
    pub vector_store_errors: Counter,
    pub vector_store_size: Gauge,
}

impl Metrics {
    fn new() -> Self {
        let registry = Arc::new(Registry::new());
        
        Self {
            search_requests: registry.counter(Key::from_static_name("search_requests_total")),
            search_latency: registry.histogram(Key::from_static_name("search_latency_seconds")),
            search_errors: registry.counter(Key::from_static_name("search_errors_total")),
            active_searches: registry.gauge(Key::from_static_name("active_searches")),
            
            documents_processed: registry.counter(Key::from_static_name("documents_processed_total")),
            processing_latency: registry.histogram(Key::from_static_name("processing_latency_seconds")),
            processing_errors: registry.counter(Key::from_static_name("processing_errors_total")),
            active_processing: registry.gauge(Key::from_static_name("active_processing")),
            
            vector_store_operations: registry.counter(Key::from_static_name("vector_store_operations_total")),
            vector_store_latency: registry.histogram(Key::from_static_name("vector_store_latency_seconds")),
            vector_store_errors: registry.counter(Key::from_static_name("vector_store_errors_total")),
            vector_store_size: registry.gauge(Key::from_static_name("vector_store_size")),
            
            registry,
        }
    }
}

pub fn init_metrics(port: u16) -> Result<()> {
    let builder = PrometheusBuilder::new();
    builder
        .with_http_listener(([0, 0, 0, 0], port))
        .install()?;
    
    Ok(())
}

pub fn shutdown_metrics() {
    // Clean up any metric resources if needed
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_metrics_recording() {
        let metrics = Metrics::new();
        
        // Test search metrics
        metrics.search_requests.increment(1);
        metrics.search_latency.record(0.1);
        
        // Test processing metrics
        metrics.documents_processed.increment(1);
        metrics.processing_latency.record(1.5);
        
        // Test vector store metrics
        metrics.vector_store_operations.increment(1);
        metrics.vector_store_size.set(100.0);
    }
}