use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use config::{Config as ConfigLib, ConfigError, Environment, File};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub search: SearchConfig,
    pub vector: VectorConfig,
    pub processing: ProcessingConfig,
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
pub struct SearchConfig {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
    pub use_vector: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VectorConfig {
    pub dimension: usize,
    pub model_path: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProcessingConfig {
    pub max_document_size: usize,
    pub supported_types: Vec<String>,
    pub processing_threads: usize,
}

impl Config {
    pub fn load() -> Result<Self, ConfigError> {
        ConfigLib::builder()
            .add_source(File::with_name("config/default").required(false))
            .add_source(File::with_name("config/local").required(false))
            .add_source(Environment::with_prefix("APP").separator("_"))
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
            },
            search: SearchConfig {
                max_results: 100,
                min_score: 0.1,
                vector_weight: 0.6,
                text_weight: 0.4,
                use_vector: true,
            },
            vector: VectorConfig {
                dimension: 384,
                model_path: PathBuf::from("models/all-MiniLM-L6-v2"),
            },
            processing: ProcessingConfig {
                max_document_size: 10 * 1024 * 1024,
                supported_types: vec!["pdf".to_string(), "html".to_string(), "txt".to_string()],
                processing_threads: num_cpus::get(),
            },
        }
    }
}