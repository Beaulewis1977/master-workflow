#!/usr/bin/env node

/**
 * MCP Server Preset Validation Script
 * Validates all preset JSON files for proper structure and required fields
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_FIELDS = [
  'name',
  'description', 
  'category',
  'version',
  'priority_level',
  'enabled_servers',
  'environment_variables',
  'recommended_tools'
];

const REQUIRED_SERVER_FIELDS = [
  'enabled',
  'priority',
  'description'
];

function validatePreset(filePath) {
  try {
    console.log(`\n🔍 Validating ${path.basename(filePath)}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const preset = JSON.parse(content);
    
    // Validate required top-level fields
    const missingFields = REQUIRED_FIELDS.filter(field => !preset[field]);
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Validate enabled_servers structure
    if (!preset.enabled_servers || typeof preset.enabled_servers !== 'object') {
      console.error('❌ enabled_servers must be an object');
      return false;
    }
    
    const serverNames = Object.keys(preset.enabled_servers);
    if (serverNames.length === 0) {
      console.error('❌ At least one server must be enabled');
      return false;
    }
    
    // Validate each server configuration
    for (const [serverName, serverConfig] of Object.entries(preset.enabled_servers)) {
      const missingServerFields = REQUIRED_SERVER_FIELDS.filter(field => 
        serverConfig[field] === undefined
      );
      
      if (missingServerFields.length > 0) {
        console.error(`❌ Server "${serverName}" missing fields: ${missingServerFields.join(', ')}`);
        return false;
      }
      
      if (typeof serverConfig.priority !== 'number' || serverConfig.priority < 1) {
        console.error(`❌ Server "${serverName}" priority must be a positive number`);
        return false;
      }
    }
    
    // Validate environment variables structure
    if (!preset.environment_variables.required || !Array.isArray(preset.environment_variables.required)) {
      console.error('❌ environment_variables.required must be an array');
      return false;
    }
    
    console.log(`✅ ${path.basename(filePath)} is valid`);
    console.log(`   - Servers: ${serverNames.length}`);
    console.log(`   - Required env vars: ${preset.environment_variables.required.length}`);
    console.log(`   - Optional env vars: ${preset.environment_variables.optional?.length || 0}`);
    console.log(`   - Tools: ${preset.recommended_tools.length}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ Error validating ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🚀 MCP Server Preset Validation\n');
  
  const presetsDir = __dirname;
  const presetFiles = fs.readdirSync(presetsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => path.join(presetsDir, file));
  
  if (presetFiles.length === 0) {
    console.error('❌ No preset files found');
    process.exit(1);
  }
  
  console.log(`Found ${presetFiles.length} preset files to validate`);
  
  let validCount = 0;
  let totalCount = presetFiles.length;
  
  for (const filePath of presetFiles) {
    if (validatePreset(filePath)) {
      validCount++;
    }
  }
  
  console.log(`\n📊 Validation Summary:`);
  console.log(`   ✅ Valid: ${validCount}/${totalCount}`);
  console.log(`   ❌ Invalid: ${totalCount - validCount}/${totalCount}`);
  
  if (validCount === totalCount) {
    console.log('\n🎉 All presets are valid!');
    process.exit(0);
  } else {
    console.log('\n💥 Some presets have issues that need to be fixed');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validatePreset };