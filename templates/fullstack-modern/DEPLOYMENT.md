# Deployment Guide

This guide covers deploying your full-stack application to production environments.

## Frontend Deployment (Vercel)

### Prerequisites
- [Vercel account](https://vercel.com)
- [Vercel CLI](https://vercel.com/cli) installed

### Automatic Deployment (Recommended)

1. **Connect your GitHub repository**
   ```bash
   # Push your code to GitHub
   git add .
   git commit -m "Deploy to production"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure build settings:
     - Framework Preset: `Next.js`
     - Build Command: `cd frontend && npm run build`
     - Output Directory: `frontend/.next`
     - Install Command: `cd frontend && npm install`

3. **Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app/api
   BACKEND_URL=https://your-backend-url.railway.app
   SENTRY_DSN=your-sentry-dsn
   ```

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Deploy to production
vercel --prod
```

## Backend Deployment (Railway)

### Prerequisites
- [Railway account](https://railway.app)
- [Railway CLI](https://docs.railway.app/develop/cli) installed

### Deploy to Railway

1. **Install Railway CLI**
   ```bash
   # macOS
   brew install railway

   # Windows/Linux
   npm install -g @railway/cli
   ```

2. **Login and Initialize**
   ```bash
   railway login
   cd backend
   railway init
   ```

3. **Configure Environment Variables**
   ```bash
   railway variables set DATABASE_URL=postgresql://user:pass@host:port/dbname
   railway variables set REDIS_URL=redis://host:port
   railway variables set JWT_SECRET=your-jwt-secret
   railway variables set SUPABASE_URL=your-supabase-url
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   railway variables set FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Deploy**
   ```bash
   railway deploy
   ```

### Alternative: Fly.io Deployment

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Initialize and Deploy**
   ```bash
   cd backend
   fly auth login
   fly launch
   fly deploy
   ```

## Database Setup (Supabase)

### 1. Create Supabase Project
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Create new project
- Note down your project URL and keys

### 2. Run Migrations
```sql
-- Copy and run the SQL from backend/migrations/0001_initial.sql
-- in your Supabase SQL Editor
```

### 3. Configure Row Level Security
The migration file includes RLS policies, but verify they're active:
- Go to Authentication > Policies
- Ensure all tables have appropriate policies

### 4. Configure Auth Providers (Optional)
- Go to Authentication > Providers
- Enable Google, GitHub, Discord, etc.
- Add OAuth app credentials

## Redis Setup

### Using Railway Redis

1. **Add Redis Service**
   ```bash
   railway add redis
   ```

2. **Get Connection URL**
   ```bash
   railway variables
   # Look for REDIS_URL
   ```

### Using Redis Cloud

1. Create account at [Redis Cloud](https://redis.com/redis-enterprise-cloud/)
2. Create database
3. Use connection string in your environment variables

## Environment Variables Summary

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app
SENTRY_DSN=your-sentry-dsn
```

### Backend (Railway/Fly.io)
```bash
DATABASE_URL=postgresql://postgres:password@host:port/dbname
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secret-jwt-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=https://your-app.vercel.app
PORT=8000
SENTRY_DSN=your-sentry-dsn
```

## Monitoring & Analytics

### Sentry Setup

1. **Create Sentry Project**
   - Go to [Sentry.io](https://sentry.io)
   - Create new project
   - Get DSN

2. **Configure Environment Variables**
   ```bash
   # Add to both frontend and backend
   SENTRY_DSN=https://your-dsn@sentry.io/project-id
   ```

### Performance Monitoring

- **Frontend**: Vercel Analytics automatically tracks Core Web Vitals
- **Backend**: Sentry tracks errors and performance
- **Database**: Supabase provides query performance metrics

## Domain Configuration

### Custom Domain on Vercel

1. Go to Project Settings > Domains
2. Add your custom domain
3. Configure DNS records:
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   ```

### SSL Certificates

Both Vercel and Railway automatically provision SSL certificates for custom domains.

## CI/CD Pipeline

The included GitHub Actions workflow automatically:

1. **On Pull Requests**: Runs tests and security audits
2. **On Push to `develop`**: Deploys to staging
3. **On Push to `main`**: Deploys to production

### Required GitHub Secrets

```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
RAILWAY_TOKEN=your-railway-token
SUPABASE_ACCESS_TOKEN=your-supabase-token
```

## Performance Optimization

### Frontend

1. **Enable compression** (automatically handled by Vercel)
2. **Optimize images** using Next.js Image component
3. **Code splitting** with dynamic imports
4. **Static generation** for static pages

### Backend

1. **Connection pooling** (configured in database.rs)
2. **Redis caching** for frequently accessed data
3. **Horizontal scaling** on Railway/Fly.io
4. **CDN** for static assets

## Backup & Recovery

### Database Backups

- **Supabase**: Automatic daily backups on paid plans
- **Manual backup**:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

### Application Backups

- **Code**: Version controlled on GitHub
- **Environment variables**: Document in secure location
- **User uploads**: Store in cloud storage (S3, Cloudinary)

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify `FRONTEND_URL` in backend environment
   - Check CORS configuration in `main.rs`

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Check connection limits

3. **WebSocket Issues**
   - Ensure WebSocket support on hosting platform
   - Verify `NEXT_PUBLIC_WS_URL` configuration

4. **Build Failures**
   - Check TypeScript errors
   - Verify all environment variables are set

### Debug Commands

```bash
# Check backend logs
railway logs

# Check frontend build
vercel logs

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

## Security Checklist

- [ ] Environment variables are set correctly
- [ ] JWT secret is cryptographically secure
- [ ] Database RLS policies are active
- [ ] HTTPS is enforced
- [ ] Rate limiting is configured
- [ ] Error messages don't leak sensitive information
- [ ] Dependencies are up to date
- [ ] Security headers are configured

## Cost Optimization

### Free Tier Limits

- **Vercel**: 100GB bandwidth, 6,000 build minutes
- **Railway**: 500 hours, $5 credit
- **Supabase**: 500MB database, 2GB bandwidth
- **Redis Cloud**: 30MB storage

### Scaling Considerations

- Monitor usage through provider dashboards
- Set up billing alerts
- Consider upgrading to paid plans for production workloads

---

For more specific deployment instructions, check the provider documentation:
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Supabase Docs](https://supabase.com/docs)
- [Fly.io Docs](https://fly.io/docs)