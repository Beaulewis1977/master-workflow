#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Import enhanced MCP manager
const EnhancedMCPManager = require('./enhanced-mcp-manager');

function which(cmd) {
  const paths = process.env.PATH.split(path.delimiter);
  for (const p of paths) {
    const full = path.join(p, cmd + (process.platform === 'win32' ? '.exe' : ''));
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function parseMcpEnv(env) {
  try {
    return JSON.parse(env);
  } catch {}
  const out = {};
  for (const part of env.split(',')) {
    const [name, url] = part.split('=').map(s => s.trim());
    if (name) out[name] = { enabled: true, url: url || '' };
  }
  return out;
}

async function enhancedDiscover() {
  console.log('🔍 Starting Enhanced MCP Discovery...');
  
  try {
    // Initialize enhanced MCP manager
    const mcpManager = new EnhancedMCPManager({
      catalogPath: path.join(__dirname, '..', 'configs', 'mcp-catalog.json'),
      registryPath: path.join(__dirname, '..', 'configs', 'mcp-registry.json')
    });
    
    await mcpManager.initialize();
    
    // Generate comprehensive registry
    const registry = mcpManager.generateRegistry();
    
    console.log(`✅ Enhanced discovery completed:`);
    console.log(`   - Total servers: ${Object.keys(registry.servers).length}`);
    console.log(`   - Total tools: ${registry.tools.length}`);
    console.log(`   - Total capabilities: ${registry.meta.totalCapabilities}`);
    
    return registry;
    
  } catch (error) {
    console.error('❌ Enhanced discovery failed, falling back to legacy discovery:', error);
    return legacyDiscover();
  }
}

function legacyDiscover() {
  console.log('🔄 Using legacy MCP discovery...');
  
  const registry = { servers: {}, tools: [] };
  registry.meta = { autoDiscover: true, generatedAt: new Date().toISOString() };

  // Optional curated catalog
  const catalogPaths = [
    process.env.MCP_CATALOG_PATH,
    path.join(__dirname, '..', 'configs', 'mcp-catalog.json')
  ].filter(Boolean);
  
  for (const p of catalogPaths) {
    try {
      if (fs.existsSync(p)) {
        const cat = JSON.parse(fs.readFileSync(p, 'utf8'));
        
        // Process new catalog format
        if (cat.categories) {
          console.log(`📚 Loading from enhanced catalog with ${cat.totalServers} servers`);
          
          // Extract servers from categories
          for (const [categoryName, category] of Object.entries(cat.categories)) {
            if (category.servers) {
              for (const [name, cfg] of Object.entries(category.servers)) {
                if (cfg.enabled && !registry.servers[name]) {
                  registry.servers[name] = {
                    enabled: cfg.enabled,
                    priority: cfg.priority || 5,
                    description: cfg.description,
                    capabilities: cfg.capabilities,
                    healthCheck: cfg.healthCheck,
                    tags: cfg.tags,
                    ...(cfg.default && { default: true })
                  };
                }
              }
            }
          }
        }
        
        // Legacy catalog format support
        if (cat.servers && !cat.categories) {
          for (const [name, cfg] of Object.entries(cat.servers)) {
            if (!registry.servers[name]) registry.servers[name] = cfg;
          }
        }
        
        if (Array.isArray(cat.tools)) {
          registry.tools.push(...cat.tools);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Failed to load catalog from ${p}:`, error.message);
    }
  }

  // From env MCP_SERVERS (JSON or CSV)
  if (process.env.MCP_SERVERS) {
    const envServers = parseMcpEnv(process.env.MCP_SERVERS);
    Object.assign(registry.servers, envServers);
  }

  // Baseline servers
  registry.servers.filesystem = registry.servers.filesystem || { enabled: true, root: '.' };
  registry.servers.http = registry.servers.http || { enabled: true };

  // Default MCP server (context7) unless explicitly disabled
  const defaultName = process.env.MCP_DEFAULT_SERVER || 'context7';
  if (!registry.servers[defaultName]) {
    registry.servers[defaultName] = { enabled: true, default: true, priority: 10 };
  } else {
    // Mark whichever default was present
    registry.servers[defaultName].default = true;
  }

  // Git server if git is available
  if (which('git')) {
    registry.servers.git = registry.servers.git || { enabled: true, repo: 'auto' };
  }

  // Generate tools from servers
  const generatedTools = [];
  
  for (const [serverName, serverConfig] of Object.entries(registry.servers)) {
    if (serverConfig.enabled) {
      generatedTools.push({
        name: serverName,
        type: 'mcp',
        server: serverName,
        description: serverConfig.description || `${serverName} MCP server`,
        capabilities: serverConfig.capabilities || [],
        priority: serverConfig.priority || 5
      });
    }
  }

  // Built-in tools
  registry.tools.push({ name: 'grep', type: 'builtin', description: 'Search files' });
  
  // Add generated tools
  registry.tools.push(...generatedTools);

  console.log(`📝 Legacy discovery completed with ${Object.keys(registry.servers).length} servers`);

  return registry;
}

// Main discover function with fallback
async function discover() {
  if (process.env.MCP_ENHANCED_DISCOVERY !== 'false') {
    try {
      return await enhancedDiscover();
    } catch (error) {
      console.error('Enhanced discovery failed:', error);
    }
  }
  
  return legacyDiscover();
}

function main() {
  const outPath = process.argv[2] || path.join(process.cwd(), '.ai-workflow', 'configs', 'mcp-registry.json');
  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  const registry = discover();
  fs.writeFileSync(outPath, JSON.stringify(registry, null, 2));
  console.log('MCP registry written to', outPath);
}

if (require.main === module) main();
