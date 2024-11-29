use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use config::{Config as ConfigBuilder, ConfigError, Environment, File};

// src/config/mod.rs
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            max_results: 100,
            min_score: 0.1,
            vector_weight: 0.6,
            text_weight: 0.4,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub search: SearchConfig,
    pub vector: VectorConfig,
    pub processing: ProcessingConfig,
    pub telemetry: TelemetryConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub workers: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
    pub use_query_expansion: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorConfig {
    pub dimension: usize,
    pub model_path: PathBuf,
    pub index_type: String,
    pub index_params: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingConfig {
    pub max_document_size: usize,
    pub supported_types: Vec<String>,
    pub processing_threads: usize,
    pub cleanup_interval: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub metrics_enabled: bool,
    pub tracing_enabled: bool,
    pub log_level: String,
    pub metrics_port: u16,
}

impl Config {
    pub fn new() -> Result<Self, ConfigError> {
        let config_builder = ConfigBuilder::builder()
            // Start with default settings
            .set_default("server.host", "127.0.0.1")?
            .set_default("server.port", 3030)?
            .set_default("server.workers", num_cpus::get())?
            
            // Add config file
            .add_source(File::with_name("config/default").required(false))
            .add_source(File::with_name("config/local").required(false))
            
            // Add environment variables with prefix
            .add_source(Environment::with_prefix("APP").separator("_"))
            
            .build()?;

        config_builder.try_deserialize()
    }

    pub fn from_file(path: &str) -> Result<Self, ConfigError> {
        ConfigBuilder::builder()
            .add_source(File::with_name(path))
            .build()?
            .try_deserialize()
    }
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 3030,
                workers: num_cpus::get(),
            },
            database: DatabaseConfig {
                url: "postgres://localhost/search_engine".to_string(),
                max_connections: 32,
                min_connections: 4,
            },
            search: SearchConfig {
                max_results: 100,
                min_score: 0.1,
                vector_weight: 0.6,
                text_weight: 0.4,
                use_query_expansion: true,
            },
            vector: VectorConfig {
                dimension: 384,
                model_path: PathBuf::from("models/all-MiniLM-L6-v2"),
                index_type: "ivfflat".to_string(),
                index_params: serde_json::json!({ "lists": 100 }),
            },
            processing: ProcessingConfig {
                max_document_size: 10 * 1024 * 1024, // 10MB
                supported_types: vec!["pdf".to_string(), "html".to_string(), "txt".to_string()],
                processing_threads: num_cpus::get(),
                cleanup_interval: 3600, // 1 hour
            },
            telemetry: TelemetryConfig {
                metrics_enabled: true,
                tracing_enabled: true,
                log_level: "info".to_string(),
                metrics_port: 9090,
            },
        }
    }
}