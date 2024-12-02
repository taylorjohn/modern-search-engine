use serde::{Deserialize, Serialize};
use anyhow::Result;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
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
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
    pub vector: VectorConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorConfig {
    pub dimension: usize,
    pub index_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingConfig {
    pub max_document_size: usize,
    pub supported_types: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub metrics_enabled: bool,
    pub tracing_enabled: bool,
    pub log_level: String,
    pub metrics_port: u16,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            server: ServerConfig {
                host: "127.0.0.1".to_string(),
                port: 3030,
                workers: num_cpus::get(),
            },
            search: SearchConfig {
                max_results: 10,
                min_score: 0.1,
                vector_weight: 0.6,
                text_weight: 0.4,
                vector: VectorConfig {
                    dimension: 384,
                    index_type: "flat".to_string(),
                },
            },
            vector: VectorConfig {
                dimension: 384,
                index_type: "flat".to_string(),
            },
            processing: ProcessingConfig {
                max_document_size: 10 * 1024 * 1024, // 10MB
                supported_types: vec!["pdf".to_string(), "html".to_string(), "txt".to_string()],
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

impl Config {
    pub fn new() -> Result<Self> {
        Ok(Self::default())
    }
}