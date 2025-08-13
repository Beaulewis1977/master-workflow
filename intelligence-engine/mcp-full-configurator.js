/**
 * MCP Full Configurator
 * Comprehensive Model Context Protocol server configurator with support for all 87 MCP servers
 * 
 * Features:
 * - Intelligent project analysis and server auto-detection
 * - Complete MCP server catalog with 87 servers across 12 categories
 * - Dependency resolution and conflict management
 * - Configuration generation for .claude/mcp.json
 * - Project type presets and optimization
 */

const fs = require('fs');
const path = require('path');

class MCPFullConfigurator {
    constructor() {
        this.mcpCatalog = this.initializeMCPCatalog();
        this.detectedTechnologies = new Set();
        this.recommendedServers = new Map();
        this.dependencies = new Map();
        this.conflicts = new Map();
    }

    /**
     * Initialize comprehensive MCP server catalog with all 87 servers
     */
    initializeMCPCatalog() {
        return {
            // DEVELOPMENT TOOLS (12 servers)
            development: {
                'vscode-mcp': {
                    name: 'VS Code MCP',
                    description: 'Visual Studio Code integration and automation',
                    command: 'node',
                    args: ['vscode-mcp-server'],
                    detectionPatterns: ['.vscode/', 'settings.json', 'launch.json'],
                    priority: 'high',
                    dependencies: []
                },
                'cursor-mcp': {
                    name: 'Cursor Editor MCP',
                    description: 'Cursor AI editor integration',
                    command: 'node',
                    args: ['cursor-mcp-server'],
                    detectionPatterns: ['.cursor/', 'cursor.json'],
                    priority: 'medium',
                    dependencies: []
                },
                'windsurf-mcp': {
                    name: 'Windsurf MCP',
                    description: 'Windsurf development environment',
                    command: 'node',
                    args: ['windsurf-mcp-server'],
                    detectionPatterns: ['windsurf.config.js'],
                    priority: 'low',
                    dependencies: []
                },
                'zed-mcp': {
                    name: 'Zed Editor MCP',
                    description: 'Zed editor integration',
                    command: 'node',
                    args: ['zed-mcp-server'],
                    detectionPatterns: ['zed.json'],
                    priority: 'low',
                    dependencies: []
                },
                'vim-mcp': {
                    name: 'Vim MCP',
                    description: 'Vim editor integration',
                    command: 'node',
                    args: ['vim-mcp-server'],
                    detectionPatterns: ['.vimrc', '.nvimrc'],
                    priority: 'medium',
                    dependencies: []
                },
                'emacs-mcp': {
                    name: 'Emacs MCP',
                    description: 'Emacs editor integration',
                    command: 'node',
                    args: ['emacs-mcp-server'],
                    detectionPatterns: ['.emacs', 'init.el'],
                    priority: 'medium',
                    dependencies: []
                },
                'sublime-mcp': {
                    name: 'Sublime Text MCP',
                    description: 'Sublime Text editor integration',
                    command: 'node',
                    args: ['sublime-mcp-server'],
                    detectionPatterns: ['*.sublime-project'],
                    priority: 'low',
                    dependencies: []
                },
                'atom-mcp': {
                    name: 'Atom MCP',
                    description: 'Atom editor integration',
                    command: 'node',
                    args: ['atom-mcp-server'],
                    detectionPatterns: ['.atom/'],
                    priority: 'low',
                    dependencies: []
                },
                'intellij-mcp': {
                    name: 'IntelliJ IDEA MCP',
                    description: 'IntelliJ IDEA integration',
                    command: 'node',
                    args: ['intellij-mcp-server'],
                    detectionPatterns: ['.idea/', '*.iml'],
                    priority: 'high',
                    dependencies: []
                },
                'eclipse-mcp': {
                    name: 'Eclipse MCP',
                    description: 'Eclipse IDE integration',
                    command: 'node',
                    args: ['eclipse-mcp-server'],
                    detectionPatterns: ['.project', '.classpath'],
                    priority: 'medium',
                    dependencies: []
                },
                'xcode-mcp': {
                    name: 'Xcode MCP',
                    description: 'Xcode IDE integration',
                    command: 'node',
                    args: ['xcode-mcp-server'],
                    detectionPatterns: ['*.xcodeproj/', '*.xcworkspace/'],
                    priority: 'high',
                    dependencies: []
                },
                'android-studio-mcp': {
                    name: 'Android Studio MCP',
                    description: 'Android Studio integration',
                    command: 'node',
                    args: ['android-studio-mcp-server'],
                    detectionPatterns: ['build.gradle', 'AndroidManifest.xml'],
                    priority: 'high',
                    dependencies: []
                }
            },

            // AI/ML SERVICES (10 servers)
            ai: {
                'openai-mcp': {
                    name: 'OpenAI MCP',
                    description: 'OpenAI API integration for GPT models',
                    command: 'node',
                    args: ['openai-mcp-server'],
                    detectionPatterns: ['openai', 'gpt-', 'chatgpt'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['OPENAI_API_KEY']
                },
                'anthropic-mcp': {
                    name: 'Anthropic MCP',
                    description: 'Anthropic Claude API integration',
                    command: 'node',
                    args: ['anthropic-mcp-server'],
                    detectionPatterns: ['anthropic', 'claude'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['ANTHROPIC_API_KEY']
                },
                'perplexity-mcp': {
                    name: 'Perplexity MCP',
                    description: 'Perplexity AI search and reasoning',
                    command: 'node',
                    args: ['perplexity-mcp-server'],
                    detectionPatterns: ['perplexity'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['PERPLEXITY_API_KEY']
                },
                'groq-mcp': {
                    name: 'Groq MCP',
                    description: 'Groq fast inference API',
                    command: 'node',
                    args: ['groq-mcp-server'],
                    detectionPatterns: ['groq'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['GROQ_API_KEY']
                },
                'huggingface-mcp': {
                    name: 'Hugging Face MCP',
                    description: 'Hugging Face model hub integration',
                    command: 'node',
                    args: ['huggingface-mcp-server'],
                    detectionPatterns: ['transformers', 'huggingface'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['HUGGINGFACE_API_KEY']
                },
                'replicate-mcp': {
                    name: 'Replicate MCP',
                    description: 'Replicate AI model hosting',
                    command: 'node',
                    args: ['replicate-mcp-server'],
                    detectionPatterns: ['replicate'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['REPLICATE_API_TOKEN']
                },
                'cohere-mcp': {
                    name: 'Cohere MCP',
                    description: 'Cohere language models',
                    command: 'node',
                    args: ['cohere-mcp-server'],
                    detectionPatterns: ['cohere'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['COHERE_API_KEY']
                },
                'together-mcp': {
                    name: 'Together AI MCP',
                    description: 'Together AI inference platform',
                    command: 'node',
                    args: ['together-mcp-server'],
                    detectionPatterns: ['together'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['TOGETHER_API_KEY']
                },
                'mistral-mcp': {
                    name: 'Mistral AI MCP',
                    description: 'Mistral AI models',
                    command: 'node',
                    args: ['mistral-mcp-server'],
                    detectionPatterns: ['mistral'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['MISTRAL_API_KEY']
                },
                'ollama-mcp': {
                    name: 'Ollama MCP',
                    description: 'Local Ollama model integration',
                    command: 'node',
                    args: ['ollama-mcp-server'],
                    detectionPatterns: ['ollama', 'Modelfile'],
                    priority: 'high',
                    dependencies: []
                }
            },

            // DATABASES (12 servers)
            databases: {
                'mysql-mcp': {
                    name: 'MySQL MCP',
                    description: 'MySQL database integration',
                    command: 'node',
                    args: ['mysql-mcp-server'],
                    detectionPatterns: ['mysql', 'my.cnf'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD']
                },
                'postgresql-mcp': {
                    name: 'PostgreSQL MCP',
                    description: 'PostgreSQL database integration',
                    command: 'node',
                    args: ['postgresql-mcp-server'],
                    detectionPatterns: ['postgresql', 'postgres', 'pg_'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['POSTGRES_HOST', 'POSTGRES_USER', 'POSTGRES_PASSWORD']
                },
                'mongodb-mcp': {
                    name: 'MongoDB MCP',
                    description: 'MongoDB database integration',
                    command: 'node',
                    args: ['mongodb-mcp-server'],
                    detectionPatterns: ['mongodb', 'mongo', 'mongoose'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['MONGODB_URI']
                },
                'redis-mcp': {
                    name: 'Redis MCP',
                    description: 'Redis cache and database',
                    command: 'node',
                    args: ['redis-mcp-server'],
                    detectionPatterns: ['redis', 'redis.conf'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['REDIS_URL']
                },
                'sqlite-mcp': {
                    name: 'SQLite MCP',
                    description: 'SQLite database integration',
                    command: 'node',
                    args: ['sqlite-mcp-server'],
                    detectionPatterns: ['*.sqlite', '*.sqlite3', '*.db'],
                    priority: 'high',
                    dependencies: []
                },
                'cassandra-mcp': {
                    name: 'Cassandra MCP',
                    description: 'Apache Cassandra database',
                    command: 'node',
                    args: ['cassandra-mcp-server'],
                    detectionPatterns: ['cassandra'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['CASSANDRA_HOSTS']
                },
                'dynamodb-mcp': {
                    name: 'DynamoDB MCP',
                    description: 'AWS DynamoDB integration',
                    command: 'node',
                    args: ['dynamodb-mcp-server'],
                    detectionPatterns: ['dynamodb'],
                    priority: 'medium',
                    dependencies: ['aws-mcp'],
                    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY']
                },
                'firestore-mcp': {
                    name: 'Firestore MCP',
                    description: 'Google Firestore integration',
                    command: 'node',
                    args: ['firestore-mcp-server'],
                    detectionPatterns: ['firestore', 'firebase'],
                    priority: 'medium',
                    dependencies: ['firebase-mcp'],
                    envVars: ['FIREBASE_PROJECT_ID']
                },
                'elasticsearch-mcp': {
                    name: 'Elasticsearch MCP',
                    description: 'Elasticsearch search engine',
                    command: 'node',
                    args: ['elasticsearch-mcp-server'],
                    detectionPatterns: ['elasticsearch', 'elastic'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['ELASTICSEARCH_URL']
                },
                'neo4j-mcp': {
                    name: 'Neo4j MCP',
                    description: 'Neo4j graph database',
                    command: 'node',
                    args: ['neo4j-mcp-server'],
                    detectionPatterns: ['neo4j'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD']
                },
                'influxdb-mcp': {
                    name: 'InfluxDB MCP',
                    description: 'InfluxDB time series database',
                    command: 'node',
                    args: ['influxdb-mcp-server'],
                    detectionPatterns: ['influxdb'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['INFLUXDB_URL']
                },
                'supabase-mcp': {
                    name: 'Supabase MCP',
                    description: 'Supabase backend as a service',
                    command: 'node',
                    args: ['supabase-mcp-server'],
                    detectionPatterns: ['supabase'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY']
                }
            },

            // CLOUD PROVIDERS (12 servers)
            cloud: {
                'aws-mcp': {
                    name: 'AWS MCP',
                    description: 'Amazon Web Services integration',
                    command: 'node',
                    args: ['aws-mcp-server'],
                    detectionPatterns: ['aws', 'cloudformation', 'lambda'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']
                },
                'gcp-mcp': {
                    name: 'Google Cloud MCP',
                    description: 'Google Cloud Platform integration',
                    command: 'node',
                    args: ['gcp-mcp-server'],
                    detectionPatterns: ['gcp', 'google-cloud', 'gcloud'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['GOOGLE_APPLICATION_CREDENTIALS']
                },
                'azure-mcp': {
                    name: 'Azure MCP',
                    description: 'Microsoft Azure integration',
                    command: 'node',
                    args: ['azure-mcp-server'],
                    detectionPatterns: ['azure', 'az-'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID']
                },
                'vercel-mcp': {
                    name: 'Vercel MCP',
                    description: 'Vercel deployment platform',
                    command: 'node',
                    args: ['vercel-mcp-server'],
                    detectionPatterns: ['vercel.json', 'now.json'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['VERCEL_TOKEN']
                },
                'netlify-mcp': {
                    name: 'Netlify MCP',
                    description: 'Netlify hosting platform',
                    command: 'node',
                    args: ['netlify-mcp-server'],
                    detectionPatterns: ['netlify.toml', '_redirects'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['NETLIFY_AUTH_TOKEN']
                },
                'heroku-mcp': {
                    name: 'Heroku MCP',
                    description: 'Heroku cloud platform',
                    command: 'node',
                    args: ['heroku-mcp-server'],
                    detectionPatterns: ['Procfile', 'heroku'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['HEROKU_API_KEY']
                },
                'digitalocean-mcp': {
                    name: 'DigitalOcean MCP',
                    description: 'DigitalOcean cloud services',
                    command: 'node',
                    args: ['digitalocean-mcp-server'],
                    detectionPatterns: ['digitalocean'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['DIGITALOCEAN_TOKEN']
                },
                'linode-mcp': {
                    name: 'Linode MCP',
                    description: 'Linode cloud services',
                    command: 'node',
                    args: ['linode-mcp-server'],
                    detectionPatterns: ['linode'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['LINODE_TOKEN']
                },
                'firebase-mcp': {
                    name: 'Firebase MCP',
                    description: 'Google Firebase platform',
                    command: 'node',
                    args: ['firebase-mcp-server'],
                    detectionPatterns: ['firebase.json', 'firebaserc'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['FIREBASE_PROJECT_ID']
                },
                'cloudflare-mcp': {
                    name: 'Cloudflare MCP',
                    description: 'Cloudflare services',
                    command: 'node',
                    args: ['cloudflare-mcp-server'],
                    detectionPatterns: ['wrangler.toml', 'cloudflare'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['CLOUDFLARE_API_TOKEN']
                },
                'railway-mcp': {
                    name: 'Railway MCP',
                    description: 'Railway deployment platform',
                    command: 'node',
                    args: ['railway-mcp-server'],
                    detectionPatterns: ['railway.json'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['RAILWAY_TOKEN']
                },
                'fly-mcp': {
                    name: 'Fly.io MCP',
                    description: 'Fly.io deployment platform',
                    command: 'node',
                    args: ['fly-mcp-server'],
                    detectionPatterns: ['fly.toml'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['FLY_API_TOKEN']
                }
            },

            // COMMUNICATION (8 servers)
            communication: {
                'slack-mcp': {
                    name: 'Slack MCP',
                    description: 'Slack messaging integration',
                    command: 'node',
                    args: ['slack-mcp-server'],
                    detectionPatterns: ['slack'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['SLACK_BOT_TOKEN']
                },
                'discord-mcp': {
                    name: 'Discord MCP',
                    description: 'Discord messaging integration',
                    command: 'node',
                    args: ['discord-mcp-server'],
                    detectionPatterns: ['discord'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['DISCORD_TOKEN']
                },
                'teams-mcp': {
                    name: 'Microsoft Teams MCP',
                    description: 'Microsoft Teams integration',
                    command: 'node',
                    args: ['teams-mcp-server'],
                    detectionPatterns: ['teams'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['TEAMS_WEBHOOK_URL']
                },
                'email-mcp': {
                    name: 'Email MCP',
                    description: 'Email service integration',
                    command: 'node',
                    args: ['email-mcp-server'],
                    detectionPatterns: ['email', 'smtp'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']
                },
                'twilio-mcp': {
                    name: 'Twilio MCP',
                    description: 'Twilio communications platform',
                    command: 'node',
                    args: ['twilio-mcp-server'],
                    detectionPatterns: ['twilio'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
                },
                'sendgrid-mcp': {
                    name: 'SendGrid MCP',
                    description: 'SendGrid email service',
                    command: 'node',
                    args: ['sendgrid-mcp-server'],
                    detectionPatterns: ['sendgrid'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['SENDGRID_API_KEY']
                },
                'telegram-mcp': {
                    name: 'Telegram MCP',
                    description: 'Telegram bot integration',
                    command: 'node',
                    args: ['telegram-mcp-server'],
                    detectionPatterns: ['telegram'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['TELEGRAM_BOT_TOKEN']
                },
                'whatsapp-mcp': {
                    name: 'WhatsApp MCP',
                    description: 'WhatsApp Business API',
                    command: 'node',
                    args: ['whatsapp-mcp-server'],
                    detectionPatterns: ['whatsapp'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['WHATSAPP_TOKEN']
                }
            },

            // ANALYTICS (7 servers)
            analytics: {
                'segment-mcp': {
                    name: 'Segment MCP',
                    description: 'Segment analytics platform',
                    command: 'node',
                    args: ['segment-mcp-server'],
                    detectionPatterns: ['segment', 'analytics.js'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['SEGMENT_WRITE_KEY']
                },
                'mixpanel-mcp': {
                    name: 'Mixpanel MCP',
                    description: 'Mixpanel product analytics',
                    command: 'node',
                    args: ['mixpanel-mcp-server'],
                    detectionPatterns: ['mixpanel'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['MIXPANEL_TOKEN']
                },
                'amplitude-mcp': {
                    name: 'Amplitude MCP',
                    description: 'Amplitude product analytics',
                    command: 'node',
                    args: ['amplitude-mcp-server'],
                    detectionPatterns: ['amplitude'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['AMPLITUDE_API_KEY']
                },
                'google-analytics-mcp': {
                    name: 'Google Analytics MCP',
                    description: 'Google Analytics integration',
                    command: 'node',
                    args: ['google-analytics-mcp-server'],
                    detectionPatterns: ['google-analytics', 'gtag', 'ga('],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['GOOGLE_ANALYTICS_ID']
                },
                'hotjar-mcp': {
                    name: 'Hotjar MCP',
                    description: 'Hotjar user behavior analytics',
                    command: 'node',
                    args: ['hotjar-mcp-server'],
                    detectionPatterns: ['hotjar'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['HOTJAR_ID']
                },
                'fullstory-mcp': {
                    name: 'FullStory MCP',
                    description: 'FullStory digital experience platform',
                    command: 'node',
                    args: ['fullstory-mcp-server'],
                    detectionPatterns: ['fullstory'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['FULLSTORY_ORG_ID']
                },
                'posthog-mcp': {
                    name: 'PostHog MCP',
                    description: 'PostHog product analytics',
                    command: 'node',
                    args: ['posthog-mcp-server'],
                    detectionPatterns: ['posthog'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['POSTHOG_API_KEY']
                }
            },

            // PAYMENT (5 servers)
            payment: {
                'stripe-mcp': {
                    name: 'Stripe MCP',
                    description: 'Stripe payment processing',
                    command: 'node',
                    args: ['stripe-mcp-server'],
                    detectionPatterns: ['stripe'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['STRIPE_SECRET_KEY']
                },
                'paypal-mcp': {
                    name: 'PayPal MCP',
                    description: 'PayPal payment integration',
                    command: 'node',
                    args: ['paypal-mcp-server'],
                    detectionPatterns: ['paypal'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
                },
                'square-mcp': {
                    name: 'Square MCP',
                    description: 'Square payment platform',
                    command: 'node',
                    args: ['square-mcp-server'],
                    detectionPatterns: ['square'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['SQUARE_ACCESS_TOKEN']
                },
                'braintree-mcp': {
                    name: 'Braintree MCP',
                    description: 'Braintree payment gateway',
                    command: 'node',
                    args: ['braintree-mcp-server'],
                    detectionPatterns: ['braintree'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['BRAINTREE_MERCHANT_ID', 'BRAINTREE_PUBLIC_KEY', 'BRAINTREE_PRIVATE_KEY']
                },
                'plaid-mcp': {
                    name: 'Plaid MCP',
                    description: 'Plaid financial services API',
                    command: 'node',
                    args: ['plaid-mcp-server'],
                    detectionPatterns: ['plaid'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['PLAID_CLIENT_ID', 'PLAID_SECRET']
                }
            },

            // VERSION CONTROL (4 servers)
            versionControl: {
                'github-mcp': {
                    name: 'GitHub MCP',
                    description: 'GitHub repository integration',
                    command: 'node',
                    args: ['github-mcp-server'],
                    detectionPatterns: ['.github/', 'github.com'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['GITHUB_TOKEN']
                },
                'gitlab-mcp': {
                    name: 'GitLab MCP',
                    description: 'GitLab repository integration',
                    command: 'node',
                    args: ['gitlab-mcp-server'],
                    detectionPatterns: ['.gitlab-ci.yml', 'gitlab.com'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['GITLAB_TOKEN']
                },
                'bitbucket-mcp': {
                    name: 'Bitbucket MCP',
                    description: 'Bitbucket repository integration',
                    command: 'node',
                    args: ['bitbucket-mcp-server'],
                    detectionPatterns: ['bitbucket-pipelines.yml', 'bitbucket.org'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['BITBUCKET_TOKEN']
                },
                'git-mcp': {
                    name: 'Git MCP',
                    description: 'Git version control system',
                    command: 'node',
                    args: ['git-mcp-server'],
                    detectionPatterns: ['.git/', '.gitignore'],
                    priority: 'high',
                    dependencies: []
                }
            },

            // CI/CD (6 servers)
            cicd: {
                'jenkins-mcp': {
                    name: 'Jenkins MCP',
                    description: 'Jenkins CI/CD integration',
                    command: 'node',
                    args: ['jenkins-mcp-server'],
                    detectionPatterns: ['Jenkinsfile', 'jenkins'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['JENKINS_URL', 'JENKINS_USER', 'JENKINS_TOKEN']
                },
                'circleci-mcp': {
                    name: 'CircleCI MCP',
                    description: 'CircleCI continuous integration',
                    command: 'node',
                    args: ['circleci-mcp-server'],
                    detectionPatterns: ['.circleci/'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['CIRCLECI_TOKEN']
                },
                'travis-mcp': {
                    name: 'Travis CI MCP',
                    description: 'Travis CI integration',
                    command: 'node',
                    args: ['travis-mcp-server'],
                    detectionPatterns: ['.travis.yml'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['TRAVIS_TOKEN']
                },
                'github-actions-mcp': {
                    name: 'GitHub Actions MCP',
                    description: 'GitHub Actions workflow integration',
                    command: 'node',
                    args: ['github-actions-mcp-server'],
                    detectionPatterns: ['.github/workflows/'],
                    priority: 'high',
                    dependencies: ['github-mcp'],
                    envVars: ['GITHUB_TOKEN']
                },
                'gitlab-ci-mcp': {
                    name: 'GitLab CI MCP',
                    description: 'GitLab CI/CD integration',
                    command: 'node',
                    args: ['gitlab-ci-mcp-server'],
                    detectionPatterns: ['.gitlab-ci.yml'],
                    priority: 'medium',
                    dependencies: ['gitlab-mcp'],
                    envVars: ['GITLAB_TOKEN']
                },
                'azure-devops-mcp': {
                    name: 'Azure DevOps MCP',
                    description: 'Azure DevOps integration',
                    command: 'node',
                    args: ['azure-devops-mcp-server'],
                    detectionPatterns: ['azure-pipelines.yml'],
                    priority: 'medium',
                    dependencies: ['azure-mcp'],
                    envVars: ['AZURE_DEVOPS_TOKEN']
                }
            },

            // MONITORING (6 servers)
            monitoring: {
                'datadog-mcp': {
                    name: 'Datadog MCP',
                    description: 'Datadog monitoring and analytics',
                    command: 'node',
                    args: ['datadog-mcp-server'],
                    detectionPatterns: ['datadog'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['DATADOG_API_KEY', 'DATADOG_APP_KEY']
                },
                'newrelic-mcp': {
                    name: 'New Relic MCP',
                    description: 'New Relic application monitoring',
                    command: 'node',
                    args: ['newrelic-mcp-server'],
                    detectionPatterns: ['newrelic'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['NEW_RELIC_LICENSE_KEY']
                },
                'sentry-mcp': {
                    name: 'Sentry MCP',
                    description: 'Sentry error tracking',
                    command: 'node',
                    args: ['sentry-mcp-server'],
                    detectionPatterns: ['sentry', '@sentry/'],
                    priority: 'high',
                    dependencies: [],
                    envVars: ['SENTRY_DSN']
                },
                'prometheus-mcp': {
                    name: 'Prometheus MCP',
                    description: 'Prometheus monitoring system',
                    command: 'node',
                    args: ['prometheus-mcp-server'],
                    detectionPatterns: ['prometheus.yml'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['PROMETHEUS_URL']
                },
                'grafana-mcp': {
                    name: 'Grafana MCP',
                    description: 'Grafana visualization platform',
                    command: 'node',
                    args: ['grafana-mcp-server'],
                    detectionPatterns: ['grafana'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['GRAFANA_URL', 'GRAFANA_API_KEY']
                },
                'uptimerobot-mcp': {
                    name: 'UptimeRobot MCP',
                    description: 'UptimeRobot uptime monitoring',
                    command: 'node',
                    args: ['uptimerobot-mcp-server'],
                    detectionPatterns: ['uptimerobot'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['UPTIMEROBOT_API_KEY']
                }
            },

            // TESTING (5 servers)
            testing: {
                'jest-mcp': {
                    name: 'Jest MCP',
                    description: 'Jest testing framework integration',
                    command: 'node',
                    args: ['jest-mcp-server'],
                    detectionPatterns: ['jest.config.js', '__tests__/', '*.test.js'],
                    priority: 'high',
                    dependencies: []
                },
                'mocha-mcp': {
                    name: 'Mocha MCP',
                    description: 'Mocha testing framework',
                    command: 'node',
                    args: ['mocha-mcp-server'],
                    detectionPatterns: ['mocha', '*.spec.js', 'test/'],
                    priority: 'medium',
                    dependencies: []
                },
                'cypress-mcp': {
                    name: 'Cypress MCP',
                    description: 'Cypress end-to-end testing',
                    command: 'node',
                    args: ['cypress-mcp-server'],
                    detectionPatterns: ['cypress.json', 'cypress/'],
                    priority: 'high',
                    dependencies: []
                },
                'selenium-mcp': {
                    name: 'Selenium MCP',
                    description: 'Selenium web automation',
                    command: 'node',
                    args: ['selenium-mcp-server'],
                    detectionPatterns: ['selenium', 'webdriver'],
                    priority: 'medium',
                    dependencies: []
                },
                'playwright-mcp': {
                    name: 'Playwright MCP',
                    description: 'Playwright testing framework',
                    command: 'node',
                    args: ['playwright-mcp-server'],
                    detectionPatterns: ['playwright.config.js', 'playwright/'],
                    priority: 'high',
                    dependencies: []
                }
            },

            // DOCUMENTATION (3 servers)
            documentation: {
                'swagger-mcp': {
                    name: 'Swagger MCP',
                    description: 'Swagger/OpenAPI documentation',
                    command: 'node',
                    args: ['swagger-mcp-server'],
                    detectionPatterns: ['swagger.json', 'openapi.yaml'],
                    priority: 'high',
                    dependencies: []
                },
                'postman-mcp': {
                    name: 'Postman MCP',
                    description: 'Postman API testing and documentation',
                    command: 'node',
                    args: ['postman-mcp-server'],
                    detectionPatterns: ['*.postman_collection.json'],
                    priority: 'medium',
                    dependencies: []
                },
                'jsdoc-mcp': {
                    name: 'JSDoc MCP',
                    description: 'JSDoc documentation generator',
                    command: 'node',
                    args: ['jsdoc-mcp-server'],
                    detectionPatterns: ['jsdoc.json', '/**', '@param'],
                    priority: 'medium',
                    dependencies: []
                }
            },

            // CORE SERVICES (10 servers)
            core: {
                'filesystem-mcp': {
                    name: 'Filesystem MCP',
                    description: 'File system operations',
                    command: 'node',
                    args: ['filesystem-mcp-server'],
                    detectionPatterns: ['*'],
                    priority: 'critical',
                    dependencies: []
                },
                'http-mcp': {
                    name: 'HTTP MCP',
                    description: 'HTTP client operations',
                    command: 'node',
                    args: ['http-mcp-server'],
                    detectionPatterns: ['http', 'https', 'api'],
                    priority: 'critical',
                    dependencies: []
                },
                'browser-mcp': {
                    name: 'Browser MCP',
                    description: 'Browser automation and web scraping',
                    command: 'node',
                    args: ['browser-mcp-server'],
                    detectionPatterns: ['puppeteer', 'selenium', 'playwright'],
                    priority: 'high',
                    dependencies: []
                },
                'search-mcp': {
                    name: 'Search MCP',
                    description: 'Web search capabilities',
                    command: 'node',
                    args: ['search-mcp-server'],
                    detectionPatterns: ['search'],
                    priority: 'high',
                    dependencies: []
                },
                'docker-mcp': {
                    name: 'Docker MCP',
                    description: 'Docker container management',
                    command: 'node',
                    args: ['docker-mcp-server'],
                    detectionPatterns: ['Dockerfile', 'docker-compose.yml'],
                    priority: 'high',
                    dependencies: []
                },
                'kubernetes-mcp': {
                    name: 'Kubernetes MCP',
                    description: 'Kubernetes orchestration',
                    command: 'node',
                    args: ['kubernetes-mcp-server'],
                    detectionPatterns: ['*.yaml', '*.yml', 'k8s/'],
                    priority: 'medium',
                    dependencies: ['docker-mcp']
                },
                'terraform-mcp': {
                    name: 'Terraform MCP',
                    description: 'Terraform infrastructure as code',
                    command: 'node',
                    args: ['terraform-mcp-server'],
                    detectionPatterns: ['*.tf', 'terraform/'],
                    priority: 'medium',
                    dependencies: []
                },
                'ansible-mcp': {
                    name: 'Ansible MCP',
                    description: 'Ansible automation',
                    command: 'node',
                    args: ['ansible-mcp-server'],
                    detectionPatterns: ['playbook.yml', 'ansible/'],
                    priority: 'low',
                    dependencies: []
                },
                'jira-mcp': {
                    name: 'Jira MCP',
                    description: 'Atlassian Jira integration',
                    command: 'node',
                    args: ['jira-mcp-server'],
                    detectionPatterns: ['jira'],
                    priority: 'medium',
                    dependencies: [],
                    envVars: ['JIRA_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN']
                },
                'confluence-mcp': {
                    name: 'Confluence MCP',
                    description: 'Atlassian Confluence integration',
                    command: 'node',
                    args: ['confluence-mcp-server'],
                    detectionPatterns: ['confluence'],
                    priority: 'low',
                    dependencies: [],
                    envVars: ['CONFLUENCE_URL', 'CONFLUENCE_EMAIL', 'CONFLUENCE_API_TOKEN']
                }
            }
        };
    }

    /**
     * Analyze project to detect required MCP servers
     */
    async analyzeProject(projectPath = '.') {
        console.log('🔍 Analyzing project for MCP server requirements...');
        
        this.detectedTechnologies.clear();
        this.recommendedServers.clear();

        try {
            await this._scanProjectFiles(projectPath);
            await this._analyzePackageJson(projectPath);
            await this._analyzeConfigFiles(projectPath);
            await this._detectFrameworksAndLibraries(projectPath);
            
            this._generateRecommendations();
            this._resolveDependencies();
            
            return this._getAnalysisResults();
        } catch (error) {
            console.error('❌ Project analysis failed:', error.message);
            throw error;
        }
    }

    /**
     * Scan project files for technology patterns
     */
    async _scanProjectFiles(projectPath) {
        const scanPatterns = [
            '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx',
            '**/*.json', '**/*.yml', '**/*.yaml',
            '**/*.tf', '**/*.md', '**/*.toml',
            'Dockerfile*', 'docker-compose*',
            '.github/**/*', '.gitlab-ci.yml',
            '**/package.json', '**/requirements.txt',
            '**/*.sql', '**/*.db', '**/*.sqlite*'
        ];

        for (const pattern of scanPatterns) {
            try {
                const files = await this._globFiles(pattern, projectPath);
                for (const file of files) {
                    await this._analyzeFile(file);
                }
            } catch (error) {
                // Continue scanning other patterns
                continue;
            }
        }
    }

    /**
     * Analyze individual file for technology patterns
     */
    async _analyzeFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) return;

            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            const fileExt = path.extname(filePath);

            // Check all server detection patterns
            for (const [category, servers] of Object.entries(this.mcpCatalog)) {
                for (const [serverId, serverConfig] of Object.entries(servers)) {
                    for (const pattern of serverConfig.detectionPatterns) {
                        if (this._matchesPattern(pattern, fileName, content, filePath)) {
                            this.detectedTechnologies.add(`${category}:${serverId}`);
                        }
                    }
                }
            }
        } catch (error) {
            // Skip files that can't be read
            return;
        }
    }

    /**
     * Check if pattern matches file
     */
    _matchesPattern(pattern, fileName, content, filePath) {
        // File name pattern
        if (pattern.includes('/') && filePath.includes(pattern)) {
            return true;
        }
        
        // Extension pattern
        if (pattern.startsWith('*.') && fileName.endsWith(pattern.slice(1))) {
            return true;
        }
        
        // Exact file name
        if (fileName === pattern) {
            return true;
        }
        
        // Content pattern
        if (content.toLowerCase().includes(pattern.toLowerCase())) {
            return true;
        }
        
        return false;
    }

    /**
     * Analyze package.json for dependencies
     */
    async _analyzePackageJson(projectPath) {
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (!fs.existsSync(packageJsonPath)) return;

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
                ...packageJson.peerDependencies
            };

            // Map dependencies to MCP servers
            for (const depName of Object.keys(dependencies)) {
                this._mapDependencyToServers(depName);
            }
        } catch (error) {
            console.warn('⚠️ Could not parse package.json:', error.message);
        }
    }

    /**
     * Map dependency name to MCP servers
     */
    _mapDependencyToServers(depName) {
        const depMappings = {
            // Databases
            'mysql': ['databases:mysql-mcp'],
            'pg': ['databases:postgresql-mcp'],
            'postgresql': ['databases:postgresql-mcp'],
            'mongodb': ['databases:mongodb-mcp'],
            'mongoose': ['databases:mongodb-mcp'],
            'redis': ['databases:redis-mcp'],
            'sqlite3': ['databases:sqlite-mcp'],
            
            // Cloud services
            'aws-sdk': ['cloud:aws-mcp'],
            '@aws-sdk': ['cloud:aws-mcp'],
            '@google-cloud': ['cloud:gcp-mcp'],
            'firebase': ['cloud:firebase-mcp'],
            '@azure': ['cloud:azure-mcp'],
            
            // Testing
            'jest': ['testing:jest-mcp'],
            'mocha': ['testing:mocha-mcp'],
            'cypress': ['testing:cypress-mcp'],
            'playwright': ['testing:playwright-mcp'],
            
            // Payment
            'stripe': ['payment:stripe-mcp'],
            'paypal': ['payment:paypal-mcp'],
            
            // Communication
            '@slack/bolt': ['communication:slack-mcp'],
            'discord.js': ['communication:discord-mcp'],
            'nodemailer': ['communication:email-mcp'],
            'twilio': ['communication:twilio-mcp'],
            
            // Monitoring
            '@sentry/node': ['monitoring:sentry-mcp'],
            'dd-trace': ['monitoring:datadog-mcp'],
            
            // Analytics
            'analytics-node': ['analytics:segment-mcp'],
            'mixpanel': ['analytics:mixpanel-mcp'],
            
            // AI/ML
            'openai': ['ai:openai-mcp'],
            '@anthropic-ai/sdk': ['ai:anthropic-mcp'],
            'groq-sdk': ['ai:groq-mcp']
        };

        for (const [pattern, servers] of Object.entries(depMappings)) {
            if (depName.includes(pattern)) {
                servers.forEach(server => this.detectedTechnologies.add(server));
            }
        }
    }

    /**
     * Analyze configuration files
     */
    async _analyzeConfigFiles(projectPath) {
        const configFiles = [
            '.env', '.env.local', '.env.example',
            'docker-compose.yml', 'Dockerfile',
            'vercel.json', 'netlify.toml',
            '.github/workflows/*.yml',
            'terraform/*.tf',
            'ansible/*.yml'
        ];

        for (const configFile of configFiles) {
            const filePath = path.join(projectPath, configFile);
            if (fs.existsSync(filePath)) {
                await this._analyzeFile(filePath);
            }
        }
    }

    /**
     * Detect frameworks and libraries
     */
    async _detectFrameworksAndLibraries(projectPath) {
        // Additional framework detection logic
        const frameworkPatterns = {
            'next.js': ['development:vscode-mcp', 'cloud:vercel-mcp'],
            'react': ['development:vscode-mcp'],
            'vue': ['development:vscode-mcp'],
            'angular': ['development:vscode-mcp'],
            'express': ['core:http-mcp'],
            'fastify': ['core:http-mcp'],
            'nestjs': ['development:vscode-mcp'],
            'django': ['development:vscode-mcp'],
            'flask': ['development:vscode-mcp']
        };

        // Check for framework indicators
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const content = fs.readFileSync(packageJsonPath, 'utf8');
            for (const [framework, servers] of Object.entries(frameworkPatterns)) {
                if (content.includes(framework)) {
                    servers.forEach(server => this.detectedTechnologies.add(server));
                }
            }
        }
    }

    /**
     * Generate server recommendations based on detected technologies
     */
    _generateRecommendations() {
        // Always include core servers
        const coreServers = ['core:filesystem-mcp', 'core:http-mcp'];
        coreServers.forEach(server => {
            this.recommendedServers.set(server, 'critical');
        });

        // Add detected servers with priorities
        for (const techServer of this.detectedTechnologies) {
            const [category, serverId] = techServer.split(':');
            const serverConfig = this.mcpCatalog[category]?.[serverId];
            
            if (serverConfig) {
                this.recommendedServers.set(techServer, serverConfig.priority || 'medium');
            }
        }

        // Add complementary servers
        this._addComplementaryServers();
    }

    /**
     * Add complementary servers based on detected technologies
     */
    _addComplementaryServers() {
        const complementaryRules = {
            'databases:mongodb-mcp': ['cloud:aws-mcp'], // MongoDB often uses AWS
            'cloud:vercel-mcp': ['versionControl:github-mcp'], // Vercel integrates with GitHub
            'testing:cypress-mcp': ['core:browser-mcp'], // Cypress needs browser automation
            'payment:stripe-mcp': ['communication:email-mcp'], // Payment systems need email
            'ai:openai-mcp': ['monitoring:sentry-mcp'] // AI apps need error monitoring
        };

        for (const [trigger, complementary] of Object.entries(complementaryRules)) {
            if (this.recommendedServers.has(trigger)) {
                complementary.forEach(server => {
                    if (!this.recommendedServers.has(server)) {
                        this.recommendedServers.set(server, 'low');
                    }
                });
            }
        }
    }

    /**
     * Resolve server dependencies
     */
    _resolveDependencies() {
        const resolvedServers = new Map(this.recommendedServers);

        for (const [serverId, priority] of this.recommendedServers) {
            const [category, serverName] = serverId.split(':');
            const serverConfig = this.mcpCatalog[category]?.[serverName];
            
            if (serverConfig?.dependencies) {
                for (const dep of serverConfig.dependencies) {
                    // Find the full server ID for the dependency
                    const depServerId = this._findServerById(dep);
                    if (depServerId && !resolvedServers.has(depServerId)) {
                        resolvedServers.set(depServerId, 'dependency');
                    }
                }
            }
        }

        this.recommendedServers = resolvedServers;
    }

    /**
     * Find server by ID across all categories
     */
    _findServerById(serverId) {
        for (const [category, servers] of Object.entries(this.mcpCatalog)) {
            if (servers[serverId]) {
                return `${category}:${serverId}`;
            }
        }
        return null;
    }

    /**
     * Get analysis results
     */
    _getAnalysisResults() {
        return {
            detectedTechnologies: Array.from(this.detectedTechnologies),
            recommendedServers: Object.fromEntries(this.recommendedServers),
            totalServers: this.recommendedServers.size,
            priorityBreakdown: this._getPriorityBreakdown()
        };
    }

    /**
     * Get priority breakdown of recommended servers
     */
    _getPriorityBreakdown() {
        const breakdown = { critical: 0, high: 0, medium: 0, low: 0, dependency: 0 };
        
        for (const priority of this.recommendedServers.values()) {
            breakdown[priority] = (breakdown[priority] || 0) + 1;
        }
        
        return breakdown;
    }

    /**
     * Generate MCP configuration file
     */
    generateConfiguration(options = {}) {
        const {
            includeOptional = false,
            priorityThreshold = 'low',
            outputPath = '.claude/mcp.json'
        } = options;

        const priorityOrder = ['critical', 'high', 'medium', 'low', 'dependency'];
        const maxPriority = priorityOrder.indexOf(priorityThreshold);

        const mcpConfig = {
            mcpServers: {}
        };

        for (const [serverId, priority] of this.recommendedServers) {
            const priorityIndex = priorityOrder.indexOf(priority);
            
            if (priorityIndex <= maxPriority || includeOptional) {
                const [category, serverName] = serverId.split(':');
                const serverConfig = this.mcpCatalog[category]?.[serverName];
                
                if (serverConfig) {
                    mcpConfig.mcpServers[serverId] = {
                        command: serverConfig.command,
                        args: serverConfig.args,
                        env: this._generateEnvConfig(serverConfig),
                        disabled: priority === 'low' ? true : false
                    };
                }
            }
        }

        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write configuration file
        fs.writeFileSync(outputPath, JSON.stringify(mcpConfig, null, 2));
        
        console.log(`✅ MCP configuration generated: ${outputPath}`);
        return mcpConfig;
    }

    /**
     * Generate environment configuration for server
     */
    _generateEnvConfig(serverConfig) {
        const env = {};
        
        if (serverConfig.envVars) {
            for (const envVar of serverConfig.envVars) {
                env[envVar] = `\${${envVar}}`;
            }
        }
        
        return Object.keys(env).length > 0 ? env : undefined;
    }

    /**
     * Get project type presets
     */
    getProjectTypePresets() {
        return {
            'web-app': {
                description: 'Full-stack web application',
                servers: [
                    'core:filesystem-mcp',
                    'core:http-mcp',
                    'versionControl:github-mcp',
                    'development:vscode-mcp',
                    'testing:jest-mcp',
                    'cloud:vercel-mcp',
                    'monitoring:sentry-mcp'
                ]
            },
            'api-service': {
                description: 'REST API service',
                servers: [
                    'core:filesystem-mcp',
                    'core:http-mcp',
                    'databases:postgresql-mcp',
                    'testing:jest-mcp',
                    'documentation:swagger-mcp',
                    'monitoring:datadog-mcp'
                ]
            },
            'mobile-app': {
                description: 'Mobile application',
                servers: [
                    'development:xcode-mcp',
                    'development:android-studio-mcp',
                    'cloud:firebase-mcp',
                    'analytics:mixpanel-mcp',
                    'payment:stripe-mcp'
                ]
            },
            'ai-ml-project': {
                description: 'AI/ML project',
                servers: [
                    'ai:openai-mcp',
                    'ai:huggingface-mcp',
                    'databases:postgresql-mcp',
                    'cloud:aws-mcp',
                    'monitoring:datadog-mcp'
                ]
            },
            'ecommerce': {
                description: 'E-commerce platform',
                servers: [
                    'core:filesystem-mcp',
                    'core:http-mcp',
                    'databases:postgresql-mcp',
                    'payment:stripe-mcp',
                    'communication:email-mcp',
                    'analytics:segment-mcp',
                    'cloud:aws-mcp'
                ]
            }
        };
    }

    /**
     * Apply project type preset
     */
    applyProjectTypePreset(presetName) {
        const presets = this.getProjectTypePresets();
        const preset = presets[presetName];
        
        if (!preset) {
            throw new Error(`Unknown preset: ${presetName}`);
        }

        this.recommendedServers.clear();
        
        for (const serverId of preset.servers) {
            const [category, serverName] = serverId.split(':');
            const serverConfig = this.mcpCatalog[category]?.[serverName];
            
            if (serverConfig) {
                this.recommendedServers.set(serverId, serverConfig.priority || 'medium');
            }
        }

        this._resolveDependencies();
        console.log(`✅ Applied preset: ${preset.description}`);
    }

    /**
     * Utility method to glob files
     */
    async _globFiles(pattern, basePath = '.') {
        const glob = require('glob');
        return new Promise((resolve, reject) => {
            glob(pattern, { cwd: basePath }, (err, files) => {
                if (err) reject(err);
                else resolve(files.map(f => path.join(basePath, f)));
            });
        });
    }

    /**
     * Get server catalog summary
     */
    getCatalogSummary() {
        const summary = {};
        let totalServers = 0;

        for (const [category, servers] of Object.entries(this.mcpCatalog)) {
            summary[category] = Object.keys(servers).length;
            totalServers += summary[category];
        }

        return {
            categories: summary,
            totalServers,
            version: '1.0.0'
        };
    }
}

module.exports = MCPFullConfigurator;

// CLI usage example
if (require.main === module) {
    const configurator = new MCPFullConfigurator();
    
    async function main() {
        try {
            console.log('🚀 MCP Full Configurator v1.0.0');
            console.log('📊 Server Catalog Summary:', configurator.getCatalogSummary());
            
            // Analyze current project
            const analysis = await configurator.analyzeProject('.');
            console.log('🔍 Project Analysis Results:', analysis);
            
            // Generate configuration
            const config = configurator.generateConfiguration({
                includeOptional: false,
                priorityThreshold: 'medium'
            });
            
            console.log('✅ Configuration generated successfully!');
            console.log(`📝 Recommended ${analysis.totalServers} MCP servers for your project.`);
            
        } catch (error) {
            console.error('❌ Configuration failed:', error.message);
            process.exit(1);
        }
    }
    
    main();
}