#!/usr/bin/env node

const { UniversalMcpDiscovery } = require('./universal-mcp-discovery');

// Simple test with error handling
async function testDiscovery() {
    try {
        console.log('🧪 Testing Universal MCP Discovery...');
        
        const discovery = new UniversalMcpDiscovery(process.cwd());
        
        // Test each phase individually
        console.log('Phase 1: Project Structure Analysis...');
        await discovery.analyzeProjectStructure();
        console.log('✅ Project structure analyzed');
        
        console.log('Phase 2: Languages and Frameworks...');
        await discovery.analyzeLanguagesAndFrameworks();
        console.log('✅ Languages and frameworks detected');
        
        console.log('Phase 3: Dependencies...');
        await discovery.scanAllDependencies();
        console.log('✅ Dependencies scanned');
        
        console.log('Phase 4: Infrastructure...');
        await discovery.analyzeInfrastructure();
        console.log('✅ Infrastructure analyzed');
        
        console.log('Phase 5: Docker Containers...');
        await discovery.scanDockerContainers();
        console.log('✅ Docker containers scanned');
        
        console.log('Phase 6: Virtual Environments...');
        await discovery.detectVirtualEnvironments();
        console.log('✅ Virtual environments detected');
        
        console.log('Phase 7: MCP Server Discovery...');
        const servers = await discovery.discoverMcpServers();
        console.log(`✅ Discovered ${servers.length} MCP servers`);
        
        console.log('Phase 8: Generate Recommendations...');
        const recommendations = await discovery.generateIntelligentRecommendations(servers);
        console.log(`✅ Generated ${recommendations.length} recommendations`);
        
        console.log('\n📊 Results Summary:');
        console.log(`Languages: ${discovery.projectAnalysis.languages.detected.size || 0}`);
        console.log(`Frameworks: ${Object.values(discovery.projectAnalysis.frameworks).flat().length}`);
        console.log(`Dependencies: ${discovery.projectAnalysis.dependencies.production.length || 0}`);
        console.log(`Infrastructure: ${Object.values(discovery.projectAnalysis.infrastructure).flat().length}`);
        console.log(`Servers: ${servers.length}`);
        console.log(`Recommendations: ${recommendations.length}`);
        
        console.log('\n✅ All phases completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

testDiscovery();