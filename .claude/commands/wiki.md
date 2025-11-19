---
description: Generate or update project wiki with comprehensive documentation
argument-hint: "[--update] [--diagrams] [--full]"
allowed-tools: Read, Write, Grep, Glob, LS, Bash, Task
---

# Wiki Generation

Automatically generate a complete repository wiki with documentation, diagrams, and guides.

## What This Creates

**Wiki Directory** (`wiki/` in project root):
- `Home.md` - Wiki homepage with project overview
- `Getting-Started.md` - Quick start guide for new contributors
- `Architecture.md` - Detailed architecture documentation
- `Development-Guide.md` - Development workflow and guidelines
- `API-Reference.md` - API endpoints and usage examples

**Optional Additions** (with flags):
- Mermaid diagrams (architecture, data flow, deployment)
- Complete codebase analysis
- Auto-generated API documentation
- Build phase documentation
- Tech stack deep-dive

## Usage

```bash
# Generate basic wiki
/wiki

# Update existing wiki (preserves custom changes)
/wiki --update

# Generate with architecture diagrams
/wiki --diagrams

# Full wiki with all documentation
/wiki --full
```

## How It Works

1. **Analyzes Project**:
   - Reads existing documentation (README, docs/)
   - Scans codebase for tech stack
   - Detects architecture patterns
   - Identifies key features

2. **Extracts Information**:
   - Project name and description
   - Tech stack (languages, frameworks, databases)
   - Build phase (planning → development → testing → release)
   - Existing features and constraints

3. **Generates Wiki**:
   - Creates `wiki/` directory
   - Generates all wiki pages with real project data
   - Links to existing documentation
   - Creates architecture diagrams (if requested)

4. **Smart Updates**:
   - With `--update`, only refreshes outdated pages
   - Preserves manual edits in custom sections
   - Adds new pages for new features

## Example Output

```
wiki/
├── Home.md                  # Project overview, quick links
├── Getting-Started.md       # Installation, first steps
├── Architecture.md          # System design, components
├── Development-Guide.md     # Coding standards, workflow
├── API-Reference.md         # Endpoints, examples
└── diagrams/                # (with --diagrams)
    ├── architecture.mmd
    ├── data-flow.mmd
    └── deployment.mmd
```

## Integration with GitHub

The generated wiki/ directory is compatible with GitHub's wiki system:
1. Create wiki on GitHub (Settings → Wiki → Create)
2. Clone wiki repo: `git clone https://github.com/user/repo.wiki.git`
3. Copy generated files: `cp -r wiki/* repo.wiki/`
4. Push: `cd repo.wiki && git add . && git commit -m "Auto-generated wiki" && git push`

## Customization

The wiki generator uses ProjectBootstrapAgent which:
- Reads your existing docs to understand the project
- Asks clarifying questions if information is missing
- Generates content based on actual codebase analysis
- Updates automatically when you add new features

## Smart Features

- **Tech Stack Detection**: Automatically detects languages, frameworks
- **Build Phase Detection**: Determines where project is in lifecycle
- **Feature Extraction**: Finds features from README and docs
- **Architecture Inference**: Analyzes directory structure
- **Diagram Generation**: Creates Mermaid diagrams from architecture

## When to Use

- ✅ New project: Generate complete wiki immediately
- ✅ Existing project: Create missing documentation
- ✅ Before release: Ensure complete documentation
- ✅ After major changes: Update wiki to reflect changes
- ✅ For contributors: Provide comprehensive onboarding

Use the ProjectBootstrapAgent to execute wiki generation with full intelligence.
