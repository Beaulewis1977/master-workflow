# Modern Full-Stack Template

A production-ready full-stack template with React 18+, Next.js 14+, Rust backend, and real-time features.

## Tech Stack

### Frontend
- **React 18+** with TypeScript
- **Next.js 14+** with App Router
- **shadcn/ui** components
- **Tailwind CSS** with custom design system
- **Zustand** for state management
- **TanStack Query** for server state
- **Framer Motion** for animations

### Backend
- **Rust** with Axum web framework
- **Supabase** for authentication and real-time
- **PostgreSQL** with real-time subscriptions
- **Redis** for caching and sessions
- **WebSocket** support for live updates

### Deployment
- **Vercel** for frontend
- **Railway/Fly.io** for Rust backend
- **Docker** containers for development
- **GitHub Actions** for CI/CD

## Features

- Authentication with Supabase Auth
- Real-time chat and notifications
- File upload with optimistic updates
- Dark mode with system preference
- Responsive design with mobile-first
- SEO optimization and meta tags
- Error boundaries and loading states
- Form validation with React Hook Form
- API error handling and retry logic
- WebSocket connection management

## Quick Start

```bash
npx claude-flow@2.0.0 create my-app --template fullstack-modern
cd my-app
npm run dev
```

## Development

```bash
# Start all services
docker-compose up -d

# Frontend development
cd frontend
npm run dev

# Backend development  
cd backend
cargo run

# Run tests
npm run test
cargo test
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379

# Backend
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Deployment

### Frontend (Vercel)
```bash
vercel deploy
```

### Backend (Railway)
```bash
railway login
railway init
railway deploy
```

## Architecture

```
fullstack-app/
├── frontend/          # Next.js React app
├── backend/           # Rust API server
├── shared/            # Shared types/utils
├── docker-compose.yml # Development environment
└── vercel.json       # Deployment config
```