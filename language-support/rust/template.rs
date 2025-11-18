/*
Rust Language Support Template
For MASTER-WORKFLOW v3.0
*/

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LanguageConfig {
    pub language: String,
    pub extensions: Vec<String>,
    pub build_tools: BuildTools,
    pub frameworks: HashMap<String, Vec<String>>,
    pub testing: TestingConfig,
    pub linting: LintingConfig,
    pub patterns: HashMap<String, serde_json::Value>,
    pub dev_server: DevServerConfig,
    pub deployment: DeploymentConfig,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct BuildTools {
    pub package_manager: String,
    pub build_system: String,
    pub build_command: String,
    pub test_command: String,
    pub lint_command: String,
    pub format_command: String,
    pub check_command: String,
    pub alternative_managers: Vec<String>,
    pub registry: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TestingConfig {
    pub unit: Vec<String>,
    pub integration: Vec<String>,
    pub benchmark: Vec<String>,
    pub coverage: Vec<String>,
    pub property_testing: Vec<String>,
    pub config_file: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LintingConfig {
    pub linter: String,
    pub config: String,
    pub formatter: String,
    pub static_analysis: Vec<String>,
    pub security_scanner: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DevServerConfig {
    pub command: String,
    pub default_port: u16,
    pub hot_reload: bool,
    pub watch_tool: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeploymentConfig {
    pub platforms: Vec<String>,
    pub containerization: String,
    pub ci: Vec<String>,
    pub cloud_native: Vec<String>,
    pub cross_compilation: Vec<String>,
}

impl LanguageConfig {
    pub fn new() -> Self {
        let mut frameworks = HashMap::new();
        frameworks.insert("web".to_string(), vec![
            "Actix-web".to_string(),
            "Rocket".to_string(),
            "Warp".to_string(),
            "Axum".to_string(),
            "Tide".to_string(),
            "Gotham".to_string(),
        ]);
        frameworks.insert("async".to_string(), vec![
            "Tokio".to_string(),
            "async-std".to_string(),
            "Smol".to_string(),
            "Futures".to_string(),
        ]);
        frameworks.insert("cli".to_string(), vec![
            "Clap".to_string(),
            "StructOpt".to_string(),
            "Argh".to_string(),
            "Docopt".to_string(),
        ]);
        frameworks.insert("database".to_string(), vec![
            "Diesel".to_string(),
            "SQLx".to_string(),
            "SeaORM".to_string(),
            "Rusqlite".to_string(),
        ]);
        frameworks.insert("serialization".to_string(), vec![
            "Serde".to_string(),
            "Bincode".to_string(),
            "TOML".to_string(),
            "JSON".to_string(),
        ]);

        let mut patterns = HashMap::new();
        patterns.insert("ownership".to_string(), serde_json::json!("ownership and borrowing"));
        patterns.insert("error_handling".to_string(), serde_json::json!("Result<T, E> and Option<T>"));
        patterns.insert("pattern_matching".to_string(), serde_json::json!("match expressions"));
        patterns.insert("traits".to_string(), serde_json::json!("trait-based polymorphism"));
        patterns.insert("async_programming".to_string(), serde_json::json!("async/await with futures"));

        Self {
            language: "rust".to_string(),
            extensions: vec![".rs".to_string(), ".toml".to_string()],
            build_tools: BuildTools {
                package_manager: "Cargo".to_string(),
                build_system: "Cargo".to_string(),
                build_command: "cargo build".to_string(),
                test_command: "cargo test".to_string(),
                lint_command: "cargo clippy".to_string(),
                format_command: "cargo fmt".to_string(),
                check_command: "cargo check".to_string(),
                alternative_managers: vec!["Bazel".to_string(), "Buck2".to_string()],
                registry: "https://crates.io/".to_string(),
            },
            frameworks,
            testing: TestingConfig {
                unit: vec!["std::test".to_string(), "pretty_assertions".to_string()],
                integration: vec!["cargo test".to_string(), "integration tests".to_string()],
                benchmark: vec!["criterion".to_string(), "bench".to_string()],
                coverage: vec!["tarpaulin".to_string(), "grcov".to_string()],
                property_testing: vec!["proptest".to_string(), "quickcheck".to_string()],
                config_file: "Cargo.toml".to_string(),
            },
            linting: LintingConfig {
                linter: "clippy".to_string(),
                config: "clippy.toml".to_string(),
                formatter: "rustfmt".to_string(),
                static_analysis: vec!["clippy".to_string(), "miri".to_string()],
                security_scanner: vec!["cargo-audit".to_string(), "cargo-deny".to_string()],
            },
            patterns,
            dev_server: DevServerConfig {
                command: "cargo run".to_string(),
                default_port: 8000,
                hot_reload: false,
                watch_tool: "cargo-watch".to_string(),
            },
            deployment: DeploymentConfig {
                platforms: vec![
                    "AWS".to_string(),
                    "Google Cloud".to_string(),
                    "Azure".to_string(),
                    "Railway".to_string(),
                    "Fly.io".to_string(),
                ],
                containerization: "Docker".to_string(),
                ci: vec![
                    "GitHub Actions".to_string(),
                    "GitLab CI".to_string(),
                    "CircleCI".to_string(),
                    "Jenkins".to_string(),
                ],
                cloud_native: vec!["Kubernetes".to_string(), "Docker".to_string()],
                cross_compilation: vec![
                    "x86_64-pc-windows-gnu".to_string(),
                    "x86_64-apple-darwin".to_string(),
                    "aarch64-apple-darwin".to_string(),
                    "x86_64-unknown-linux-gnu".to_string(),
                ],
            },
        }
    }

    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }
}

impl Default for LanguageConfig {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_language_config_creation() {
        let config = LanguageConfig::new();
        assert_eq!(config.language, "rust");
        assert!(config.frameworks.contains_key("web"));
        assert!(config.frameworks.contains_key("async"));
    }

    #[test]
    fn test_json_serialization() {
        let config = LanguageConfig::new();
        let json_result = config.to_json();
        assert!(json_result.is_ok());
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = LanguageConfig::new();
    let json = config.to_json()?;
    println!("{}", json);
    Ok(())
}