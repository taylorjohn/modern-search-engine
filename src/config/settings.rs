use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub environment: Environment,
    pub server: ServerSettings,
    pub database: DatabaseSettings,
    pub search: SearchSettings,
    pub processing: ProcessingSettings,
    pub monitoring: MonitoringSettings,
    pub telemetry: TelemetrySettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Environment {
    Development,
    Staging,
    Production,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseSettings {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchSettings {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
    pub use_query_expansion: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingSettings {
    pub max_document_size: usize,
    pub supported_types: Vec<String>,
    pub processing_threads: usize,
    pub cleanup_interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringSettings {
    pub metrics_enabled: bool,
    pub tracing_enabled: bool,
    pub metrics_port: u16,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetrySettings {
    pub log_level: String,
    pub metrics_enabled: bool,
    pub tracing_enabled: bool,
}

impl Settings {
    pub fn new() -> anyhow::Result<Self> {
        let config = config::Config::builder()
            .add_source(config::File::with_name("config/default"))
            .add_source(config::File::with_name("config/local").required(false))
            .add_source(config::Environment::with_prefix("APP"))
            .build()?;

        Ok(config.try_deserialize()?)
    }
}