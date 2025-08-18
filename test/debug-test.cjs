#!/usr/bin/env node

console.log('Starting debug test...');

try {
  const fs = require('fs').promises;
  const path = require('path');
  const os = require('os');
  
  console.log('Basic requires successful');
  
  // Try to import Phase 6 components
  console.log('Attempting to import Queen Controller...');
  const QueenController = require('../intelligence-engine/queen-controller');
  console.log('Queen Controller imported successfully');
  
  console.log('Attempting to import Shared Memory...');
  const SharedMemoryStore = require('../intelligence-engine/shared-memory');
  console.log('Shared Memory imported successfully');
  
  console.log('Debug test completed successfully');
  
} catch (error) {
  console.error('Debug test failed:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}