# Python Machine Learning Project Template Customization Example

## Input: Python ML Project Detection

```bash
# Project structure detected:
src/
├── data/
│   ├── raw/
│   ├── processed/
│   └── external/
├── models/
│   ├── __init__.py
│   ├── train.py
│   └── predict.py
├── features/
│   ├── build_features.py
│   └── preprocessing.py
├── visualization/
│   └── visualize.py
├── notebooks/
│   ├── exploratory_analysis.ipynb
│   └── model_evaluation.ipynb
├── requirements.txt
├── setup.py
└── config.yaml
```

```python
# requirements.txt dependencies detected:
tensorflow==2.13.0
scikit-learn==1.3.0
pandas==2.0.3
numpy==1.24.3
matplotlib==3.7.2
jupyter==1.0.0
mlflow==2.5.0
pytest==7.4.0
```

## Analysis Results

```javascript
// Automated analysis output:
{
  "complexity": 60,
  "stage": "active",
  "languages": ["Python"],
  "frameworks": ["TensorFlow", "Scikit-learn", "MLflow"],
  "databases": ["File-based", "MLflow Tracking"],
  "testingTools": ["Pytest"],
  "patterns": {
    "notebooks": ["exploratory_analysis", "model_evaluation"],
    "dataScience": ["pandas", "numpy", "matplotlib"],
    "ml": ["tensorflow", "scikit-learn"],
    "mlops": ["mlflow"],
    "config": ["yaml"]
  },
  "architecture": "ml-pipeline"
}
```

## Generated CLAUDE.md

```markdown
# Claude Configuration - Python ML Project (active Stage)

## Phase 3 Complete: Deep Analysis & Document Generation ✅
- **Implementation Date**: August 14, 2025
- **Implementer**: Claude (Autonomous Workflow System)
- **Status**: Successfully completed with ML pipeline analysis

### Queen Controller Features
- **8 Concurrent Sub-Agents**: Specialized for ML workflow
- **200k Context Windows**: Each agent tracks individual context
- **Hierarchical Management**: Queen Controller orchestrates all agents
- **Shared Memory Store**: Cross-agent data sharing with SQLite persistence
- **Event-Driven Architecture**: Real-time agent coordination

## Project Analysis
- **Complexity Score**: 60/100
- **Stage**: active
- **Selected Approach**: hive-mind
- **Architecture**: ml-pipeline
- **Command**: `npx --yes claude-flow@latest hive-mind spawn "ML-Pipeline" --agents 8 --claude`

## Technology Stack
### Languages
- Python 3.9+

### ML Frameworks
- TensorFlow 2.13
- Scikit-learn 1.3
- MLflow 2.5

### Data Science Libraries
- Pandas 2.0
- NumPy 1.24
- Matplotlib 3.7

## Sub-Agent Architecture & Responsibilities

### 1. complexity-analyzer-agent
- Data pipeline complexity assessment
- Model architecture analysis
- Feature engineering complexity
- Training pipeline optimization

### 2. code-analyzer-agent
- Python code quality (PEP 8)
- Import optimization
- Function extraction opportunities
- Type hint implementation

### 3. data-scientist-agent
- Exploratory data analysis
- Feature engineering strategies
- Model selection and tuning
- Statistical validation

### 4. ml-engineer-agent
- Model training pipeline setup
- Hyperparameter optimization
- Model versioning with MLflow
- Production deployment strategies

### 5. database-architect-agent
- Data storage optimization
- Data versioning strategies
- Feature store implementation
- ETL pipeline design

### 6. security-scanner-agent
- Data privacy compliance (GDPR)
- Model security vulnerabilities
- Dependency vulnerability scanning
- Secure model serving

### 7. performance-optimizer-agent
- Training performance optimization
- Memory usage optimization
- GPU utilization analysis
- Inference speed optimization

### 8. doc-generator-agent
- Model documentation
- Data schema documentation
- API documentation
- Experiment tracking documentation

## MCP Server Configuration
### Active Servers (18/87)

#### ESSENTIAL
- context7: {"enabled":true}
- filesystem: {"enabled":true}
- git: {"enabled":true}

#### DEVELOPMENT
- github: {"enabled":true}
- pip: {"enabled":true}
- docker: {"enabled":true}

#### DATABASE
- postgres: {"enabled":true}
- mongodb: {"enabled":true}

#### CLOUD
- aws: {"enabled":true}
- gcp: {"enabled":true}
- s3: {"enabled":true}

#### AI_ML
- openai: {"enabled":true}
- anthropic: {"enabled":true}
- huggingface: {"enabled":true}
- mlflow: {"enabled":true}

#### TESTING
- pytest: {"enabled":true}

## Project-Specific Instructions
- Follow PEP 8 style guide with type hints
- Use virtual environments (conda/venv)
- Implement proper experiment tracking with MLflow
- Version control data with DVC
- Use configuration files (YAML/JSON) for hyperparameters
- Implement proper data validation and preprocessing
- Follow ML engineering best practices for reproducibility
- Use Jupyter notebooks for exploration, Python scripts for production
- Implement proper logging and monitoring
- Follow data science project structure (cookiecutter)

## ML Pipeline Workflow Configuration
### hive-mind Workflow
1. Queen Controller initialization with ML focus
2. Data ingestion and validation
3. Feature engineering and selection
4. Model training with hyperparameter tuning
5. Model evaluation and validation
6. Model deployment and monitoring
7. Continuous integration for ML

## Quality Metrics
- **Test Coverage Target**: 85%+ (including data tests)
- **Model Performance**: Track accuracy, precision, recall, F1
- **Data Quality**: Implement data validation tests
- **Documentation Coverage**: Document all experiments and models

## ML-Specific Development Guidelines

### Data Management
- Implement data versioning with DVC
- Use data validation with Great Expectations
- Implement feature stores for reusable features
- Follow FAIR principles (Findable, Accessible, Interoperable, Reusable)

### Model Development
- Use MLflow for experiment tracking
- Implement proper model versioning
- Use configuration files for hyperparameters
- Implement automated model validation

### Code Quality
- Type hints for all functions
- Docstrings following numpy/google style
- Unit tests for data processing functions
- Integration tests for model pipelines

### Reproducibility
- Pin all dependency versions
- Use seeds for random operations
- Environment configuration with conda/docker
- Version control all code and configurations

### Production Deployment
- Model serving with FastAPI/Flask
- Container deployment with Docker
- Model monitoring and drift detection
- A/B testing framework for model comparison

---

*Generated by CLAUDE.md Generator v3.0*
*Date: 2025-08-14T20:30:45.000Z*
*Phase 3: Deep Analysis & Document Generation Complete*
```

## Agent Configuration Customization

```javascript
// Generated agent assignments for ML project:
const mlAgentAssignments = new Map([
  ['data-scientist-agent', [
    'Exploratory data analysis and visualization',
    'Statistical hypothesis testing',
    'Feature engineering and selection',
    'Model selection and evaluation',
    'Cross-validation strategies'
  ]],
  
  ['ml-engineer-agent', [
    'ML pipeline development and optimization',
    'Hyperparameter tuning with Optuna/Hyperopt',
    'Model training automation',
    'MLflow experiment tracking setup',
    'Model deployment and serving'
  ]],
  
  ['database-architect-agent', [
    'Data lake/warehouse architecture design',
    'Feature store implementation',
    'Data pipeline optimization (ETL/ELT)',
    'Data versioning with DVC',
    'Query optimization for large datasets'
  ]],
  
  ['performance-optimizer-agent', [
    'Training performance optimization (GPU/TPU)',
    'Memory usage optimization for large models',
    'Batch processing optimization',
    'Inference speed optimization',
    'Distributed training setup'
  ]],
  
  ['security-scanner-agent', [
    'Data privacy and GDPR compliance',
    'Model security and adversarial attacks',
    'Dependency vulnerability scanning',
    'Secure model serving practices',
    'Data anonymization techniques'
  ]],
  
  ['code-analyzer-agent', [
    'Python code quality and PEP 8 compliance',
    'Type hint implementation',
    'Function extraction and optimization',
    'Import dependency analysis',
    'Code complexity reduction'
  ]],
  
  ['doc-generator-agent', [
    'Model card generation',
    'Data schema documentation',
    'API documentation for model serving',
    'Experiment documentation with MLflow',
    'Model performance reports'
  ]],
  
  ['recovery-specialist-agent', [
    'Training failure recovery strategies',
    'Data pipeline error handling',
    'Model rollback procedures',
    'Monitoring and alerting setup',
    'Experiment reproduction procedures'
  ]]
]);
```

## MCP Server Selection Logic

```javascript
// ML project specific MCP server selection:
function selectMCPServersForML(analysis) {
  const servers = new Set(['context7', 'filesystem', 'git']); // Always include
  
  // Python specific
  servers.add('pip'); // Package management
  servers.add('github'); // Version control
  
  // ML/AI platforms
  if (analysis.frameworks.includes('TensorFlow')) {
    servers.add('tensorflow');
  }
  if (analysis.frameworks.includes('PyTorch')) {
    servers.add('pytorch');
  }
  
  // MLOps tools
  servers.add('mlflow'); // Experiment tracking
  servers.add('dvc'); // Data versioning
  
  // Cloud ML services
  if (analysis.patterns.cloud.aws) {
    servers.add('aws');
    servers.add('sagemaker');
  }
  if (analysis.patterns.cloud.gcp) {
    servers.add('gcp');
    servers.add('vertex-ai');
  }
  
  // Data storage
  servers.add('s3'); // Data storage
  servers.add('postgres'); // Structured data
  servers.add('mongodb'); // Unstructured data
  
  // AI/ML services
  servers.add('huggingface'); // Pre-trained models
  servers.add('openai'); // LLM integration
  
  // Monitoring
  servers.add('prometheus'); // Metrics
  servers.add('grafana'); // Visualization
  
  // Testing
  servers.add('pytest'); // Python testing
  
  return Array.from(servers);
}
```

## Specialized ML Workflow Commands

```bash
# Initial ML project setup:
npx claude-flow@2.0.0 hive-mind spawn "ML-Pipeline" --agents 8 --ml --claude

# Data pipeline workflow:
npx claude-flow@2.0.0 data-pipeline --validate --version

# Model training workflow:
npx claude-flow@2.0.0 train --experiment-tracking --hyperparameter-tuning

# Model evaluation:
npx claude-flow@2.0.0 evaluate --cross-validation --metrics-tracking

# Model deployment:
npx claude-flow@2.0.0 deploy --model-serving --monitoring

# Experiment comparison:
npx claude-flow@2.0.0 compare-experiments --mlflow --visualize
```

## Generated Python Configuration Files

```python
# config/model_config.py (auto-generated)
from dataclasses import dataclass
from typing import Dict, List, Optional

@dataclass
class ModelConfig:
    """Model configuration with type hints and validation"""
    model_type: str = "tensorflow"
    hidden_layers: List[int] = None
    learning_rate: float = 0.001
    batch_size: int = 32
    epochs: int = 100
    validation_split: float = 0.2
    
    def __post_init__(self):
        if self.hidden_layers is None:
            self.hidden_layers = [128, 64, 32]
```

```python
# src/utils/logging_config.py (auto-generated)
import logging
import mlflow
from typing import Any, Dict

class MLLogger:
    """Unified logging for ML experiments"""
    
    def __init__(self, experiment_name: str):
        self.experiment_name = experiment_name
        mlflow.set_experiment(experiment_name)
        
    def log_params(self, params: Dict[str, Any]):
        """Log model parameters"""
        mlflow.log_params(params)
        
    def log_metrics(self, metrics: Dict[str, float], step: int = None):
        """Log model metrics"""
        mlflow.log_metrics(metrics, step=step)
```

This Python ML project example shows how Claude Flow 2.0 automatically:

1. **Detects ML patterns** - TensorFlow/PyTorch, Jupyter notebooks, MLflow
2. **Configures ML-specific agents** - Data scientist, ML engineer, performance optimizer
3. **Sets up MLOps tools** - MLflow tracking, DVC versioning, model serving
4. **Generates ML-specific configurations** - Model configs, logging, monitoring
5. **Selects ML workflow approach** - Hive-mind with 8 specialized agents
6. **Configures ML deployment pipeline** - Cloud ML services, model serving APIs