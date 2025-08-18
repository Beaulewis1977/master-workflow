import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowRight, Code, Database, Globe, Zap, Shield, Smartphone } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="container-custom">
      {/* Hero Section */}
      <section className="section-padding text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="gradient-text mb-6">
            Modern Full-Stack Application
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">
            Built with React 18, Next.js 14, TypeScript, Rust backend, and real-time features.
            Production-ready with authentication, database, and deployment configuration.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="group">
              <Link href="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/docs">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding">
        <div className="mb-12 text-center">
          <h2 className="mb-4">Features & Tech Stack</h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Everything you need to build and deploy modern web applications
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Modern Frontend</CardTitle>
              </div>
              <CardDescription>
                React 18, Next.js 14, TypeScript, shadcn/ui, Tailwind CSS
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">React 18</Badge>
                <Badge variant="secondary">Next.js 14</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">shadcn/ui</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Rust Backend</CardTitle>
              </div>
              <CardDescription>
                High-performance Rust API with Axum, PostgreSQL, Redis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Rust</Badge>
                <Badge variant="secondary">Axum</Badge>
                <Badge variant="secondary">PostgreSQL</Badge>
                <Badge variant="secondary">Redis</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Features</CardTitle>
              </div>
              <CardDescription>
                WebSocket connections, live updates, real-time notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">WebSocket</Badge>
                <Badge variant="secondary">Supabase</Badge>
                <Badge variant="secondary">Live Updates</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Authentication</CardTitle>
              </div>
              <CardDescription>
                Secure auth with Supabase, social logins, role-based access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Supabase Auth</Badge>
                <Badge variant="secondary">Social Login</Badge>
                <Badge variant="secondary">RBAC</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Deployment Ready</CardTitle>
              </div>
              <CardDescription>
                Vercel frontend, Railway/Fly.io backend, Docker, CI/CD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Vercel</Badge>
                <Badge variant="secondary">Railway</Badge>
                <Badge variant="secondary">Docker</Badge>
                <Badge variant="secondary">GitHub Actions</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Mobile First</CardTitle>
              </div>
              <CardDescription>
                Responsive design, PWA support, mobile optimizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Responsive</Badge>
                <Badge variant="secondary">PWA</Badge>
                <Badge variant="secondary">Mobile UI</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4">Ready to Build?</h2>
          <p className="mb-8 text-muted-foreground">
            Start building your next application with our modern full-stack template.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/auth/signup">Create Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com/yourorg/{{projectName}}" target="_blank">
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}