use anyhow::Result;
use lazy_static::lazy_static;
use metrics::{describe_counter, describe_gauge, describe_histogram, counter, gauge, histogram};
use metrics_exporter_prometheus::PrometheusBuilder;

lazy_static! {
    pub(crate) static ref METRICS: Metrics = Metrics::new();
}

pub struct Metrics {
    // Search metrics
    pub search_requests: &'static str,
    pub search_latency: &'static str,
    pub search_errors: &'static str,
    pub active_searches: &'static str,
    
    // Document processing metrics
    pub documents_processed: &'static str,
    pub processing_latency: &'static str,
    pub processing_errors: &'static str,
    pub active_processing: &'static str,
    
    // Vector store metrics
    pub vector_store_operations: &'static str,
    pub vector_store_latency: &'static str,
    pub vector_store_errors: &'static str,
    pub vector_store_size: &'static str,
}

impl Metrics {
    fn new() -> Self {
        let m = Self {
            search_requests: "search_requests_total",
            search_latency: "search_latency_seconds",
            search_errors: "search_errors_total",
            active_searches: "active_searches",
            
            documents_processed: "documents_processed_total",
            processing_latency: "processing_latency_seconds",
            processing_errors: "processing_errors_total",
            active_processing: "active_processing",
            
            vector_store_operations: "vector_store_operations_total",
            vector_store_latency: "vector_store_latency_seconds",
            vector_store_errors: "vector_store_errors_total",
            vector_store_size: "vector_store_size",
        };

        // Register and describe metrics
        describe_counter!("search_requests_total", "Total number of search requests");
        describe_histogram!("search_latency_seconds", "Search request latency in seconds");
        describe_counter!("search_errors_total", "Total number of search errors");
        describe_gauge!("active_searches", "Number of active searches");
        
        describe_counter!("documents_processed_total", "Total number of processed documents");
        describe_histogram!("processing_latency_seconds", "Document processing latency in seconds");
        describe_counter!("processing_errors_total", "Total number of processing errors");
        describe_gauge!("active_processing", "Number of documents being processed");
        
        describe_counter!("vector_store_operations_total", "Total number of vector store operations");
        describe_histogram!("vector_store_latency_seconds", "Vector store operation latency in seconds");
        describe_counter!("vector_store_errors_total", "Total number of vector store errors");
        describe_gauge!("vector_store_size", "Current size of vector store");

        m
    }

    pub fn increment_search_requests(&self) {
        counter!("search_requests_total", 1);
    }

    pub fn observe_search_latency(&self, seconds: f64) {
        histogram!("search_latency_seconds", seconds);
    }

    pub fn set_active_searches(&self, count: i64) {
        gauge!("active_searches", count as f64);
    }

    pub fn increment_documents_processed(&self) {
        counter!("documents_processed_total", 1);
    }

    pub fn observe_processing_latency(&self, seconds: f64) {
        histogram!("processing_latency_seconds", seconds);
    }

    pub fn increment_vector_store_operations(&self) {
        counter!("vector_store_operations_total", 1);
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
    // Cleanup metrics resources if needed
}