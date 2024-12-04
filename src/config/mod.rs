pub mod search;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub search: search::SearchConfig,
    pub vector: VectorConfig,
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorConfig {
    pub dimension: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub metrics_enabled: bool,
    pub metrics_port: u16,
    pub tracing_enabled: bool,
    pub log_level: String,
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
                url: "postgres://localhost/modern_search".to_string(),
                max_connections: 5,
            },
            search: search::SearchConfig::default(),
            vector: VectorConfig {
                dimension: 384,
            },
            telemetry: TelemetryConfig {
                metrics_enabled: true,
                metrics_port: 9090,
                tracing_enabled: true,
                log_level: "info".to_string(),
            },
        }
    }
}