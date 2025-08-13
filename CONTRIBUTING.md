# Contributing Guidelines

## Development Setup

### Prerequisites
- Node.js v18+ and npm/yarn
- Python 3.8+ and pip
- Go 1.19+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd <project-name>

# Install dependencies
npm install
# or
yarn install

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

```

## Development Workflow

### Using AI Development OS
This project uses the Intelligent Workflow Decision System.

- **Approach**: Hive-Mind
- **Command**: `npx claude-flow@latest hive-mind spawn --agents 5 --claude "MASTER-WORKFLOW"`

### Code Standards
- Large codebase - maintain clear organization
- Test-driven development practices

### Testing
Run tests with: `npm test` or `pytest`

## Current Focus (active Stage)
- Adding new features
- Maintaining code quality
- Improving test coverage
- Updating documentation
