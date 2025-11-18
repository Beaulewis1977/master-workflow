const fs = require('fs');
const path = require('path');
const DocumentCustomizer = require(path.join(__dirname, '..', 'intelligence-engine', 'document-customizer.js'));

const analysisPath = process.argv[2];
const approachPath = process.argv[3];

if (!analysisPath || !approachPath) {
  console.error('Usage: generate-docs.js <analysis.json> <approach.json>');
  process.exit(1);
}

function writeFileSafely(targetPath, content) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, content, 'utf8');
}

(async () => {
  try {
    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
    const approach = JSON.parse(fs.readFileSync(approachPath, 'utf8'));

    const customizer = new DocumentCustomizer(analysis, approach);
    const docs = await customizer.generateDocuments();

    // Single-file docs
    const singleDocs = ['claude', 'agentOS', 'contributing', 'deployment', 'architecture'];
    for (const key of singleDocs) {
      const doc = docs[key];
      if (doc && doc.path && doc.content) {
        writeFileSafely(path.join(process.cwd(), doc.path), doc.content);
      }
    }

    // Workflows array
    if (Array.isArray(docs.workflows)) {
      for (const wf of docs.workflows) {
        writeFileSafely(path.join(process.cwd(), wf.path), wf.content);
      }
    }

    // SPARC phases
    if (Array.isArray(docs.sparc)) {
      for (const ph of docs.sparc) {
        writeFileSafely(path.join(process.cwd(), ph.path), ph.content);
      }
    }

    // Agents
    if (docs.agents && docs.agents.files) {
      const baseDir = path.join(process.cwd(), '.claude', 'agents');
      fs.mkdirSync(baseDir, { recursive: true });
      for (const [fileName, content] of Object.entries(docs.agents.files)) {
        writeFileSafely(path.join(baseDir, fileName), content);
      }
    }

    // Slash commands
    if (docs.slashCommands && docs.slashCommands.files) {
      const cmdDir = path.join(process.cwd(), '.claude', 'commands');
      fs.mkdirSync(cmdDir, { recursive: true });
      for (const [fileName, content] of Object.entries(docs.slashCommands.files)) {
        writeFileSafely(path.join(cmdDir, fileName), content);
      }
    }

    console.log('Customized documents generated.');
  } catch (e) {
    console.error('Error generating docs:', e.message);
    process.exit(1);
  }
})();
