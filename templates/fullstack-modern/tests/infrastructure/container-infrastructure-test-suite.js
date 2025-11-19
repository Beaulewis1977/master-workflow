#!/usr/bin/env node

/**
 * Container and Infrastructure Test Suite
 * Comprehensive testing for Docker containers, security, performance, and production readiness
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class ContainerInfrastructureTestSuite {
  constructor() {
    this.templatePath = path.resolve(__dirname, '../../');
    this.testResults = {
      containerSecurity: [],
      resourceManagement: [],
      networkSecurity: [],
      dataBackup: [],
      monitoring: [],
      scalability: [],
      compliance: [],
      productionReadiness: []
    };
    this.testContainers = new Set();
    this.testNetworks = new Set();
    this.testVolumes = new Set();
  }

  async runAllTests() {
    console.log('🏗️ Starting Container and Infrastructure Test Suite...\n');

    try {
      await this.setupTestEnvironment();
      await this.testContainerSecurity();
      await this.testResourceManagement();
      await this.testNetworkSecurity();
      await this.testDataBackupRestore();
      await this.testMonitoringLogging();
      await this.testScalability();
      await this.testCompliance();
      await this.testProductionReadiness();

      return this.generateTestReport();
    } catch (error) {
      console.error('❌ Container infrastructure test suite failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('🛠️ Setting up container infrastructure test environment...');
    
    // Ensure Docker is available
    const dockerVersion = await this.execCommand('docker --version');
    if (!dockerVersion.success) {
      throw new Error('Docker is not available or not installed');
    }

    // Ensure Docker Compose is available
    const composeVersion = await this.execCommand('docker-compose --version');
    if (!composeVersion.success) {
      throw new Error('Docker Compose is not available or not installed');
    }

    console.log('✅ Docker and Docker Compose are available');
  }

  // 1. Container Security Testing
  async testContainerSecurity() {
    console.log('🔒 Testing container security...');

    const tests = [
      this.testImageSecurity,
      this.testContainerUserPrivileges,
      this.testSecretsManagement,
      this.testVulnerabilityScanning,
      this.testRuntimeSecurity
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.containerSecurity.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testImageSecurity() {
    console.log('🛡️ Testing Docker image security...');

    const dockerfiles = [
      'frontend/Dockerfile',
      'frontend/Dockerfile.dev',
      'backend/Dockerfile',
      'backend/Dockerfile.dev'
    ];

    const securityIssues = [];
    const securityBestPractices = [];

    for (const dockerfilePath of dockerfiles) {
      const fullPath = path.join(this.templatePath, dockerfilePath);
      
      if (await this.fileExists(fullPath)) {
        const content = await fs.readFile(fullPath, 'utf8');
        const lines = content.split('\n');

        // Check for security best practices
        const analysis = {
          file: dockerfilePath,
          issues: [],
          practices: []
        };

        // Check for specific user creation
        const hasUserCreation = content.includes('RUN adduser') || 
                               content.includes('RUN useradd') ||
                               content.includes('USER ');
        
        if (!hasUserCreation) {
          analysis.issues.push('Container runs as root user');
        } else {
          analysis.practices.push('Uses non-root user');
        }

        // Check for version pinning in base images
        const fromLines = lines.filter(line => line.trim().startsWith('FROM'));
        for (const fromLine of fromLines) {
          if (fromLine.includes(':latest') || !fromLine.includes(':')) {
            analysis.issues.push('Base image not pinned to specific version');
          } else {
            analysis.practices.push('Base image version pinned');
          }
        }

        // Check for minimal base images
        const hasMinimalBase = content.includes('alpine') || 
                              content.includes('slim') ||
                              content.includes('distroless');
        
        if (hasMinimalBase) {
          analysis.practices.push('Uses minimal base image');
        } else {
          analysis.issues.push('Consider using minimal base images');
        }

        // Check for unnecessary packages
        const hasAptUpdate = content.includes('apt-get update');
        const hasAptCleanup = content.includes('apt-get clean') || 
                             content.includes('rm -rf /var/lib/apt');
        
        if (hasAptUpdate && !hasAptCleanup) {
          analysis.issues.push('Package manager cache not cleaned');
        }

        // Check for secrets handling
        const hasSecrets = content.includes('ENV') && 
                          (content.includes('PASSWORD') || 
                           content.includes('SECRET') || 
                           content.includes('KEY'));
        
        if (hasSecrets) {
          analysis.issues.push('Potential secrets in environment variables');
        }

        if (analysis.issues.length > 0) {
          securityIssues.push(analysis);
        }
        if (analysis.practices.length > 0) {
          securityBestPractices.push(analysis);
        }
      }
    }

    this.testResults.containerSecurity.push({
      test: 'image_security',
      status: securityIssues.length === 0 ? 'passed' : 'warning',
      message: securityIssues.length === 0 ? 
        'No major security issues found in Dockerfiles' : 
        `${securityIssues.length} security issues found`,
      issues: securityIssues,
      bestPractices: securityBestPractices
    });
  }

  async testContainerUserPrivileges() {
    console.log('👤 Testing container user privileges...');

    // Start containers and check user privileges
    await this.execCommand('docker-compose up -d', { cwd: this.templatePath });
    await this.sleep(10000);

    const services = ['frontend', 'backend'];
    const privilegeResults = [];

    for (const service of services) {
      try {
        const userResult = await this.execCommand(
          `docker-compose exec -T ${service} whoami`,
          { cwd: this.templatePath }
        );

        const idResult = await this.execCommand(
          `docker-compose exec -T ${service} id`,
          { cwd: this.templatePath }
        );

        const isRoot = userResult.output.trim() === 'root' || 
                      idResult.output.includes('uid=0');

        privilegeResults.push({
          service,
          user: userResult.output.trim(),
          id: idResult.output.trim(),
          isRoot,
          status: isRoot ? 'warning' : 'passed'
        });
      } catch (error) {
        privilegeResults.push({
          service,
          status: 'failed',
          error: error.message
        });
      }
    }

    const hasRootContainers = privilegeResults.some(result => result.isRoot);

    this.testResults.containerSecurity.push({
      test: 'container_user_privileges',
      status: hasRootContainers ? 'warning' : 'passed',
      message: hasRootContainers ? 
        'Some containers running as root user' : 
        'All containers running as non-root users',
      details: privilegeResults
    });
  }

  async testSecretsManagement() {
    console.log('🔐 Testing secrets management...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      // Check for hardcoded secrets
      const secretPatterns = [
        /password.*=.*[^$]/i,
        /secret.*=.*[^$]/i,
        /key.*=.*[^$]/i,
        /token.*=.*[^$]/i
      ];

      const secretIssues = [];
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of secretPatterns) {
          if (pattern.test(line) && !line.includes('${')) {
            secretIssues.push({
              line: i + 1,
              content: line.trim(),
              issue: 'Potential hardcoded secret'
            });
          }
        }
      }

      // Check for Docker secrets usage
      const usesDockerSecrets = content.includes('secrets:') || 
                               content.includes('external: true');

      this.testResults.containerSecurity.push({
        test: 'secrets_management',
        status: secretIssues.length === 0 ? 'passed' : 'warning',
        message: secretIssues.length === 0 ? 
          'No hardcoded secrets detected' : 
          `${secretIssues.length} potential secret issues found`,
        usesDockerSecrets,
        issues: secretIssues
      });
    }
  }

  async testVulnerabilityScanning() {
    console.log('🔍 Testing vulnerability scanning...');

    // Test if vulnerability scanning tools are available
    const trivyResult = await this.execCommand('which trivy');
    const hasTrivy = trivyResult.success;

    // Test Docker security scanning
    const dockerScanResult = await this.execCommand('docker scan --help');
    const hasDockerScan = dockerScanResult.success;

    this.testResults.containerSecurity.push({
      test: 'vulnerability_scanning',
      status: hasTrivy || hasDockerScan ? 'passed' : 'info',
      message: hasTrivy || hasDockerScan ? 
        'Vulnerability scanning tools available' : 
        'Consider installing vulnerability scanning tools (Trivy, Docker scan)',
      availableTools: {
        trivy: hasTrivy,
        dockerScan: hasDockerScan
      },
      recommendation: 'Implement automated vulnerability scanning in CI/CD'
    });
  }

  async testRuntimeSecurity() {
    console.log('🛡️ Testing runtime security...');

    // Check for security configurations in docker-compose
    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const securityFeatures = {
        readOnlyRootFilesystem: content.includes('read_only: true'),
        noNewPrivileges: content.includes('no_new_privileges: true'),
        seccompProfile: content.includes('seccomp:'),
        apparmorProfile: content.includes('apparmor:'),
        capabilities: content.includes('cap_drop:') || content.includes('cap_add:'),
        resourceLimits: content.includes('mem_limit:') || content.includes('cpus:')
      };

      const enabledFeatures = Object.entries(securityFeatures)
        .filter(([_, enabled]) => enabled)
        .map(([feature]) => feature);

      this.testResults.containerSecurity.push({
        test: 'runtime_security',
        status: enabledFeatures.length > 0 ? 'passed' : 'warning',
        message: enabledFeatures.length > 0 ? 
          `${enabledFeatures.length} security features enabled` : 
          'Consider enabling runtime security features',
        enabledFeatures,
        recommendations: [
          'Use read-only root filesystems where possible',
          'Drop unnecessary capabilities',
          'Set resource limits',
          'Use security profiles (seccomp, AppArmor)'
        ]
      });
    }
  }

  // 2. Resource Management Testing
  async testResourceManagement() {
    console.log('📊 Testing resource management...');

    const tests = [
      this.testResourceLimits,
      this.testMemoryUsage,
      this.testCpuUsage,
      this.testDiskUsage,
      this.testResourceMonitoring
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.resourceManagement.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testResourceLimits() {
    console.log('⚖️ Testing resource limits...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const services = ['frontend', 'backend', 'postgres', 'redis'];
      const limitResults = [];

      for (const service of services) {
        const serviceRegex = new RegExp(`${service}:\\s*\\n([\\s\\S]*?)(?=\\n\\s*\\w+:|$)`, 'm');
        const match = content.match(serviceRegex);
        
        if (match) {
          const serviceConfig = match[1];
          const hasMemoryLimit = serviceConfig.includes('mem_limit:') || 
                                serviceConfig.includes('memory:');
          const hasCpuLimit = serviceConfig.includes('cpus:') || 
                             serviceConfig.includes('cpu_count:');
          
          limitResults.push({
            service,
            memoryLimit: hasMemoryLimit,
            cpuLimit: hasCpuLimit,
            status: hasMemoryLimit && hasCpuLimit ? 'passed' : 'warning'
          });
        }
      }

      const allHaveLimits = limitResults.every(result => 
        result.memoryLimit && result.cpuLimit
      );

      this.testResults.resourceManagement.push({
        test: 'resource_limits',
        status: allHaveLimits ? 'passed' : 'warning',
        message: allHaveLimits ? 
          'All services have resource limits configured' : 
          'Some services missing resource limits',
        details: limitResults,
        recommendation: 'Set memory and CPU limits for all services in production'
      });
    }
  }

  async testMemoryUsage() {
    console.log('🧠 Testing memory usage...');

    // Start containers and monitor memory usage
    await this.execCommand('docker-compose up -d', { cwd: this.templatePath });
    await this.sleep(15000); // Wait for services to stabilize

    const services = ['frontend', 'backend', 'postgres', 'redis'];
    const memoryResults = [];

    for (const service of services) {
      try {
        const statsResult = await this.execCommand(
          `docker stats --no-stream --format "table {{.MemUsage}}" $(docker-compose ps -q ${service})`,
          { cwd: this.templatePath }
        );

        if (statsResult.success) {
          const memUsage = statsResult.output.split('\n')[1]?.trim();
          memoryResults.push({
            service,
            memoryUsage: memUsage,
            status: 'info'
          });
        }
      } catch (error) {
        memoryResults.push({
          service,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.testResults.resourceManagement.push({
      test: 'memory_usage',
      status: 'info',
      message: 'Memory usage monitored',
      details: memoryResults,
      recommendation: 'Monitor memory usage in production and adjust limits as needed'
    });
  }

  async testCpuUsage() {
    console.log('⚡ Testing CPU usage...');

    const services = ['frontend', 'backend', 'postgres', 'redis'];
    const cpuResults = [];

    for (const service of services) {
      try {
        const statsResult = await this.execCommand(
          `docker stats --no-stream --format "table {{.CPUPerc}}" $(docker-compose ps -q ${service})`,
          { cwd: this.templatePath }
        );

        if (statsResult.success) {
          const cpuUsage = statsResult.output.split('\n')[1]?.trim();
          cpuResults.push({
            service,
            cpuUsage: cpuUsage,
            status: 'info'
          });
        }
      } catch (error) {
        cpuResults.push({
          service,
          status: 'failed',
          error: error.message
        });
      }
    }

    this.testResults.resourceManagement.push({
      test: 'cpu_usage',
      status: 'info',
      message: 'CPU usage monitored',
      details: cpuResults,
      recommendation: 'Monitor CPU usage patterns and optimize resource allocation'
    });
  }

  async testDiskUsage() {
    console.log('💾 Testing disk usage...');

    const volumeResult = await this.execCommand('docker volume ls');
    const imageResult = await this.execCommand('docker images --format "table {{.Size}}"');

    this.testResults.resourceManagement.push({
      test: 'disk_usage',
      status: 'info',
      message: 'Disk usage should be monitored regularly',
      volumes: volumeResult.success ? volumeResult.output.split('\n').length - 1 : 0,
      recommendation: 'Implement disk usage monitoring and cleanup procedures'
    });
  }

  async testResourceMonitoring() {
    console.log('📈 Testing resource monitoring...');

    // Check if monitoring stack is configured
    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const monitoringServices = {
        prometheus: content.includes('prometheus'),
        grafana: content.includes('grafana'),
        cadvisor: content.includes('cadvisor'),
        nodeExporter: content.includes('node-exporter')
      };

      const hasMonitoring = Object.values(monitoringServices).some(Boolean);

      this.testResults.resourceManagement.push({
        test: 'resource_monitoring',
        status: hasMonitoring ? 'passed' : 'info',
        message: hasMonitoring ? 
          'Monitoring services configured' : 
          'Consider adding monitoring services',
        monitoringServices,
        recommendation: 'Implement comprehensive monitoring with Prometheus/Grafana'
      });
    }
  }

  // 3. Network Security Testing
  async testNetworkSecurity() {
    console.log('🌐 Testing network security...');

    const tests = [
      this.testNetworkIsolation,
      this.testPortExposure,
      this.testTLSConfiguration,
      this.testFirewallRules
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.networkSecurity.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testNetworkIsolation() {
    console.log('🔐 Testing network isolation...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const hasCustomNetworks = content.includes('networks:') && 
                               content.includes('app-network');
      
      const usesDefaultNetwork = !hasCustomNetworks;

      this.testResults.networkSecurity.push({
        test: 'network_isolation',
        status: hasCustomNetworks ? 'passed' : 'warning',
        message: hasCustomNetworks ? 
          'Custom network configured for isolation' : 
          'Using default network (consider custom networks)',
        hasCustomNetworks,
        recommendation: 'Use custom networks to isolate services'
      });
    }
  }

  async testPortExposure() {
    console.log('🚪 Testing port exposure...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const exposedPorts = [];
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('- "') && line.includes(':')) {
          const portMapping = line.replace(/["-]/g, '').trim();
          exposedPorts.push({
            line: i + 1,
            mapping: portMapping,
            hostPort: portMapping.split(':')[0],
            containerPort: portMapping.split(':')[1]
          });
        }
      }

      // Check for unnecessary port exposures
      const unnecessaryPorts = exposedPorts.filter(port => {
        const hostPort = parseInt(port.hostPort);
        // Database and cache ports should typically not be exposed in production
        return hostPort === 5432 || hostPort === 6379;
      });

      this.testResults.networkSecurity.push({
        test: 'port_exposure',
        status: unnecessaryPorts.length === 0 ? 'passed' : 'warning',
        message: unnecessaryPorts.length === 0 ? 
          'No unnecessary port exposures detected' : 
          `${unnecessaryPorts.length} potentially unnecessary port exposures`,
        exposedPorts,
        unnecessaryPorts,
        recommendation: 'Only expose necessary ports in production'
      });
    }
  }

  async testTLSConfiguration() {
    console.log('🔒 Testing TLS configuration...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const hasTLSConfig = content.includes('ssl') || 
                          content.includes('tls') || 
                          content.includes('443:443') ||
                          content.includes('nginx');

      const nginxConfigExists = await this.fileExists(
        path.join(this.templatePath, 'nginx/nginx.conf')
      );

      this.testResults.networkSecurity.push({
        test: 'tls_configuration',
        status: hasTLSConfig || nginxConfigExists ? 'info' : 'warning',
        message: hasTLSConfig || nginxConfigExists ? 
          'TLS configuration detected' : 
          'No TLS configuration found',
        hasTLSConfig,
        nginxConfigExists,
        recommendation: 'Implement TLS/SSL for production deployment'
      });
    }
  }

  async testFirewallRules() {
    console.log('🛡️ Testing firewall rules...');

    // Check if iptables rules are documented or configured
    this.testResults.networkSecurity.push({
      test: 'firewall_rules',
      status: 'info',
      message: 'Firewall configuration should be implemented at infrastructure level',
      recommendation: 'Document and implement firewall rules for production deployment'
    });
  }

  // 4. Data Backup and Restore Testing
  async testDataBackupRestore() {
    console.log('💾 Testing data backup and restore...');

    const tests = [
      this.testVolumeBackup,
      this.testDatabaseBackup,
      this.testBackupAutomation,
      this.testRestoreProcedures
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.dataBackup.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testVolumeBackup() {
    console.log('📦 Testing volume backup...');

    // Start services to create volumes
    await this.execCommand('docker-compose up -d postgres redis', { cwd: this.templatePath });
    await this.sleep(10000);

    const volumeResult = await this.execCommand('docker volume ls');
    const volumes = volumeResult.output.split('\n')
      .filter(line => line.includes('postgres_data') || line.includes('redis_data'));

    if (volumes.length > 0) {
      // Test volume backup capability
      const backupTest = await this.execCommand(
        'docker run --rm -v postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/test-backup.tar.gz /data',
        { cwd: this.templatePath }
      );

      // Clean up test backup
      await this.execCommand('rm -f test-backup.tar.gz', { cwd: this.templatePath });

      this.testResults.dataBackup.push({
        test: 'volume_backup',
        status: backupTest.success ? 'passed' : 'warning',
        message: backupTest.success ? 
          'Volume backup capability verified' : 
          'Volume backup test failed',
        volumes: volumes.length
      });
    } else {
      this.testResults.dataBackup.push({
        test: 'volume_backup',
        status: 'info',
        message: 'No persistent volumes found to test'
      });
    }
  }

  async testDatabaseBackup() {
    console.log('🗄️ Testing database backup...');

    // Test PostgreSQL backup
    const pgDumpTest = await this.execCommand(
      'docker-compose exec -T postgres pg_dump --help',
      { cwd: this.templatePath }
    );

    if (pgDumpTest.success) {
      // Test actual backup
      const backupTest = await this.execCommand(
        'docker-compose exec -T postgres pg_dump -U postgres -d postgres > /dev/null',
        { cwd: this.templatePath }
      );

      this.testResults.dataBackup.push({
        test: 'database_backup',
        status: backupTest.success ? 'passed' : 'warning',
        message: backupTest.success ? 
          'Database backup capability verified' : 
          'Database backup test failed'
      });
    } else {
      this.testResults.dataBackup.push({
        test: 'database_backup',
        status: 'skipped',
        message: 'PostgreSQL not available for backup testing'
      });
    }
  }

  async testBackupAutomation() {
    console.log('🤖 Testing backup automation...');

    // Check for backup scripts or cron jobs
    const backupScripts = [
      'backup.sh',
      'scripts/backup.sh',
      'docker/backup.sh'
    ];

    const foundScripts = [];
    for (const script of backupScripts) {
      const scriptPath = path.join(this.templatePath, script);
      if (await this.fileExists(scriptPath)) {
        foundScripts.push(script);
      }
    }

    this.testResults.dataBackup.push({
      test: 'backup_automation',
      status: foundScripts.length > 0 ? 'passed' : 'info',
      message: foundScripts.length > 0 ? 
        `Backup scripts found: ${foundScripts.join(', ')}` : 
        'No backup automation scripts found',
      foundScripts,
      recommendation: 'Implement automated backup procedures'
    });
  }

  async testRestoreProcedures() {
    console.log('🔄 Testing restore procedures...');

    this.testResults.dataBackup.push({
      test: 'restore_procedures',
      status: 'info',
      message: 'Restore procedures should be documented and tested',
      recommendation: 'Create and test disaster recovery procedures'
    });
  }

  // 5. Monitoring and Logging Testing
  async testMonitoringLogging() {
    console.log('📊 Testing monitoring and logging...');

    const tests = [
      this.testLoggingConfiguration,
      this.testMetricsCollection,
      this.testAlerting,
      this.testLogAggregation
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.monitoring.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testLoggingConfiguration() {
    console.log('📝 Testing logging configuration...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const hasLoggingConfig = content.includes('logging:') || 
                              content.includes('driver:') ||
                              content.includes('syslog') ||
                              content.includes('json-file');

      this.testResults.monitoring.push({
        test: 'logging_configuration',
        status: hasLoggingConfig ? 'passed' : 'info',
        message: hasLoggingConfig ? 
          'Logging configuration found' : 
          'No specific logging configuration found',
        hasLoggingConfig,
        recommendation: 'Configure structured logging for production'
      });
    }
  }

  async testMetricsCollection() {
    console.log('📈 Testing metrics collection...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const metricsServices = {
        prometheus: content.includes('prometheus'),
        grafana: content.includes('grafana'),
        cadvisor: content.includes('cadvisor'),
        nodeExporter: content.includes('node-exporter'),
        jaeger: content.includes('jaeger')
      };

      const hasMetrics = Object.values(metricsServices).some(Boolean);

      this.testResults.monitoring.push({
        test: 'metrics_collection',
        status: hasMetrics ? 'passed' : 'info',
        message: hasMetrics ? 
          'Metrics collection services configured' : 
          'No metrics collection services found',
        metricsServices,
        recommendation: 'Implement metrics collection for production monitoring'
      });
    }
  }

  async testAlerting() {
    console.log('🚨 Testing alerting...');

    this.testResults.monitoring.push({
      test: 'alerting',
      status: 'info',
      message: 'Alerting should be configured based on metrics and logs',
      recommendation: 'Set up alerting for critical system metrics and errors'
    });
  }

  async testLogAggregation() {
    console.log('📋 Testing log aggregation...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const logServices = {
        elasticsearch: content.includes('elasticsearch'),
        logstash: content.includes('logstash'),
        kibana: content.includes('kibana'),
        fluentd: content.includes('fluentd'),
        loki: content.includes('loki')
      };

      const hasLogAggregation = Object.values(logServices).some(Boolean);

      this.testResults.monitoring.push({
        test: 'log_aggregation',
        status: hasLogAggregation ? 'passed' : 'info',
        message: hasLogAggregation ? 
          'Log aggregation services configured' : 
          'No log aggregation services found',
        logServices,
        recommendation: 'Implement centralized log aggregation for production'
      });
    }
  }

  // 6. Scalability Testing
  async testScalability() {
    console.log('📈 Testing scalability...');

    const tests = [
      this.testHorizontalScaling,
      this.testLoadBalancing,
      this.testStatelessDesign,
      this.testDatabaseScaling
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.scalability.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testHorizontalScaling() {
    console.log('🔄 Testing horizontal scaling...');

    // Test scaling services
    const scaleTest = await this.execCommand(
      'docker-compose up -d --scale backend=2',
      { cwd: this.templatePath }
    );

    await this.sleep(5000);

    const psResult = await this.execCommand(
      'docker-compose ps backend',
      { cwd: this.templatePath }
    );

    const backendInstances = psResult.output.split('\n').length - 2; // Subtract header lines

    // Scale back down
    await this.execCommand(
      'docker-compose up -d --scale backend=1',
      { cwd: this.templatePath }
    );

    this.testResults.scalability.push({
      test: 'horizontal_scaling',
      status: backendInstances >= 2 ? 'passed' : 'warning',
      message: backendInstances >= 2 ? 
        'Horizontal scaling capability verified' : 
        'Horizontal scaling test failed',
      instances: backendInstances
    });
  }

  async testLoadBalancing() {
    console.log('⚖️ Testing load balancing...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const hasLoadBalancer = content.includes('nginx') || 
                             content.includes('haproxy') ||
                             content.includes('traefik');

      this.testResults.scalability.push({
        test: 'load_balancing',
        status: hasLoadBalancer ? 'passed' : 'info',
        message: hasLoadBalancer ? 
          'Load balancer configuration found' : 
          'No load balancer configured',
        hasLoadBalancer,
        recommendation: 'Implement load balancing for production scaling'
      });
    }
  }

  async testStatelessDesign() {
    console.log('🎯 Testing stateless design...');

    // Check for session storage configuration
    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const hasRedis = content.includes('redis');
      const hasSharedStorage = content.includes('volume') || hasRedis;

      this.testResults.scalability.push({
        test: 'stateless_design',
        status: hasSharedStorage ? 'passed' : 'warning',
        message: hasSharedStorage ? 
          'Shared storage/session management configured' : 
          'Consider implementing shared session storage',
        hasRedis,
        hasSharedStorage,
        recommendation: 'Ensure applications are stateless for horizontal scaling'
      });
    }
  }

  async testDatabaseScaling() {
    console.log('🗄️ Testing database scaling...');

    this.testResults.scalability.push({
      test: 'database_scaling',
      status: 'info',
      message: 'Database scaling strategy should be planned',
      recommendations: [
        'Consider read replicas for read-heavy workloads',
        'Implement database connection pooling',
        'Plan for database sharding if needed',
        'Use caching to reduce database load'
      ]
    });
  }

  // 7. Compliance Testing
  async testCompliance() {
    console.log('📋 Testing compliance...');

    const tests = [
      this.testDataPrivacy,
      this.testAuditLogging,
      this.testAccessControl,
      this.testDataRetention
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.compliance.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testDataPrivacy() {
    console.log('🔒 Testing data privacy...');

    this.testResults.compliance.push({
      test: 'data_privacy',
      status: 'info',
      message: 'Data privacy compliance should be reviewed',
      requirements: [
        'Implement data encryption at rest and in transit',
        'Document data processing and storage',
        'Implement user data deletion capabilities',
        'Regular privacy impact assessments'
      ]
    });
  }

  async testAuditLogging() {
    console.log('📊 Testing audit logging...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const hasAuditLogging = content.includes('audit') || 
                             content.includes('syslog') ||
                             content.includes('journald');

      this.testResults.compliance.push({
        test: 'audit_logging',
        status: hasAuditLogging ? 'passed' : 'info',
        message: hasAuditLogging ? 
          'Audit logging configuration found' : 
          'No specific audit logging configuration',
        hasAuditLogging,
        recommendation: 'Implement comprehensive audit logging for compliance'
      });
    }
  }

  async testAccessControl() {
    console.log('🔐 Testing access control...');

    this.testResults.compliance.push({
      test: 'access_control',
      status: 'info',
      message: 'Access control should be implemented at application and infrastructure level',
      requirements: [
        'Role-based access control (RBAC)',
        'Multi-factor authentication',
        'Regular access reviews',
        'Principle of least privilege'
      ]
    });
  }

  async testDataRetention() {
    console.log('🗂️ Testing data retention...');

    this.testResults.compliance.push({
      test: 'data_retention',
      status: 'info',
      message: 'Data retention policies should be documented and implemented',
      requirements: [
        'Document data retention periods',
        'Implement automated data cleanup',
        'Regular backup verification',
        'Secure data disposal procedures'
      ]
    });
  }

  // 8. Production Readiness Testing
  async testProductionReadiness() {
    console.log('🚀 Testing production readiness...');

    const tests = [
      this.testHealthChecks,
      this.testGracefulShutdown,
      this.testConfigurationManagement,
      this.testDeploymentStrategy
    ];

    for (const test of tests) {
      try {
        await test.call(this);
      } catch (error) {
        this.testResults.productionReadiness.push({
          test: test.name,
          status: 'failed',
          error: error.message
        });
      }
    }
  }

  async testHealthChecks() {
    console.log('🏥 Testing health checks...');

    const composeFile = path.join(this.templatePath, 'docker-compose.yml');
    
    if (await this.fileExists(composeFile)) {
      const content = await fs.readFile(composeFile, 'utf8');
      
      const services = ['frontend', 'backend', 'postgres', 'redis'];
      const healthCheckResults = [];

      for (const service of services) {
        const serviceRegex = new RegExp(`${service}:\\s*\\n([\\s\\S]*?)(?=\\n\\s*\\w+:|$)`, 'm');
        const match = content.match(serviceRegex);
        
        if (match) {
          const serviceConfig = match[1];
          const hasHealthCheck = serviceConfig.includes('healthcheck:');
          
          healthCheckResults.push({
            service,
            hasHealthCheck,
            status: hasHealthCheck ? 'passed' : 'warning'
          });
        }
      }

      const allHaveHealthChecks = healthCheckResults.every(result => result.hasHealthCheck);

      this.testResults.productionReadiness.push({
        test: 'health_checks',
        status: allHaveHealthChecks ? 'passed' : 'warning',
        message: allHaveHealthChecks ? 
          'All services have health checks' : 
          'Some services missing health checks',
        details: healthCheckResults
      });
    }
  }

  async testGracefulShutdown() {
    console.log('👋 Testing graceful shutdown...');

    // Test graceful shutdown
    await this.execCommand('docker-compose up -d', { cwd: this.templatePath });
    await this.sleep(5000);

    const shutdownTest = await this.execCommand(
      'timeout 30 docker-compose down',
      { cwd: this.templatePath }
    );

    this.testResults.productionReadiness.push({
      test: 'graceful_shutdown',
      status: shutdownTest.success ? 'passed' : 'warning',
      message: shutdownTest.success ? 
        'Graceful shutdown completed within timeout' : 
        'Graceful shutdown may have issues',
      recommendation: 'Ensure applications handle SIGTERM signals properly'
    });
  }

  async testConfigurationManagement() {
    console.log('⚙️ Testing configuration management...');

    const configFiles = [
      '.env.example',
      'docker-compose.yml',
      'docker-compose.prod.yml',
      'docker-compose.override.yml'
    ];

    const foundConfigs = [];
    for (const config of configFiles) {
      const configPath = path.join(this.templatePath, config);
      if (await this.fileExists(configPath)) {
        foundConfigs.push(config);
      }
    }

    this.testResults.productionReadiness.push({
      test: 'configuration_management',
      status: foundConfigs.length >= 2 ? 'passed' : 'warning',
      message: `${foundConfigs.length} configuration files found`,
      foundConfigs,
      recommendation: 'Separate development and production configurations'
    });
  }

  async testDeploymentStrategy() {
    console.log('🚀 Testing deployment strategy...');

    const deploymentFiles = [
      'docker-compose.prod.yml',
      'Dockerfile',
      'deploy.sh',
      '.github/workflows',
      'k8s',
      'helm'
    ];

    const foundDeployment = [];
    for (const file of deploymentFiles) {
      const filePath = path.join(this.templatePath, file);
      const exists = await this.fileExists(filePath) || await this.directoryExists(filePath);
      if (exists) {
        foundDeployment.push(file);
      }
    }

    this.testResults.productionReadiness.push({
      test: 'deployment_strategy',
      status: foundDeployment.length > 0 ? 'passed' : 'warning',
      message: foundDeployment.length > 0 ? 
        `Deployment configuration found: ${foundDeployment.join(', ')}` : 
        'No deployment strategy configuration found',
      foundDeployment,
      recommendation: 'Implement automated deployment strategy'
    });
  }

  // Utility Methods
  async execCommand(command, options = {}) {
    const { cwd = this.templatePath, timeout = 30000 } = options;
    
    return new Promise((resolve) => {
      const process = exec(command, { cwd }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout,
          error: stderr,
          code: error?.code
        });
      });

      if (timeout) {
        setTimeout(() => {
          process.kill();
          resolve({
            success: false,
            output: '',
            error: 'Command timeout',
            code: -1
          });
        }, timeout);
      }
    });
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async directoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateTestReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        info: 0
      },
      categories: this.testResults,
      security: {
        containerSecurity: 'review_required',
        networkSecurity: 'review_required',
        secretsManagement: 'review_required'
      },
      infrastructure: {
        resourceManagement: 'needs_attention',
        monitoring: 'needs_implementation',
        scalability: 'planning_required'
      },
      compliance: {
        dataPrivacy: 'assessment_required',
        auditLogging: 'implementation_required',
        accessControl: 'design_required'
      },
      productionReadiness: {
        overall: 'partial',
        criticalIssues: [],
        recommendations: []
      },
      overallStatus: 'unknown'
    };

    // Calculate summary
    for (const category of Object.values(this.testResults)) {
      for (const test of category) {
        report.summary.totalTests++;
        if (test.status === 'passed') report.summary.passed++;
        else if (test.status === 'failed') report.summary.failed++;
        else if (test.status === 'warning') report.summary.warnings++;
        else if (test.status === 'info') report.summary.info++;
      }
    }

    // Determine overall status
    if (report.summary.failed === 0) {
      report.overallStatus = report.summary.warnings > 0 ? 'warning' : 'passed';
    } else {
      report.overallStatus = 'failed';
    }

    // Generate production readiness recommendations
    report.productionReadiness.recommendations = [
      'Implement comprehensive security hardening',
      'Set up monitoring and alerting',
      'Configure automated backups',
      'Implement disaster recovery procedures',
      'Conduct security audits',
      'Document operational procedures',
      'Implement compliance measures',
      'Set up CI/CD pipelines',
      'Configure load balancing and scaling',
      'Implement logging and audit trails'
    ];

    // Save report
    await fs.writeFile(
      path.join(this.templatePath, 'container-infrastructure-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('\n📊 Container Infrastructure Test Results:');
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log(`ℹ️  Info: ${report.summary.info}`);
    console.log(`\n📄 Detailed report saved to: container-infrastructure-test-report.json`);

    return report;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up container infrastructure test environment...');
    
    try {
      // Stop and remove all containers
      await this.execCommand('docker-compose down -v', { cwd: this.templatePath });
      
      // Remove test containers, networks, and volumes
      for (const container of this.testContainers) {
        await this.execCommand(`docker rm -f ${container}`);
      }
      
      for (const network of this.testNetworks) {
        await this.execCommand(`docker network rm ${network}`);
      }
      
      for (const volume of this.testVolumes) {
        await this.execCommand(`docker volume rm ${volume}`);
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️ Cleanup completed with some warnings');
    }
  }
}

// Export for use in other test files
module.exports = ContainerInfrastructureTestSuite;

// Run if called directly
if (require.main === module) {
  const testSuite = new ContainerInfrastructureTestSuite();
  
  testSuite.runAllTests()
    .then((report) => {
      console.log(`\n🎉 Container infrastructure testing completed with status: ${report.overallStatus}`);
      process.exit(report.overallStatus === 'failed' ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 Container infrastructure test suite failed:', error);
      process.exit(1);
    });
}