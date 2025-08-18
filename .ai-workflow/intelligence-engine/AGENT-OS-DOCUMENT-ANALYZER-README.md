# Agent-OS Document Analyzer

A comprehensive document analysis system for Agent-OS projects that provides intelligent document discovery, customization detection, and update strategy calculation.

## 🚀 Overview

The Agent-OS Document Analyzer is a sophisticated component designed to:

- **Analyze existing Agent-OS documents** in projects to understand their current state
- **Detect user customizations** using advanced pattern matching and AST analysis
- **Calculate intelligent update strategies** for merging new templates with existing content
- **Preserve user content** during updates while applying improvements
- **Generate comprehensive reports** on document changes and merge strategies

## 🏗️ Architecture

### Core Components

1. **Document Discovery Engine** - Finds and categorizes Agent-OS documents
2. **Analysis Pipeline** - Multi-format document analysis (Markdown, JSON, YAML, JS, Shell)
3. **Customization Detection** - Advanced pattern matching and semantic analysis
4. **Update Strategy Calculator** - Intelligent merge strategies with conflict resolution
5. **Content Preservation System** - Maintains user modifications during updates
6. **Reporting Engine** - Comprehensive analysis and merge reports

### Integration Points

- **CustomizationManager** - Advanced customization detection and preservation
- **SharedMemoryStore** - Cross-agent data sharing and caching
- **EventEmitter** - Real-time updates and event coordination

## 📊 Key Features

### Document Analysis
- **Multi-format Support**: Markdown, JSON, YAML, JavaScript, Shell, Docker
- **Agent-OS Detection**: Identifies Agent-OS managed documents and versions
- **Structure Analysis**: Parses document structure and identifies key elements
- **Metadata Extraction**: Extracts document metadata and version information

### Customization Detection
- **Pattern-based Detection**: Finds explicit customization markers
- **Structural Analysis**: Detects modifications to document structure
- **Semantic Analysis**: Identifies meaningful content changes
- **Confidence Scoring**: Ranks customizations by confidence level

### Update Strategies
- **Preserve User**: Maintains all user customizations
- **Intelligent Merge**: Smart merging with conflict resolution
- **Safe Overwrite**: Careful replacement with backup
- **Version Control**: Git-based update management
- **Incremental**: Step-by-step progressive updates

### Content Preservation
- **User Comments**: Preserves <!-- USER: --> markers
- **Custom Sections**: Maintains <!-- CUSTOM START/END --> blocks
- **Configuration Modifications**: Keeps user config changes
- **Personal Additions**: Preserves user-added content
- **Override Sections**: Maintains user overrides

## 🔧 Usage

### Basic Usage

```javascript
const AgentOSDocumentAnalyzer = require('./agent-os-document-analyzer.js');
const SharedMemoryStore = require('./shared-memory.js');
const CustomizationManager = require('./customization-manager.js');

// Initialize dependencies
const sharedMemory = new SharedMemoryStore();
const customizationManager = new CustomizationManager(sharedMemory);

// Create analyzer
const analyzer = new AgentOSDocumentAnalyzer({
  projectRoot: '/path/to/project',
  sharedMemory,
  customizationManager
});

// Analyze existing documents
const analysis = await analyzer.analyzeExistingDocs('/path/to/project', {
  recursive: true,
  detectCustomizations: true,
  analysisDepth: 'full'
});

console.log(`Found ${analysis.totalDocuments} documents`);
console.log(`Agent-OS managed: ${analysis.agentOSDocuments}`);
```

### Customization Detection

```javascript
// Detect customizations in a document
const document = {
  path: '/project/CLAUDE.md',
  content: `# Claude Configuration
  
<!-- USER: My custom comment -->
  
<!-- CUSTOM START -->
My custom section content
<!-- CUSTOM END -->`,
  type: 'markdown'
};

const customizations = await analyzer.detectCustomizations(document, {
  analyzePatterns: true,
  detectStructuralChanges: true,
  analyzeSemanticChanges: true
});

console.log(`Found ${customizations.length} customizations`);
```

### Update Strategy Calculation

```javascript
// Calculate update strategy
const existingDoc = {
  path: '/project/CLAUDE.md',
  content: '# Claude Configuration\n<!-- USER: Custom -->', 
  customizations: [...],
  type: 'markdown'
};

const newTemplate = {
  version: '2.2.0',
  content: '# Claude Configuration\n## New Section',
  changes: ['Added new section']
};

const strategy = await analyzer.calculateUpdateStrategy(existingDoc, newTemplate, {
  strategy: 'merge-intelligent',
  preserveUserContent: true,
  riskLevel: 'medium'
});

console.log(`Strategy: ${strategy.strategy}`);
console.log(`Risk: ${strategy.riskLevel}`);
```

### Content Preservation

```javascript
// Preserve user content during updates
const preservationResult = await analyzer.preserveUserContent(existingDoc, newTemplate, {
  preserveComments: true,
  preserveCustomSections: true,
  preserveConfigModifications: true
});

console.log(`Preserved ${preservationResult.preservationStrategy.customizations.length} customizations`);
console.log('Merged content:', preservationResult.mergedContent);
```

### Merge Report Generation

```javascript
// Generate comprehensive merge report
const report = await analyzer.generateMergeReport(existingDoc, newTemplate, strategy, {
  includePreview: true,
  includeRiskAnalysis: true,
  includeRecommendations: true,
  format: 'detailed'
});

console.log('Executive Summary:', report.executiveSummary);
console.log('Risk Assessment:', report.riskAssessment);
console.log('Recommendations:', report.recommendations);
```

## 📋 API Reference

### Main Methods

#### `analyzeExistingDocs(projectPath, options)`
Analyzes all Agent-OS documents in a project.

**Parameters:**
- `projectPath` (string) - Path to project root
- `options` (object) - Analysis options
  - `recursive` (boolean) - Scan subdirectories (default: true)
  - `detectCustomizations` (boolean) - Find customizations (default: true)
  - `analysisDepth` ('basic'|'standard'|'full'|'deep') - Analysis depth
  - `cacheResults` (boolean) - Cache analysis results (default: true)

**Returns:** Project analysis object with document details and statistics

#### `detectCustomizations(doc, options)`
Detects user customizations in a document.

**Parameters:**
- `doc` (object) - Document object with content and metadata
- `options` (object) - Detection options
  - `useCustomizationManager` (boolean) - Use advanced detection (default: true)
  - `analyzePatterns` (boolean) - Pattern-based detection (default: true)
  - `detectStructuralChanges` (boolean) - Structure analysis (default: true)
  - `analyzeSemanticChanges` (boolean) - Semantic analysis (default: true)

**Returns:** Array of detected customizations with confidence scores

#### `calculateUpdateStrategy(existing, newTemplate, options)`
Calculates the best strategy for updating a document.

**Parameters:**
- `existing` (object) - Current document analysis
- `newTemplate` (object) - New template to merge
- `options` (object) - Strategy options
  - `strategy` (string) - Strategy type ('preserve-user', 'merge-intelligent', etc.)
  - `preserveUserContent` (boolean) - Keep user modifications (default: true)
  - `riskLevel` ('low'|'medium'|'high') - Acceptable risk level
  - `generatePreview` (boolean) - Generate merge preview

**Returns:** Update strategy object with steps and risk assessment

#### `preserveUserContent(existing, template, options)`
Preserves user customizations when applying a new template.

**Parameters:**
- `existing` (object) - Document with customizations
- `template` (object) - New template to apply
- `options` (object) - Preservation options
  - `preserveComments` (boolean) - Keep user comments (default: true)
  - `preserveCustomSections` (boolean) - Keep custom sections (default: true)
  - `preserveConfigModifications` (boolean) - Keep config changes (default: true)

**Returns:** Merged content with preserved customizations

#### `compareDocuments(doc1, doc2, options)`
Compares two documents for differences.

**Parameters:**
- `doc1` (object) - First document
- `doc2` (object) - Second document  
- `options` (object) - Comparison options
  - `compareContent` (boolean) - Compare text content (default: true)
  - `compareStructure` (boolean) - Compare document structure (default: true)
  - `ignoreWhitespace` (boolean) - Ignore whitespace differences

**Returns:** Comparison object with differences, similarity score, and risk level

#### `extractCustomSections(content, options)`
Extracts custom sections from document content.

**Parameters:**
- `content` (string) - Document content to analyze
- `options` (object) - Extraction options
  - `includeComments` (boolean) - Include user comments (default: true)
  - `includeMarkedSections` (boolean) - Include marked sections (default: true)
  - `detectImplicitSections` (boolean) - Find implicit sections (default: false)

**Returns:** Array of custom sections with positions and types

#### `generateMergeReport(existing, template, strategy, options)`
Generates a comprehensive merge report.

**Parameters:**
- `existing` (object) - Current document
- `template` (object) - New template
- `strategy` (object) - Update strategy
- `options` (object) - Report options
  - `includePreview` (boolean) - Include merge preview (default: true)
  - `includeRiskAnalysis` (boolean) - Include risk assessment (default: true)
  - `format` ('summary'|'detailed'|'technical') - Report format

**Returns:** Detailed merge report with analysis, recommendations, and preview

## 🎯 Document Types Supported

### Markdown Documents
- Headers and structure analysis
- Code block detection
- Link and image extraction
- Custom section identification

### JSON Documents  
- Schema analysis
- Key-value extraction
- Configuration modification detection
- Package.json specific analysis

### YAML Documents
- Structure parsing
- Docker Compose analysis
- Configuration value tracking
- Comment preservation

### JavaScript/TypeScript
- Function and class detection
- Import/export analysis
- Comment-based customizations
- AST-based structure analysis

### Shell Scripts
- Function detection
- Variable analysis
- Command identification
- Environment configuration

### Docker Files
- Instruction analysis
- Base image detection
- Port and volume extraction
- Multi-stage build support

## 📈 Performance Features

### Caching System
- **Document Cache**: Stores analyzed documents for fast retrieval
- **Analysis Cache**: Caches analysis results to avoid recomputation
- **Strategy Cache**: Remembers calculated update strategies
- **Shared Memory Integration**: Cross-agent result sharing

### Event System
- **Real-time Updates**: Event-driven architecture for live updates
- **Progress Tracking**: Events for analysis progress monitoring
- **Error Handling**: Comprehensive error events and recovery
- **Integration Points**: Events for external system coordination

### Statistics Tracking
- Documents analyzed count
- Customizations detected
- Update strategies generated
- Performance metrics (timing, memory usage)
- Success/failure rates

## 🔒 Security Considerations

### Safe Analysis
- **Read-only Operations**: Analysis never modifies original files
- **Input Validation**: Comprehensive validation of all inputs
- **Path Traversal Protection**: Prevents directory traversal attacks
- **Memory Limits**: Configurable memory usage limits

### Content Safety
- **Backup Generation**: Automatic backups before modifications
- **Rollback Support**: Ability to revert changes if needed
- **Version Control Integration**: Git-based change tracking
- **Audit Trail**: Complete log of all operations

## 🚀 Advanced Features

### Intelligent Merging
- **Conflict Detection**: Identifies potential merge conflicts
- **Resolution Strategies**: Multiple conflict resolution approaches
- **Preview Generation**: Shows merge results before applying
- **Risk Assessment**: Evaluates safety of merge operations

### Customization Patterns
- **Pattern Library**: Extensive library of customization patterns
- **User Markers**: Support for custom user markers
- **Semantic Analysis**: Understanding of content meaning
- **Context Awareness**: Considers document context in analysis

### Integration Capabilities
- **Plugin Architecture**: Extensible plugin system
- **Custom Analyzers**: Support for custom document analyzers
- **External Tools**: Integration with external analysis tools
- **API Endpoints**: RESTful API for external access

## 🔧 Configuration

### Basic Configuration
```javascript
const analyzer = new AgentOSDocumentAnalyzer({
  projectRoot: '/path/to/project',
  sharedMemory: sharedMemoryInstance,
  customizationManager: customizationManagerInstance
});
```

### Advanced Configuration
```javascript
const analyzer = new AgentOSDocumentAnalyzer({
  projectRoot: '/path/to/project',
  sharedMemory: sharedMemoryInstance,
  customizationManager: customizationManagerInstance,
  
  // Analysis options
  analysisDepth: 'full',
  cacheEnabled: true,
  maxDocumentSize: 10 * 1024 * 1024, // 10MB
  
  // Pattern options
  customPatterns: [...],
  ignorePatterns: [...],
  
  // Performance options
  concurrentAnalysis: 5,
  timeoutMs: 30000
});
```

## 📊 Testing

The component includes comprehensive tests covering:

- Document discovery and type detection
- Customization detection accuracy
- Update strategy calculation
- Content preservation functionality
- Merge report generation
- Performance and statistics tracking
- Event system integration

Run tests with:
```bash
node test-agent-os-document-analyzer.js
```

## 🤝 Integration Examples

### With Queen Controller
```javascript
// In queen-controller.js
const analyzer = new AgentOSDocumentAnalyzer({
  projectRoot: this.projectRoot,
  sharedMemory: this.sharedMemory,
  customizationManager: this.customizationManager
});

// Analyze project documents
const analysis = await analyzer.analyzeExistingDocs(this.projectRoot);
await this.sharedMemory.set('project-document-analysis', analysis);
```

### With Document Generator
```javascript
// In document-generator.js
const analysisData = await this.sharedMemory.get('project-document-analysis');
const strategy = await analyzer.calculateUpdateStrategy(
  analysisData.documents['CLAUDE.md'],
  newTemplate
);
```

### With Customization Manager
```javascript
// Advanced customization detection
const customizations = await analyzer.detectCustomizations(document, {
  useCustomizationManager: true,
  analyzeSemanticChanges: true
});
```

## 📚 Best Practices

### Document Analysis
1. **Use recursive analysis** for comprehensive project coverage
2. **Enable customization detection** to preserve user content
3. **Cache results** for improved performance
4. **Set appropriate analysis depth** based on requirements

### Update Strategies
1. **Start with 'preserve-user'** strategy for safety
2. **Use 'merge-intelligent'** for complex merges
3. **Generate reports** before applying changes
4. **Create backups** before destructive operations

### Content Preservation
1. **Preserve all user comments** by default
2. **Maintain custom sections** during updates
3. **Keep configuration modifications** when possible
4. **Document preservation decisions** in reports

## 🔍 Troubleshooting

### Common Issues

#### Analysis Fails
- Check file permissions and accessibility
- Verify project path exists and is readable
- Ensure sufficient memory for large projects

#### Customizations Not Detected
- Verify customization markers are properly formatted
- Check if CustomizationManager is properly initialized
- Enable debug logging for detailed analysis

#### Merge Conflicts
- Review conflicting sections in merge report
- Use manual resolution for complex conflicts
- Consider incremental update strategy

### Debug Logging
```javascript
analyzer.on('error', (error) => {
  console.error('Analyzer error:', error);
});

analyzer.on('customizations-detected', (event) => {
  console.log('Customizations found:', event.customizations);
});
```

## 🎯 Future Enhancements

### Planned Features
- **Machine Learning Integration**: AI-powered customization detection
- **Visual Diff Interface**: Graphical merge conflict resolution
- **Template Repository**: Centralized template management
- **Real-time Collaboration**: Multi-user document editing
- **Advanced Analytics**: Usage patterns and optimization suggestions

### Extension Points
- **Custom Analyzers**: Plugin system for new document types
- **Pattern Libraries**: Extensible customization pattern system
- **Integration APIs**: RESTful endpoints for external tools
- **Workflow Automation**: Automated update workflows

---

## 📄 License

This component is part of the Agent-OS Intelligence Engine and follows the project's licensing terms.

## 🤝 Contributing

Contributions are welcome! Please follow the project's contribution guidelines and ensure all tests pass before submitting pull requests.

---

*Generated by Agent-OS Document Analyzer v1.0.0*