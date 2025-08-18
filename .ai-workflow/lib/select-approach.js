const fs = require('fs');
const path = require('path');
const ApproachSelector = require(path.join(__dirname, '..', 'intelligence-engine', 'approach-selector.js'));

const analysisPath = process.argv[2];
const outPath = process.argv[3];
const versionFromEnv = process.env.CLAUDE_FLOW_VERSION || 'alpha';

if (!analysisPath || !outPath) {
  console.error('Usage: select-approach.js <analysis.json> <out.json>');
  process.exit(1);
}

try {
  const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));
  const selector = new ApproachSelector();
  const rec = selector.selectApproach(analysis, null, analysis.taskDescription || '', versionFromEnv);
  fs.writeFileSync(outPath, JSON.stringify(rec, null, 2));
  console.log('Approach written to', outPath);
} catch (e) {
  console.error('Error selecting approach:', e.message);
  process.exit(1);
}
