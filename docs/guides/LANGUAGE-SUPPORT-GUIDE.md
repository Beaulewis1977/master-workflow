# MASTER-WORKFLOW v3.0 Language Support Guide

## Overview

MASTER-WORKFLOW v3.0 provides comprehensive support for 16+ programming languages with intelligent template systems, best practices enforcement, and seamless multi-language project coordination through the Queen Controller architecture.

## Table of Contents

1. [Supported Languages](#supported-languages)
2. [Language Architecture](#language-architecture)
3. [Template System](#template-system)
4. [Setup Instructions](#setup-instructions)
5. [Language-Specific Workflows](#language-specific-workflows)
6. [Multi-Language Projects](#multi-language-projects)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Supported Languages

### Tier 1: Full Configuration Support
| Language | Version | Runtime | Package Manager | Template Status |
|----------|---------|---------|-----------------|-----------------|
| **JavaScript** | ES2023 | Node.js 18.x+ | npm/yarn/pnpm/bun | ✅ Complete |
| **TypeScript** | 5.0+ | Node.js 18.x+ | npm/yarn/pnpm/bun | ✅ Complete |
| **Go** | 1.21+ | Native | go modules | ✅ Complete |
| **Rust** | 1.70+ | Native | Cargo | ✅ Complete |
| **Java** | 17+ | JVM | Maven/Gradle | ✅ Complete |

### Tier 2: Basic Support
| Language | Status | Notes |
|----------|--------|-------|
| **Python** | 🔄 In Progress | Template available, config pending |
| **C++** | 🔄 Basic | Directory structure only |
| **C#** | 🔄 Basic | .NET 6.0+ target |
| **PHP** | 🔄 Basic | PSR-12 standards |
| **Ruby** | 🔄 Basic | Ruby 3.0+ target |
| **Swift** | 🔄 Basic | Swift 5.5+ target |
| **Kotlin** | 🔄 Basic | JVM/Native target |
| **Scala** | 🔄 Basic | Scala 3.x target |
| **Dart** | 🔄 Basic | Flutter/Native support |
| **Elixir** | 🔄 Basic | OTP 25+ target |
| **R** | 🔄 Basic | Data science focus |

## Language Architecture

### Directory Structure
```
language-support/
├── {language}/
│   ├── config.json          # Language configuration
│   ├── template.{ext}        # Code template
│   ├── best-practices.md     # Language-specific guidelines
│   ├── workflows/            # Workflow patterns
│   └── examples/             # Sample implementations
```

### Configuration Schema
Each language follows a standardized configuration format:

```json
{
  "name": "Language Name",
  "version": "Latest Version",
  "runtime": "Runtime Environment",
  "runtimeVersions": ["supported", "versions"],
  "features": {
    "staticTyping": true,
    "compilation": true,
    "concurrency": true
  },
  "packageManagement": {
    "primary": "main-tool",
    "alternatives": ["alternative", "tools"],
    "registry": "package-registry-url",
    "lockFiles": ["lock", "files"]
  },
  "commonDependencies": {
    "dev": ["development", "packages"],
    "production": ["runtime", "packages"]
  },
  "fileStructure": {
    "src": "Source code directory",
    "dist": "Build output directory"
  },
  "bestPractices": [
    "Practice 1",
    "Practice 2"
  ]
}
```

## Template System

### JavaScript/TypeScript Templates

#### JavaScript ES6+ Template
```javascript
/**
 * @fileoverview Modern JavaScript template with best practices
 * @author MASTER-WORKFLOW v3.0
 */

'use strict';

import { logger } from './utils/logger.js';
import { config } from './config/environment.js';

/**
 * Main application class following ES6+ patterns
 */
class Application {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.initialized = false;
  }

  /**
   * Initialize application with async/await pattern
   */
  async initialize() {
    try {
      logger.info('Initializing application...');
      
      // Setup application components
      await this.setupComponents();
      
      this.initialized = true;
      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * Setup application components
   */
  async setupComponents() {
    // Implementation here
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    if (this.initialized) {
      logger.info('Shutting down application...');
      // Cleanup resources
      this.initialized = false;
    }
  }
}

export default Application;
```

#### TypeScript Template
```typescript
/**
 * @fileoverview TypeScript template with strict typing
 * @author MASTER-WORKFLOW v3.0
 */

import { Logger } from './utils/logger';
import { Config, ApplicationOptions } from './types/config';

/**
 * Application configuration interface
 */
interface AppConfig extends Config {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
}

/**
 * Main application class with strict TypeScript typing
 */
class Application {
  private readonly config: AppConfig;
  private initialized: boolean = false;
  private readonly logger: Logger;

  constructor(options: ApplicationOptions = {}) {
    this.config = { ...defaultConfig, ...options };
    this.logger = new Logger(this.config.logLevel);
  }

  /**
   * Initialize application with proper error handling
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing application...');
      
      await this.setupComponents();
      
      this.initialized = true;
      this.logger.info('Application initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application:', error);
      throw new Error(`Initialization failed: ${error.message}`);
    }
  }

  /**
   * Setup application components
   */
  private async setupComponents(): Promise<void> {
    // Implementation with proper typing
  }

  /**
   * Get application status
   */
  getStatus(): { initialized: boolean; config: AppConfig } {
    return {
      initialized: this.initialized,
      config: { ...this.config }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.initialized) {
      this.logger.info('Shutting down application...');
      // Cleanup resources
      this.initialized = false;
    }
  }
}

export default Application;
export type { AppConfig, ApplicationOptions };
```

### Go Template
```go
// Package main provides a Go application template following best practices
// Generated by MASTER-WORKFLOW v3.0
package main

import (
    "context"
    "fmt"
    "log"
    "os"
    "os/signal"
    "sync"
    "syscall"
    "time"
)

// Application represents the main application structure
type Application struct {
    config      *Config
    logger      *log.Logger
    initialized bool
    mu          sync.RWMutex
}

// Config holds application configuration
type Config struct {
    Name        string `json:"name"`
    Version     string `json:"version"`
    Environment string `json:"environment"`
    Port        int    `json:"port"`
}

// NewApplication creates a new application instance
func NewApplication(cfg *Config) *Application {
    return &Application{
        config: cfg,
        logger: log.New(os.Stdout, "[APP] ", log.LstdFlags),
    }
}

// Initialize sets up the application with proper error handling
func (a *Application) Initialize(ctx context.Context) error {
    a.mu.Lock()
    defer a.mu.Unlock()

    a.logger.Println("Initializing application...")

    if err := a.setupComponents(ctx); err != nil {
        return fmt.Errorf("failed to setup components: %w", err)
    }

    a.initialized = true
    a.logger.Println("Application initialized successfully")
    
    return nil
}

// setupComponents initializes application components
func (a *Application) setupComponents(ctx context.Context) error {
    // Component setup implementation
    return nil
}

// Run starts the application with graceful shutdown
func (a *Application) Run(ctx context.Context) error {
    if !a.initialized {
        return fmt.Errorf("application not initialized")
    }

    // Setup signal handling for graceful shutdown
    sigChan := make(chan os.Signal, 1)
    signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

    a.logger.Printf("Application %s v%s started", a.config.Name, a.config.Version)

    // Main application loop
    select {
    case <-ctx.Done():
        a.logger.Println("Context cancelled, shutting down...")
    case sig := <-sigChan:
        a.logger.Printf("Received signal %v, shutting down...", sig)
    }

    return a.Shutdown()
}

// Shutdown gracefully shuts down the application
func (a *Application) Shutdown() error {
    a.mu.Lock()
    defer a.mu.Unlock()

    if !a.initialized {
        return nil
    }

    a.logger.Println("Shutting down application...")
    
    // Cleanup resources
    
    a.initialized = false
    a.logger.Println("Application shut down completed")
    
    return nil
}

// IsInitialized returns the initialization status
func (a *Application) IsInitialized() bool {
    a.mu.RLock()
    defer a.mu.RUnlock()
    return a.initialized
}

func main() {
    config := &Config{
        Name:        "MASTER-WORKFLOW App",
        Version:     "3.0.0",
        Environment: "development",
        Port:        8080,
    }

    app := NewApplication(config)
    
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    if err := app.Initialize(ctx); err != nil {
        log.Fatalf("Failed to initialize application: %v", err)
    }

    if err := app.Run(ctx); err != nil {
        log.Fatalf("Application error: %v", err)
    }
}
```

### Rust Template
```rust
//! MASTER-WORKFLOW v3.0 Rust application template
//! Following Rust best practices and conventions

use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tracing::{info, error, warn};

/// Application configuration structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub name: String,
    pub version: String,
    pub environment: String,
    pub port: u16,
}

/// Main application state
pub struct Application {
    config: Config,
    initialized: Arc<RwLock<bool>>,
}

impl Application {
    /// Create a new application instance
    pub fn new(config: Config) -> Self {
        Self {
            config,
            initialized: Arc::new(RwLock::new(false)),
        }
    }

    /// Initialize the application with proper error handling
    pub async fn initialize(&self) -> Result<()> {
        info!("Initializing application...");

        self.setup_components()
            .await
            .context("Failed to setup components")?;

        let mut initialized = self.initialized.write().await;
        *initialized = true;

        info!("Application initialized successfully");
        Ok(())
    }

    /// Setup application components
    async fn setup_components(&self) -> Result<()> {
        // Component setup implementation
        Ok(())
    }

    /// Run the application with graceful shutdown
    pub async fn run(&self) -> Result<()> {
        let initialized = self.initialized.read().await;
        if !*initialized {
            anyhow::bail!("Application not initialized");
        }
        drop(initialized);

        info!(
            "Application {} v{} started",
            self.config.name, self.config.version
        );

        // Setup signal handling
        let mut sigterm = tokio::signal::unix::signal(
            tokio::signal::unix::SignalKind::terminate()
        )?;
        let mut sigint = tokio::signal::unix::signal(
            tokio::signal::unix::SignalKind::interrupt()
        )?;

        // Main application loop
        tokio::select! {
            _ = sigterm.recv() => {
                warn!("Received SIGTERM, shutting down...");
            }
            _ = sigint.recv() => {
                warn!("Received SIGINT, shutting down...");
            }
        }

        self.shutdown().await
    }

    /// Gracefully shutdown the application
    pub async fn shutdown(&self) -> Result<()> {
        let mut initialized = self.initialized.write().await;
        
        if !*initialized {
            return Ok(());
        }

        info!("Shutting down application...");
        
        // Cleanup resources
        
        *initialized = false;
        info!("Application shutdown completed");
        
        Ok(())
    }

    /// Check if application is initialized
    pub async fn is_initialized(&self) -> bool {
        *self.initialized.read().await
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt::init();

    let config = Config {
        name: "MASTER-WORKFLOW App".to_string(),
        version: "3.0.0".to_string(),
        environment: "development".to_string(),
        port: 8080,
    };

    let app = Application::new(config);
    
    app.initialize()
        .await
        .context("Failed to initialize application")?;
    
    app.run()
        .await
        .context("Application runtime error")?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_application_lifecycle() {
        let config = Config {
            name: "Test App".to_string(),
            version: "1.0.0".to_string(),
            environment: "test".to_string(),
            port: 3000,
        };

        let app = Application::new(config);
        
        assert!(!app.is_initialized().await);
        
        app.initialize().await.unwrap();
        assert!(app.is_initialized().await);
        
        app.shutdown().await.unwrap();
        assert!(!app.is_initialized().await);
    }
}
```

## Setup Instructions

### Quick Start
1. **Initialize Language Support**:
   ```bash
   # Navigate to project root
   cd /path/to/your/project
   
   # Initialize MASTER-WORKFLOW with language support
   npx --yes claude-flow@latest hive-mind spawn "PROJECT-NAME" --sparc --agents 10 --claude
   ```

2. **Select Primary Language**:
   ```bash
   # The system will auto-detect or prompt for language selection
   # Based on existing files and project structure
   ```

3. **Configure Language Settings**:
   ```bash
   # Edit language-specific configuration
   nano language-support/{language}/config.json
   ```

### Language-Specific Setup

#### JavaScript/TypeScript Setup
```bash
# Install dependencies
npm install

# Setup TypeScript (if using)
npm install -D typescript @types/node ts-node

# Initialize TypeScript config
npx tsc --init

# Setup ESLint and Prettier
npm install -D eslint prettier @typescript-eslint/eslint-plugin
```

#### Go Setup
```bash
# Initialize Go module
go mod init your-project-name

# Install common dependencies
go get github.com/gin-gonic/gin
go get github.com/joho/godotenv
go get github.com/stretchr/testify

# Format and lint
go fmt ./...
go vet ./...
```

#### Rust Setup
```bash
# Initialize Cargo project
cargo init --name your-project-name

# Add common dependencies to Cargo.toml
echo '[dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"
tracing = "0.1"
tracing-subscriber = "0.3"' >> Cargo.toml

# Build and test
cargo build
cargo test
```

#### Java Setup
```bash
# Using Maven
mvn archetype:generate -DgroupId=com.example -DartifactId=your-project

# Using Gradle
gradle init --type java-application

# Setup Spring Boot (if applicable)
curl https://start.spring.io/starter.zip \
  -d dependencies=web,jpa,h2 \
  -d name=your-project \
  -o project.zip && unzip project.zip
```

## Language-Specific Workflows

### Multi-Language Detection
MASTER-WORKFLOW automatically detects project languages and configures workflows accordingly:

```javascript
// Example: Automatic language detection
const projectLanguages = await detectProjectLanguages();
// Returns: ["javascript", "typescript", "python", "go"]

const workflowConfig = await generateWorkflowConfig(projectLanguages);
// Generates optimized workflow for detected languages
```

### Cross-Language Integration Patterns

#### JavaScript/TypeScript + Go Backend
```yaml
# .master-workflow/config.yml
languages:
  primary: typescript
  secondary: [go]
  
integration:
  api_bridge: true
  shared_types: true
  build_order: [go, typescript]
  
workflows:
  development:
    - build_go_backend
    - start_typescript_dev_server
    - run_integration_tests
```

#### Python + Rust Performance Components
```yaml
# .master-workflow/config.yml
languages:
  primary: python
  secondary: [rust]
  
integration:
  native_extensions: true
  pyo3_bindings: true
  shared_data_structures: true
```

## Multi-Language Projects

### Project Structure for Multi-Language
```
project-root/
├── .master-workflow/
│   ├── config.yml
│   └── language-matrix.json
├── backend/                    # Go/Rust/Java backend
│   ├── cmd/
│   ├── internal/
│   └── api/
├── frontend/                   # JavaScript/TypeScript frontend
│   ├── src/
│   ├── public/
│   └── components/
├── shared/                     # Shared types/schemas
│   ├── proto/                  # Protocol buffers
│   ├── types/                  # TypeScript definitions
│   └── models/                 # Data models
├── scripts/                    # Build and deployment scripts
│   ├── build-all.sh
│   ├── test-all.sh
│   └── deploy.sh
└── docs/                       # Documentation
    ├── api/
    └── architecture/
```

### Language Coordination

#### Build Pipeline Coordination
```bash
#!/bin/bash
# scripts/build-all.sh

echo "Building multi-language project..."

# Build backend (Go example)
echo "Building Go backend..."
cd backend && go build -o ../dist/server ./cmd/server

# Build frontend (TypeScript example)
echo "Building TypeScript frontend..."
cd frontend && npm run build

# Generate shared types
echo "Generating shared types..."
./scripts/generate-types.sh

echo "Build complete!"
```

#### Test Coordination
```bash
#!/bin/bash
# scripts/test-all.sh

# Run backend tests
echo "Running backend tests..."
cd backend && go test ./...

# Run frontend tests
echo "Running frontend tests..."
cd frontend && npm test

# Run integration tests
echo "Running integration tests..."
./scripts/integration-tests.sh
```

## Best Practices

### Universal Best Practices

#### Code Organization
1. **Consistent Directory Structure**: Follow language conventions while maintaining project-wide consistency
2. **Clear Separation of Concerns**: Separate business logic, data access, and presentation layers
3. **Configuration Management**: Use environment-specific configuration files
4. **Documentation Standards**: Maintain comprehensive documentation for all components

#### Error Handling
```javascript
// JavaScript/TypeScript
try {
  const result = await riskyOperation();
  return processResult(result);
} catch (error) {
  logger.error('Operation failed:', error);
  throw new CustomError('Failed to process', { cause: error });
}
```

```go
// Go
func riskyOperation() (*Result, error) {
    result, err := someOperation()
    if err != nil {
        return nil, fmt.Errorf("operation failed: %w", err)
    }
    return processResult(result), nil
}
```

```rust
// Rust
async fn risky_operation() -> Result<ProcessedResult> {
    let result = some_operation()
        .await
        .context("Operation failed")?;
    
    Ok(process_result(result))
}
```

#### Testing Standards
- **Unit Tests**: >80% code coverage
- **Integration Tests**: Test component interactions
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Benchmark critical paths

### Language-Specific Best Practices

#### JavaScript/TypeScript
- Use ES6+ features (async/await, destructuring, modules)
- Implement strict TypeScript configuration
- Use ESLint and Prettier for code quality
- Prefer functional programming patterns
- Implement proper error boundaries

#### Go
- Follow effective Go guidelines
- Use context for cancellation and timeouts
- Implement proper error wrapping
- Use interfaces for abstraction
- Write benchmarks for performance-critical code

#### Rust
- Leverage ownership and borrowing effectively
- Use Result<T, E> for error handling
- Implement comprehensive tests and documentation
- Use clippy for additional linting
- Follow Rust API guidelines

#### Java
- Follow Java coding conventions
- Use modern Java features (records, sealed classes, pattern matching)
- Implement proper exception handling
- Use dependency injection frameworks
- Write comprehensive JavaDoc

## Troubleshooting

### Common Issues

#### Language Detection Problems
```bash
# Force language detection refresh
npx claude-flow refresh-languages

# Manual language configuration
npx claude-flow configure-language --primary=typescript --secondary=go,rust
```

#### Build Conflicts
```bash
# Check for conflicting dependencies
npx claude-flow check-conflicts

# Resolve version conflicts
npx claude-flow resolve-versions --auto
```

#### Template Issues
```bash
# Regenerate language templates
npx claude-flow regenerate-templates --language=all

# Update to latest templates
npx claude-flow update-templates
```

### Performance Optimization

#### Build Performance
- Use parallel builds for independent components
- Implement incremental compilation
- Cache dependencies and build artifacts
- Use build tools specific to each language

#### Runtime Performance
- Profile applications using language-specific tools
- Implement proper caching strategies
- Use connection pooling for databases
- Monitor memory usage and garbage collection

### Integration Issues

#### Cross-Language Communication
```javascript
// Example: TypeScript to Go API integration
interface ApiClient {
  async callGoBackend(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`/api/v1/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

#### Shared Type Definitions
```typescript
// shared/types/common.ts
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

## Advanced Features

### Neural Learning Integration
MASTER-WORKFLOW v3.0 includes neural learning capabilities that:
- Optimize language-specific build processes
- Predict optimal agent selection for language tasks
- Learn from project patterns to improve recommendations
- Share knowledge across multi-language projects

### Queen Controller Coordination
The Queen Controller orchestrates multi-language workflows by:
- Distributing tasks based on language expertise
- Managing dependencies between language components
- Coordinating build and test pipelines
- Monitoring cross-language integration health

## Support and Resources

### Documentation
- Language-specific guides: `/language-support/{language}/`
- Best practices: `/language-support/{language}/best-practices.md`
- Examples: `/language-support/{language}/examples/`

### Community Resources
- GitHub Issues: Report language-specific problems
- Discord Community: Real-time support and discussions
- Documentation Wiki: Community-contributed guides

### Professional Support
- Enterprise Support: Priority support for commercial projects
- Custom Language Integration: Support for additional languages
- Training and Consulting: Best practices implementation

---

**MASTER-WORKFLOW v3.0** - Empowering multi-language development with AI-driven orchestration.

*Generated by Claude (Documentation Generator) - August 13, 2025*