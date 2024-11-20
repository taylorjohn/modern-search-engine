use config::{Config, ConfigError, Environment, File};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub environment: Environment,
    pub server: ServerSettings,
    pub database: DatabaseSettings,
    pub search: SearchSettings,
    pub processing: ProcessingSettings,
    pub monitoring: MonitoringSettings,
}

#[derive(Debug, Serialize, Deserialize)]
pub enum Environment {
    Development,
    Staging,
    Production,
}

impl Environment {
    pub fn as_str(&self) -> &'static str {
        match self {
            Environment::Development => "development",
            Environment::Staging => "staging",
            Environment::Production => "production",
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
    pub workers: usize,
    pub request_timeout: u64,
    pub cors_allowed_origins: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseSettings {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database_name: String,
    pub require_ssl: bool,
    pub max_connections: u32,
    pub min_connections: u32,
}

impl DatabaseSettings {
    pub fn connection_string(&self) -> String {
        format!(
            "postgres://{}:{}@{}:{}/{}{}",
            self.username,
            self.password,
            self.host,
            self.port,
            self.database_name,
            if self.require_ssl { "?sslmode=require" } else { "" }
        )
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchSettings {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
    pub use_query_expansion: bool,
    pub cache_ttl: u64,
    pub timeout: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Processing