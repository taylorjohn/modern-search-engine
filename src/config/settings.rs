use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use config::{Config, ConfigError, File};

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub database: DatabaseSettings,
    pub server: ServerSettings,
    pub search: SearchSettings,
    pub vector: VectorSettings,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DatabaseSettings {
    pub url: String,
    pub max_connections: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServerSettings {
    pub host: String,
    pub port: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchSettings {
    pub max_results: usize,
    pub min_score: f32,
    pub vector_weight: f32,
    pub text_weight: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VectorSettings {
    pub dimension: usize,
    pub model_path: PathBuf,
}

impl Settings {
    pub fn load() -> Result<Self, ConfigError> {
        let s = Config::builder()
            .add_source(File::with_name("config/default"))
            .add_source(File::with_name("config/local").required(false))
            .build()?;

        s.try_deserialize()
    }
}
