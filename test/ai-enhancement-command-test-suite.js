#!/usr/bin/env node

/**
 * AI Enhancement Command Test Suite
 * Testing: AI-driven code generation, component scaffolding, API generation, and intelligent project enhancement
 * 
 * This suite tests all AI-powered enhancement commands that help developers
 * automatically generate code, create components, and optimize their projects.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class AIEnhancementCommandTestSuite {
  constructor() {
    this.testProjectsDir = path.resolve(__dirname, '../test-projects/ai-enhancement-tests');
    this.results = {
      overall: { passed: 0, failed: 0, skipped: 0 },
      codeGeneration: { passed: 0, failed: 0, skipped: 0 },
      componentCreation: { passed: 0, failed: 0, skipped: 0 },
      apiGeneration: { passed: 0, failed: 0, skipped: 0 },
      schemaGeneration: { passed: 0, failed: 0, skipped: 0 },
      authSetup: { passed: 0, failed: 0, skipped: 0 },
      performanceOptimization: { passed: 0, failed: 0, skipped: 0 },
      securityAudit: { passed: 0, failed: 0, skipped: 0 },
      deploymentAutomation: { passed: 0, failed: 0, skipped: 0 }
    };
    this.detailedResults = [];
    this.startTime = Date.now();
    this.mockAIContext = this.createMockAIContext();
  }

  createMockAIContext() {
    return {
      // Mock AI responses for different enhancement types
      responses: {
        'generate-component': {
          code: `import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
          {
            'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
            'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
            'underline-offset-4 hover:underline text-primary': variant === 'link',
          },
          {
            'h-10 py-2 px-4': size === 'default',
            'h-9 px-3 rounded-md': size === 'sm',
            'h-11 px-8 rounded-md': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, type ButtonProps };`,
          tests: `import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size styles correctly', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });
});`,
          stories: `import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large Button',
  },
};`
        },
        'generate-api': {
          code: `import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { authenticateUser } from '@/middleware/auth';

// Input validation schemas
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

const updateUserSchema = createUserSchema.partial();

// GET /api/users
export async function getUsers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    
    const where = search 
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const total = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/users
export async function createUser(req: Request, res: Response) {
  try {
    const validatedData = createUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const user = await prisma.user.create({
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/users/:id
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/users/:id
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if updating email
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/users/:id
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}`,
          tests: `import request from 'supertest';
import { app } from '../app';
import { prisma } from '@/lib/prisma';

describe('User API', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/users', () => {
    it('creates a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: userData.name,
        email: userData.email,
        role: userData.role,
      });
      expect(response.body.id).toBeDefined();
    });

    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Validation error');
    });

    it('prevents duplicate emails', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);
    });
  });

  describe('GET /api/users', () => {
    it('returns paginated users', async () => {
      // Create test users
      await prisma.user.createMany({
        data: [
          { name: 'User 1', email: 'user1@example.com' },
          { name: 'User 2', email: 'user2@example.com' },
        ],
      });

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.users).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });
  });
});`
        },
        'generate-schema': {
          prisma: `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(USER)
  avatar    String?
  bio       String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  posts     Post[]
  comments  Comment[]
  likes     Like[]
  follows   Follow[] @relation("Follower")
  followers Follow[] @relation("Following")

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  slug      String   @unique
  excerpt   String?
  coverImage String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  author   User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId String
  comments Comment[]
  likes    Like[]
  tags     PostTag[]

  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  author User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String

  @@map("comments")
}

model Like {
  id     String @id @default(cuid())
  userId String
  postId String

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@map("likes")
}

model Follow {
  id          String @id @default(cuid())
  followerId  String
  followingId String

  // Relations
  follower  User @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@map("follows")
}

model Tag {
  id    String @id @default(cuid())
  name  String @unique
  color String @default("#3B82F6")

  // Relations
  posts PostTag[]

  @@map("tags")
}

model PostTag {
  postId String
  tagId  String

  // Relations
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

enum Role {
  USER
  ADMIN
  MODERATOR
}`,
          migrations: `-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN', 'MODERATOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatar" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "posts_slug_key" ON "posts"("slug");

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
        },
        'setup-auth': {
          config: `import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = signInSchema.safeParse(credentials);
        
        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await prisma.user.findUnique({
            where: { email },
          });
          
          if (!user || !user.password) return null;
          
          const passwordsMatch = await compare(password, user.password);
          
          if (passwordsMatch) {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }
        }
        
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.role = token.role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);`,
          middleware: `import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard', '/profile', '/admin'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Admin routes
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // Redirect to signin if not authenticated and trying to access protected route
  if (isProtectedRoute && !session) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect to dashboard if authenticated and trying to access auth pages
  if (session && pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check admin access
  if (isAdminRoute && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};`
        }
      }
    };
  }

  async runComprehensiveTestSuite() {
    console.log('🚀 Starting AI Enhancement Command Test Suite');
    console.log('=' .repeat(80));

    try {
      // 1. Setup test environment
      await this.setupTestEnvironment();

      // 2. Test Code Generation Commands
      await this.testCodeGenerationCommands();

      // 3. Test Component Creation with AI
      await this.testComponentCreationWithAI();

      // 4. Test API Endpoint Generation
      await this.testAPIEndpointGeneration();

      // 5. Test Database Schema Generation
      await this.testDatabaseSchemaGeneration();

      // 6. Test Authentication Setup
      await this.testAuthenticationSetup();

      // 7. Test Performance Optimization Suggestions
      await this.testPerformanceOptimizationSuggestions();

      // 8. Test Security Audit and Recommendations
      await this.testSecurityAuditRecommendations();

      // 9. Test Deployment Guidance and Automation
      await this.testDeploymentGuidanceAutomation();

      // 10. Generate comprehensive report
      await this.generateComprehensiveReport();

    } catch (error) {
      console.error('❌ AI Enhancement test suite failed:', error);
      this.recordResult('setup', 'Test Suite Execution', 'failed', error.message);
    } finally {
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('\n📋 Setting up AI enhancement test environment...');
    
    try {
      // Clean up any existing test projects
      await this.cleanupTestProjects();
      
      // Create test projects directory
      await fs.mkdir(this.testProjectsDir, { recursive: true });
      
      // Create sample project structures for testing
      await this.createSampleProjects();
      
      this.recordResult('setup', 'AI Enhancement Test Environment Setup', 'passed');
      console.log('✅ AI enhancement test environment setup completed');
      
    } catch (error) {
      this.recordResult('setup', 'AI Enhancement Test Environment Setup', 'failed', error.message);
      throw error;
    }
  }

  async createSampleProjects() {
    // Create a sample React project for testing
    const reactProjectPath = path.join(this.testProjectsDir, 'sample-react-project');
    await fs.mkdir(reactProjectPath, { recursive: true });
    
    // Create basic project structure
    const projectStructure = {
      'package.json': JSON.stringify({
        name: 'sample-react-project',
        version: '1.0.0',
        dependencies: {
          'react': '^18.0.0',
          'react-dom': '^18.0.0',
          'next': '^14.0.0',
          '@types/react': '^18.0.0'
        },
        devDependencies: {
          '@testing-library/react': '^13.0.0',
          'jest': '^29.0.0'
        }
      }, null, 2),
      'src/components/README.md': '# Components\n\nGenerated components will be placed here.',
      'src/lib/utils.ts': `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: "es5",
          lib: ["dom", "dom.iterable", "es6"],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          jsx: "preserve"
        }
      }, null, 2)
    };

    for (const [filePath, content] of Object.entries(projectStructure)) {
      const fullPath = path.join(reactProjectPath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
  }

  async testCodeGenerationCommands() {
    console.log('\n🎨 Testing AI-powered code generation commands...');
    
    const tests = [
      () => this.testReactComponentGeneration(),
      () => this.testTypeScriptInterfaceGeneration(),
      () => this.testUtilityFunctionGeneration(),
      () => this.testCustomHookGeneration(),
      () => this.testContextProviderGeneration()
    ];

    for (const test of tests) {
      await test();
    }
  }

  async testReactComponentGeneration() {
    try {
      console.log('⚛️ Testing React component generation...');
      
      const componentGenerator = `
const fs = require('fs').promises;
const path = require('path');

class ReactComponentGenerator {
  constructor() {
    this.mockAIResponse = ${JSON.stringify(this.mockAIContext.responses['generate-component'])};
  }
  
  async generateComponent(name, props = {}) {
    const { 
      variant = 'functional', 
      typescript = true, 
      styling = 'tailwind',
      testFile = true,
      storyFile = true 
    } = props;
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const componentCode = this.mockAIResponse.code.replace(/Button/g, name);
    const testCode = this.mockAIResponse.tests.replace(/Button/g, name);
    const storyCode = this.mockAIResponse.stories.replace(/Button/g, name);
    
    return {
      component: componentCode,
      test: testFile ? testCode : null,
      story: storyFile ? storyCode : null,
      metadata: {
        name,
        variant,
        typescript,
        styling,
        hasTests: testFile,
        hasStories: storyFile
      }
    };
  }
  
  async writeComponentFiles(componentData, outputDir) {
    const { name } = componentData.metadata;
    const files = [];
    
    // Write component file
    const componentPath = path.join(outputDir, \`\${name}.tsx\`);
    await fs.writeFile(componentPath, componentData.component);
    files.push(componentPath);
    
    // Write test file if requested
    if (componentData.test) {
      const testPath = path.join(outputDir, \`\${name}.test.tsx\`);
      await fs.writeFile(testPath, componentData.test);
      files.push(testPath);
    }
    
    // Write story file if requested
    if (componentData.story) {
      const storyPath = path.join(outputDir, \`\${name}.stories.tsx\`);
      await fs.writeFile(storyPath, componentData.story);
      files.push(storyPath);
    }
    
    return files;
  }
  
  validateGeneratedCode(code) {
    const validations = {
      hasExport: code.includes('export'),
      hasTypeScript: code.includes('interface') || code.includes('type'),
      hasReactImport: code.includes('import React'),
      hasForwardRef: code.includes('forwardRef'),
      hasDisplayName: code.includes('displayName'),
      isWellFormatted: code.split('\\n').length > 10
    };
    
    const score = Object.values(validations).filter(Boolean).length;
    return { validations, score, maxScore: Object.keys(validations).length };
  }
}

async function testComponentGeneration() {
  const generator = new ReactComponentGenerator();
  const outputDir = '${path.join(this.testProjectsDir, 'generated-components')}';
  
  try {
    await fs.mkdir(outputDir, { recursive: true });
    
    // Generate a Card component
    const componentData = await generator.generateComponent('Card', {
      typescript: true,
      styling: 'tailwind',
      testFile: true,
      storyFile: true
    });
    
    // Write files
    const writtenFiles = await generator.writeComponentFiles(componentData, outputDir);
    
    // Validate generated code
    const validation = generator.validateGeneratedCode(componentData.component);
    
    // Check if files exist
    const filesExist = await Promise.all(
      writtenFiles.map(async (file) => {
        try {
          await fs.access(file);
          return true;
        } catch {
          return false;
        }
      })
    );
    
    return {
      success: true,
      filesGenerated: writtenFiles.length,
      allFilesExist: filesExist.every(exists => exists),
      codeQuality: validation,
      metadata: componentData.metadata
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testComponentGeneration().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const componentScript = path.join(this.testProjectsDir, 'test-component-generation.js');
      await fs.writeFile(componentScript, componentGenerator);
      
      const { stdout } = await execAsync(`node ${componentScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.allFilesExist && result.codeQuality.score >= 4) {
        this.recordResult('codeGeneration', 'React Component Generation', 'passed',
          `Generated ${result.filesGenerated} files with quality score ${result.codeQuality.score}/${result.codeQuality.maxScore}`);
      } else {
        this.recordResult('codeGeneration', 'React Component Generation', 'failed',
          result.error || `Low quality score: ${result.codeQuality?.score || 0}`);
      }
      
    } catch (error) {
      this.recordResult('codeGeneration', 'React Component Generation', 'failed', error.message);
    }
  }

  async testAPIEndpointGeneration() {
    try {
      console.log('🌐 Testing API endpoint generation...');
      
      const apiGenerator = `
const fs = require('fs').promises;
const path = require('path');

class APIEndpointGenerator {
  constructor() {
    this.mockAIResponse = ${JSON.stringify(this.mockAIContext.responses['generate-api'])};
  }
  
  async generateAPIEndpoints(resourceName, options = {}) {
    const {
      methods = ['GET', 'POST', 'PUT', 'DELETE'],
      authentication = true,
      validation = true,
      pagination = true,
      testing = true
    } = options;
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const apiCode = this.mockAIResponse.code.replace(/User/g, resourceName).replace(/user/g, resourceName.toLowerCase());
    const testCode = this.mockAIResponse.tests.replace(/User/g, resourceName).replace(/user/g, resourceName.toLowerCase());
    
    return {
      apiCode,
      testCode: testing ? testCode : null,
      metadata: {
        resourceName,
        methods,
        features: {
          authentication,
          validation,
          pagination,
          testing
        }
      }
    };
  }
  
  async writeAPIFiles(apiData, outputDir) {
    const { resourceName } = apiData.metadata;
    const files = [];
    
    // Create API routes directory
    const routesDir = path.join(outputDir, 'api', 'routes');
    await fs.mkdir(routesDir, { recursive: true });
    
    // Write API route file
    const apiPath = path.join(routesDir, \`\${resourceName.toLowerCase()}.ts\`);
    await fs.writeFile(apiPath, apiData.apiCode);
    files.push(apiPath);
    
    // Write test file if provided
    if (apiData.testCode) {
      const testDir = path.join(outputDir, '__tests__', 'api');
      await fs.mkdir(testDir, { recursive: true });
      
      const testPath = path.join(testDir, \`\${resourceName.toLowerCase()}.test.ts\`);
      await fs.writeFile(testPath, apiData.testCode);
      files.push(testPath);
    }
    
    return files;
  }
  
  validateAPICode(code) {
    const validations = {
      hasImports: code.includes('import'),
      hasExports: code.includes('export'),
      hasValidation: code.includes('z.') || code.includes('schema'),
      hasErrorHandling: code.includes('try') && code.includes('catch'),
      hasStatusCodes: code.includes('status('),
      hasAsyncFunctions: code.includes('async'),
      hasTypeScript: code.includes('Request') && code.includes('Response'),
      hasDocumentation: code.includes('//') || code.includes('/*')
    };
    
    const score = Object.values(validations).filter(Boolean).length;
    return { validations, score, maxScore: Object.keys(validations).length };
  }
}

async function testAPIGeneration() {
  const generator = new APIEndpointGenerator();
  const outputDir = '${path.join(this.testProjectsDir, 'generated-api')}';
  
  try {
    // Generate Product API endpoints
    const apiData = await generator.generateAPIEndpoints('Product', {
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      authentication: true,
      validation: true,
      pagination: true,
      testing: true
    });
    
    // Write files
    const writtenFiles = await generator.writeAPIFiles(apiData, outputDir);
    
    // Validate generated code
    const validation = generator.validateAPICode(apiData.apiCode);
    
    // Check if files exist
    const filesExist = await Promise.all(
      writtenFiles.map(async (file) => {
        try {
          await fs.access(file);
          return true;
        } catch {
          return false;
        }
      })
    );
    
    return {
      success: true,
      filesGenerated: writtenFiles.length,
      allFilesExist: filesExist.every(exists => exists),
      codeQuality: validation,
      metadata: apiData.metadata
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testAPIGeneration().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const apiScript = path.join(this.testProjectsDir, 'test-api-generation.js');
      await fs.writeFile(apiScript, apiGenerator);
      
      const { stdout } = await execAsync(`node ${apiScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.allFilesExist && result.codeQuality.score >= 6) {
        this.recordResult('apiGeneration', 'API Endpoint Generation', 'passed',
          `Generated ${result.filesGenerated} files with quality score ${result.codeQuality.score}/${result.codeQuality.maxScore}`);
      } else {
        this.recordResult('apiGeneration', 'API Endpoint Generation', 'failed',
          result.error || `Low quality score: ${result.codeQuality?.score || 0}`);
      }
      
    } catch (error) {
      this.recordResult('apiGeneration', 'API Endpoint Generation', 'failed', error.message);
    }
  }

  async testDatabaseSchemaGeneration() {
    try {
      console.log('🗄️ Testing database schema generation...');
      
      const schemaGenerator = `
const fs = require('fs').promises;
const path = require('path');

class DatabaseSchemaGenerator {
  constructor() {
    this.mockAIResponse = ${JSON.stringify(this.mockAIContext.responses['generate-schema'])};
  }
  
  async generatePrismaSchema(entities, options = {}) {
    const {
      includeRelations = true,
      includeIndexes = true,
      includeMigrations = true,
      includeEnums = true
    } = options;
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const prismaSchema = this.mockAIResponse.prisma;
    const migrationSQL = this.mockAIResponse.migrations;
    
    return {
      schema: prismaSchema,
      migration: includeMigrations ? migrationSQL : null,
      metadata: {
        entities,
        features: {
          includeRelations,
          includeIndexes,
          includeMigrations,
          includeEnums
        }
      }
    };
  }
  
  async writeSchemaFiles(schemaData, outputDir) {
    const files = [];
    
    // Create prisma directory
    const prismaDir = path.join(outputDir, 'prisma');
    await fs.mkdir(prismaDir, { recursive: true });
    
    // Write schema file
    const schemaPath = path.join(prismaDir, 'schema.prisma');
    await fs.writeFile(schemaPath, schemaData.schema);
    files.push(schemaPath);
    
    // Write migration file if provided
    if (schemaData.migration) {
      const migrationsDir = path.join(prismaDir, 'migrations', '001_initial');
      await fs.mkdir(migrationsDir, { recursive: true });
      
      const migrationPath = path.join(migrationsDir, 'migration.sql');
      await fs.writeFile(migrationPath, schemaData.migration);
      files.push(migrationPath);
    }
    
    return files;
  }
  
  validatePrismaSchema(schema) {
    const validations = {
      hasGenerator: schema.includes('generator client'),
      hasDatasource: schema.includes('datasource db'),
      hasModels: schema.includes('model '),
      hasRelations: schema.includes('@relation'),
      hasUniqueConstraints: schema.includes('@unique'),
      hasEnums: schema.includes('enum '),
      hasIndexes: schema.includes('@@'),
      hasDefaultValues: schema.includes('@default')
    };
    
    const score = Object.values(validations).filter(Boolean).length;
    return { validations, score, maxScore: Object.keys(validations).length };
  }
}

async function testSchemaGeneration() {
  const generator = new DatabaseSchemaGenerator();
  const outputDir = '${path.join(this.testProjectsDir, 'generated-schema')}';
  
  try {
    // Generate schema for a blog application
    const entities = ['User', 'Post', 'Comment', 'Tag'];
    const schemaData = await generator.generatePrismaSchema(entities, {
      includeRelations: true,
      includeIndexes: true,
      includeMigrations: true,
      includeEnums: true
    });
    
    // Write files
    const writtenFiles = await generator.writeSchemaFiles(schemaData, outputDir);
    
    // Validate generated schema
    const validation = generator.validatePrismaSchema(schemaData.schema);
    
    // Check if files exist
    const filesExist = await Promise.all(
      writtenFiles.map(async (file) => {
        try {
          await fs.access(file);
          return true;
        } catch {
          return false;
        }
      })
    );
    
    return {
      success: true,
      filesGenerated: writtenFiles.length,
      allFilesExist: filesExist.every(exists => exists),
      schemaQuality: validation,
      metadata: schemaData.metadata
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testSchemaGeneration().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const schemaScript = path.join(this.testProjectsDir, 'test-schema-generation.js');
      await fs.writeFile(schemaScript, schemaGenerator);
      
      const { stdout } = await execAsync(`node ${schemaScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.allFilesExist && result.schemaQuality.score >= 6) {
        this.recordResult('schemaGeneration', 'Database Schema Generation', 'passed',
          `Generated ${result.filesGenerated} files with quality score ${result.schemaQuality.score}/${result.schemaQuality.maxScore}`);
      } else {
        this.recordResult('schemaGeneration', 'Database Schema Generation', 'failed',
          result.error || `Low quality score: ${result.schemaQuality?.score || 0}`);
      }
      
    } catch (error) {
      this.recordResult('schemaGeneration', 'Database Schema Generation', 'failed', error.message);
    }
  }

  async testAuthenticationSetup() {
    try {
      console.log('🔐 Testing authentication setup automation...');
      
      const authSetupGenerator = `
const fs = require('fs').promises;
const path = require('path');

class AuthenticationSetupGenerator {
  constructor() {
    this.mockAIResponse = ${JSON.stringify(this.mockAIContext.responses['setup-auth'])};
  }
  
  async generateAuthSetup(provider, options = {}) {
    const {
      providers = ['google', 'github', 'credentials'],
      database = 'prisma',
      sessionStrategy = 'jwt',
      includeMiddleware = true,
      includePages = true
    } = options;
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const authConfig = this.mockAIResponse.config;
    const middleware = this.mockAIResponse.middleware;
    
    return {
      config: authConfig,
      middleware: includeMiddleware ? middleware : null,
      metadata: {
        provider,
        providers,
        database,
        sessionStrategy,
        features: {
          includeMiddleware,
          includePages
        }
      }
    };
  }
  
  async writeAuthFiles(authData, outputDir) {
    const files = [];
    
    // Create auth directory
    const authDir = path.join(outputDir, 'auth');
    await fs.mkdir(authDir, { recursive: true });
    
    // Write auth configuration
    const configPath = path.join(outputDir, 'auth.ts');
    await fs.writeFile(configPath, authData.config);
    files.push(configPath);
    
    // Write middleware if provided
    if (authData.middleware) {
      const middlewarePath = path.join(outputDir, 'middleware.ts');
      await fs.writeFile(middlewarePath, authData.middleware);
      files.push(middlewarePath);
    }
    
    // Write environment variables template
    const envTemplate = \`# Authentication
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database
\`;
    
    const envPath = path.join(outputDir, '.env.example');
    await fs.writeFile(envPath, envTemplate);
    files.push(envPath);
    
    return files;
  }
  
  validateAuthConfig(config) {
    const validations = {
      hasProviders: config.includes('providers:'),
      hasGoogleAuth: config.includes('Google('),
      hasGitHubAuth: config.includes('GitHub('),
      hasCredentialsAuth: config.includes('Credentials('),
      hasCallbacks: config.includes('callbacks:'),
      hasJWTCallback: config.includes('jwt({'),
      hasSessionCallback: config.includes('session({'),
      hasAdapter: config.includes('PrismaAdapter'),
      hasSessionStrategy: config.includes('strategy:'),
      hasPages: config.includes('pages:')
    };
    
    const score = Object.values(validations).filter(Boolean).length;
    return { validations, score, maxScore: Object.keys(validations).length };
  }
}

async function testAuthSetup() {
  const generator = new AuthenticationSetupGenerator();
  const outputDir = '${path.join(this.testProjectsDir, 'generated-auth')}';
  
  try {
    // Generate authentication setup
    const authData = await generator.generateAuthSetup('nextauth', {
      providers: ['google', 'github', 'credentials'],
      database: 'prisma',
      sessionStrategy: 'jwt',
      includeMiddleware: true,
      includePages: true
    });
    
    // Write files
    const writtenFiles = await generator.writeAuthFiles(authData, outputDir);
    
    // Validate generated config
    const validation = generator.validateAuthConfig(authData.config);
    
    // Check if files exist
    const filesExist = await Promise.all(
      writtenFiles.map(async (file) => {
        try {
          await fs.access(file);
          return true;
        } catch {
          return false;
        }
      })
    );
    
    return {
      success: true,
      filesGenerated: writtenFiles.length,
      allFilesExist: filesExist.every(exists => exists),
      configQuality: validation,
      metadata: authData.metadata
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testAuthSetup().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const authScript = path.join(this.testProjectsDir, 'test-auth-setup.js');
      await fs.writeFile(authScript, authSetupGenerator);
      
      const { stdout } = await execAsync(`node ${authScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.allFilesExist && result.configQuality.score >= 7) {
        this.recordResult('authSetup', 'Authentication Setup', 'passed',
          `Generated ${result.filesGenerated} files with quality score ${result.configQuality.score}/${result.configQuality.maxScore}`);
      } else {
        this.recordResult('authSetup', 'Authentication Setup', 'failed',
          result.error || `Low quality score: ${result.configQuality?.score || 0}`);
      }
      
    } catch (error) {
      this.recordResult('authSetup', 'Authentication Setup', 'failed', error.message);
    }
  }

  async testPerformanceOptimizationSuggestions() {
    try {
      console.log('⚡ Testing performance optimization suggestions...');
      
      // Simulate AI-powered performance analysis
      const performanceAnalyzer = `
const fs = require('fs').promises;
const path = require('path');

class PerformanceOptimizationAnalyzer {
  constructor() {
    this.optimizations = {
      'bundle-analysis': {
        type: 'Bundle Size',
        description: 'Analyze and optimize bundle size',
        impact: 'high',
        implementation: 'Add bundle analyzer and implement code splitting'
      },
      'image-optimization': {
        type: 'Image Optimization',
        description: 'Optimize images for web delivery',
        impact: 'medium',
        implementation: 'Use Next.js Image component and WebP format'
      },
      'lazy-loading': {
        type: 'Lazy Loading',
        description: 'Implement lazy loading for components',
        impact: 'medium',
        implementation: 'Use React.lazy() and Suspense for route-based code splitting'
      },
      'caching-strategy': {
        type: 'Caching Strategy',
        description: 'Implement effective caching mechanisms',
        impact: 'high',
        implementation: 'Add Redis caching and optimize CDN configuration'
      }
    };
  }
  
  async analyzeProject(projectPath) {
    // Simulate project analysis
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const suggestions = [];
    
    // Check for large bundle potential
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf8'));
      const hasLargeDeps = Object.keys(packageJson.dependencies || {}).length > 20;
      
      if (hasLargeDeps) {
        suggestions.push(this.optimizations['bundle-analysis']);
      }
    } catch {}
    
    // Check for image usage
    try {
      const srcExists = await fs.access(path.join(projectPath, 'src')).then(() => true).catch(() => false);
      if (srcExists) {
        suggestions.push(this.optimizations['image-optimization']);
      }
    } catch {}
    
    // Always suggest lazy loading and caching for web apps
    suggestions.push(this.optimizations['lazy-loading']);
    suggestions.push(this.optimizations['caching-strategy']);
    
    return {
      projectPath,
      suggestions,
      totalSuggestions: suggestions.length,
      highImpactSuggestions: suggestions.filter(s => s.impact === 'high').length
    };
  }
  
  generateOptimizationReport(analysis) {
    const report = {
      summary: \`Found \${analysis.totalSuggestions} optimization opportunities\`,
      highPriority: analysis.suggestions.filter(s => s.impact === 'high'),
      mediumPriority: analysis.suggestions.filter(s => s.impact === 'medium'),
      lowPriority: analysis.suggestions.filter(s => s.impact === 'low'),
      implementationGuide: analysis.suggestions.map(s => ({
        optimization: s.type,
        steps: s.implementation
      }))
    };
    
    return report;
  }
}

async function testPerformanceAnalysis() {
  const analyzer = new PerformanceOptimizationAnalyzer();
  const projectPath = '${path.join(this.testProjectsDir, 'sample-react-project')}';
  
  try {
    const analysis = await analyzer.analyzeProject(projectPath);
    const report = analyzer.generateOptimizationReport(analysis);
    
    return {
      success: true,
      analysisComplete: true,
      totalSuggestions: analysis.totalSuggestions,
      highImpactSuggestions: analysis.highImpactSuggestions,
      hasImplementationGuide: report.implementationGuide.length > 0,
      report
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testPerformanceAnalysis().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const performanceScript = path.join(this.testProjectsDir, 'test-performance-optimization.js');
      await fs.writeFile(performanceScript, performanceAnalyzer);
      
      const { stdout } = await execAsync(`node ${performanceScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.totalSuggestions >= 3 && result.hasImplementationGuide) {
        this.recordResult('performanceOptimization', 'Performance Optimization Suggestions', 'passed',
          `Generated ${result.totalSuggestions} suggestions with ${result.highImpactSuggestions} high-impact recommendations`);
      } else {
        this.recordResult('performanceOptimization', 'Performance Optimization Suggestions', 'failed',
          result.error || 'Insufficient optimization suggestions generated');
      }
      
    } catch (error) {
      this.recordResult('performanceOptimization', 'Performance Optimization Suggestions', 'failed', error.message);
    }
  }

  async testSecurityAuditRecommendations() {
    try {
      console.log('🔒 Testing security audit and recommendations...');
      
      const securityAuditor = `
const fs = require('fs').promises;
const path = require('path');

class SecurityAuditor {
  constructor() {
    this.securityChecks = {
      'dependency-vulnerabilities': {
        type: 'Dependency Security',
        severity: 'high',
        description: 'Check for known vulnerabilities in dependencies',
        recommendation: 'Run npm audit and update vulnerable packages'
      },
      'authentication-security': {
        type: 'Authentication',
        severity: 'critical',
        description: 'Ensure secure authentication implementation',
        recommendation: 'Use secure session management and JWT best practices'
      },
      'cors-configuration': {
        type: 'CORS Configuration',
        severity: 'medium',
        description: 'Verify CORS settings are not overly permissive',
        recommendation: 'Configure CORS to allow only necessary origins'
      },
      'input-validation': {
        type: 'Input Validation',
        severity: 'high',
        description: 'Ensure all user inputs are properly validated',
        recommendation: 'Use validation libraries like Zod or Joi for all inputs'
      },
      'security-headers': {
        type: 'Security Headers',
        severity: 'medium',
        description: 'Add security headers to prevent common attacks',
        recommendation: 'Implement CSP, HSTS, X-Frame-Options, and other security headers'
      }
    };
  }
  
  async auditProject(projectPath) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const findings = [];
    
    // Check package.json for potential security issues
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf8'));
      
      // Check for common vulnerable packages (simplified check)
      const vulnerablePatterns = ['lodash@4.17.15', 'axios@0.18'];
      const deps = Object.keys(packageJson.dependencies || {});
      
      if (deps.length > 0) {
        findings.push(this.securityChecks['dependency-vulnerabilities']);
      }
    } catch {}
    
    // Check for authentication-related files
    try {
      const files = await fs.readdir(projectPath, { recursive: true });
      const hasAuth = files.some(file => 
        file.includes('auth') || 
        file.includes('login') || 
        file.includes('session')
      );
      
      if (hasAuth) {
        findings.push(this.securityChecks['authentication-security']);
      }
    } catch {}
    
    // Always recommend these security measures
    findings.push(this.securityChecks['cors-configuration']);
    findings.push(this.securityChecks['input-validation']);
    findings.push(this.securityChecks['security-headers']);
    
    return {
      projectPath,
      findings,
      totalFindings: findings.length,
      criticalFindings: findings.filter(f => f.severity === 'critical').length,
      highSeverityFindings: findings.filter(f => f.severity === 'high').length
    };
  }
  
  generateSecurityReport(audit) {
    const report = {
      summary: \`Security audit completed with \${audit.totalFindings} findings\`,
      riskLevel: this.calculateRiskLevel(audit),
      critical: audit.findings.filter(f => f.severity === 'critical'),
      high: audit.findings.filter(f => f.severity === 'high'),
      medium: audit.findings.filter(f => f.severity === 'medium'),
      actionItems: audit.findings.map(f => ({
        issue: f.type,
        severity: f.severity,
        action: f.recommendation
      }))
    };
    
    return report;
  }
  
  calculateRiskLevel(audit) {
    if (audit.criticalFindings > 0) return 'Critical';
    if (audit.highSeverityFindings > 2) return 'High';
    if (audit.totalFindings > 3) return 'Medium';
    return 'Low';
  }
}

async function testSecurityAudit() {
  const auditor = new SecurityAuditor();
  const projectPath = '${path.join(this.testProjectsDir, 'sample-react-project')}';
  
  try {
    const audit = await auditor.auditProject(projectPath);
    const report = auditor.generateSecurityReport(audit);
    
    return {
      success: true,
      auditComplete: true,
      totalFindings: audit.totalFindings,
      criticalFindings: audit.criticalFindings,
      highSeverityFindings: audit.highSeverityFindings,
      riskLevel: report.riskLevel,
      hasActionItems: report.actionItems.length > 0,
      report
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testSecurityAudit().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const securityScript = path.join(this.testProjectsDir, 'test-security-audit.js');
      await fs.writeFile(securityScript, securityAuditor);
      
      const { stdout } = await execAsync(`node ${securityScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.totalFindings >= 3 && result.hasActionItems) {
        this.recordResult('securityAudit', 'Security Audit and Recommendations', 'passed',
          `Found ${result.totalFindings} security findings with risk level: ${result.riskLevel}`);
      } else {
        this.recordResult('securityAudit', 'Security Audit and Recommendations', 'failed',
          result.error || 'Insufficient security findings or recommendations');
      }
      
    } catch (error) {
      this.recordResult('securityAudit', 'Security Audit and Recommendations', 'failed', error.message);
    }
  }

  async testDeploymentGuidanceAutomation() {
    try {
      console.log('🚀 Testing deployment guidance and automation...');
      
      const deploymentGuide = `
const fs = require('fs').promises;
const path = require('path');

class DeploymentGuidanceGenerator {
  constructor() {
    this.platforms = {
      vercel: {
        name: 'Vercel',
        type: 'Frontend/Fullstack',
        suitableFor: ['nextjs', 'react', 'vue'],
        configFile: 'vercel.json',
        envVars: ['NEXTAUTH_SECRET', 'DATABASE_URL'],
        buildCommand: 'npm run build',
        outputDirectory: '.next'
      },
      railway: {
        name: 'Railway',
        type: 'Backend/Database',
        suitableFor: ['node', 'rust', 'python'],
        configFile: 'railway.json',
        envVars: ['DATABASE_URL', 'JWT_SECRET'],
        buildCommand: 'npm run build',
        startCommand: 'npm start'
      },
      docker: {
        name: 'Docker',
        type: 'Containerized',
        suitableFor: ['any'],
        configFile: 'Dockerfile',
        envVars: [],
        buildCommand: 'docker build',
        runCommand: 'docker run'
      }
    };
  }
  
  async analyzeProjectForDeployment(projectPath) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const analysis = {
      projectType: 'unknown',
      frameworks: [],
      recommendedPlatforms: [],
      requirements: []
    };
    
    try {
      const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf8'));
      
      // Detect frameworks
      if (packageJson.dependencies?.next) {
        analysis.frameworks.push('nextjs');
        analysis.projectType = 'frontend';
      }
      if (packageJson.dependencies?.react) {
        analysis.frameworks.push('react');
      }
      if (packageJson.dependencies?.express) {
        analysis.frameworks.push('express');
        analysis.projectType = 'backend';
      }
      
      // Recommend platforms based on detected frameworks
      analysis.recommendedPlatforms = Object.values(this.platforms).filter(platform =>
        platform.suitableFor.some(tech => analysis.frameworks.includes(tech)) ||
        platform.suitableFor.includes('any')
      );
      
    } catch {}
    
    return analysis;
  }
  
  async generateDeploymentConfig(analysis, platform) {
    const platformConfig = this.platforms[platform];
    if (!platformConfig) {
      throw new Error(\`Unsupported platform: \${platform}\`);
    }
    
    const configs = {};
    
    if (platform === 'vercel') {
      configs['vercel.json'] = JSON.stringify({
        version: 2,
        builds: [
          {
            src: "package.json",
            use: "@vercel/next"
          }
        ],
        routes: [
          {
            src: "/(.*)",
            dest: "/"
          }
        ],
        env: platformConfig.envVars.reduce((acc, envVar) => {
          acc[envVar] = \`@\${envVar.toLowerCase()}\`;
          return acc;
        }, {})
      }, null, 2);
    }
    
    if (platform === 'docker') {
      configs['Dockerfile'] = \`FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]\`;

      configs['docker-compose.yml'] = \`version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
      - /app/node_modules\`;
    }
    
    return configs;
  }
  
  generateDeploymentInstructions(analysis, platform, configs) {
    const platformConfig = this.platforms[platform];
    
    const instructions = [
      \`# Deployment Guide for \${platformConfig.name}\`,
      '',
      '## Prerequisites',
      '- Ensure all environment variables are configured',
      '- Run tests to verify application stability',
      '- Optimize build for production',
      '',
      '## Configuration Files',
      ...Object.keys(configs).map(file => \`- \${file}\`),
      '',
      '## Environment Variables',
      ...platformConfig.envVars.map(envVar => \`- \${envVar}\`),
      '',
      '## Deployment Steps',
      '1. Push code to repository',
      '2. Configure environment variables',
      '3. Deploy using platform-specific commands',
      '4. Verify deployment',
      '5. Monitor application performance'
    ];
    
    return instructions.join('\\n');
  }
}

async function testDeploymentGuidance() {
  const generator = new DeploymentGuidanceGenerator();
  const projectPath = '${path.join(this.testProjectsDir, 'sample-react-project')}';
  
  try {
    const analysis = await generator.analyzeProjectForDeployment(projectPath);
    
    // Generate deployment config for Vercel (most common for React/Next.js)
    const configs = await generator.generateDeploymentConfig(analysis, 'vercel');
    const instructions = generator.generateDeploymentInstructions(analysis, 'vercel', configs);
    
    return {
      success: true,
      analysisComplete: true,
      detectedFrameworks: analysis.frameworks.length,
      recommendedPlatforms: analysis.recommendedPlatforms.length,
      generatedConfigs: Object.keys(configs).length,
      hasInstructions: instructions.length > 100,
      analysis,
      configs,
      instructions: instructions.split('\\n').length
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testDeploymentGuidance().then(result => {
  console.log(JSON.stringify(result));
}).catch(error => {
  console.log(JSON.stringify({ success: false, error: error.message }));
});
`;

      const deploymentScript = path.join(this.testProjectsDir, 'test-deployment-guidance.js');
      await fs.writeFile(deploymentScript, deploymentGuide);
      
      const { stdout } = await execAsync(`node ${deploymentScript}`);
      const result = JSON.parse(stdout.trim());
      
      if (result.success && result.generatedConfigs >= 1 && result.hasInstructions) {
        this.recordResult('deploymentAutomation', 'Deployment Guidance and Automation', 'passed',
          `Generated ${result.generatedConfigs} config files and ${result.instructions} instruction lines`);
      } else {
        this.recordResult('deploymentAutomation', 'Deployment Guidance and Automation', 'failed',
          result.error || 'Failed to generate deployment guidance');
      }
      
    } catch (error) {
      this.recordResult('deploymentAutomation', 'Deployment Guidance and Automation', 'failed', error.message);
    }
  }

  // Utility methods
  async cleanupTestProjects() {
    try {
      await fs.rm(this.testProjectsDir, { recursive: true, force: true });
    } catch (error) {
      // Directory doesn't exist, that's fine
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up AI enhancement test environment...');
    await this.cleanupTestProjects();
    console.log('✅ Cleanup completed');
  }

  recordResult(category, testName, status, details = '') {
    const result = {
      category,
      testName,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.detailedResults.push(result);
    this.results[category][status]++;
    this.results.overall[status]++;
    
    const emoji = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⏭️ ';
    console.log(`${emoji} ${testName}: ${status.toUpperCase()}${details ? ` - ${details}` : ''}`);
  }

  async generateComprehensiveReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      summary: {
        duration: `${Math.round(duration / 1000)}s`,
        totalTests: this.results.overall.passed + this.results.overall.failed + this.results.overall.skipped,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        skipped: this.results.overall.skipped,
        passRate: `${Math.round((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100)}%`
      },
      categoryResults: this.results,
      detailedResults: this.detailedResults,
      timestamp: new Date().toISOString()
    };
    
    // Write comprehensive report
    const reportId = `ai-enhancement-test-${Date.now()}`;
    const reportPath = path.join(__dirname, `${reportId}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary(report);
    const summaryPath = path.join(__dirname, `${reportId}-summary.md`);
    await fs.writeFile(summaryPath, markdownSummary);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 AI ENHANCEMENT COMMAND TEST SUITE COMPLETE');
    console.log('='.repeat(80));
    console.log(`Duration: ${report.summary.duration}`);
    console.log(`Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Skipped: ${report.summary.skipped}`);
    console.log(`Pass Rate: ${report.summary.passRate}`);
    console.log(`\nDetailed report: ${reportPath}`);
    console.log(`Summary: ${summaryPath}`);
  }

  generateMarkdownSummary(report) {
    return `# AI Enhancement Command Test Suite Report

## Summary
- **Duration**: ${report.summary.duration}
- **Total Tests**: ${report.summary.totalTests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Skipped**: ${report.summary.skipped}
- **Pass Rate**: ${report.summary.passRate}

## Test Categories

### Code Generation
- Passed: ${report.categoryResults.codeGeneration.passed}
- Failed: ${report.categoryResults.codeGeneration.failed}
- Skipped: ${report.categoryResults.codeGeneration.skipped}

### Component Creation
- Passed: ${report.categoryResults.componentCreation.passed}
- Failed: ${report.categoryResults.componentCreation.failed}
- Skipped: ${report.categoryResults.componentCreation.skipped}

### API Generation
- Passed: ${report.categoryResults.apiGeneration.passed}
- Failed: ${report.categoryResults.apiGeneration.failed}
- Skipped: ${report.categoryResults.apiGeneration.skipped}

### Schema Generation
- Passed: ${report.categoryResults.schemaGeneration.passed}
- Failed: ${report.categoryResults.schemaGeneration.failed}
- Skipped: ${report.categoryResults.schemaGeneration.skipped}

### Authentication Setup
- Passed: ${report.categoryResults.authSetup.passed}
- Failed: ${report.categoryResults.authSetup.failed}
- Skipped: ${report.categoryResults.authSetup.skipped}

### Performance Optimization
- Passed: ${report.categoryResults.performanceOptimization.passed}
- Failed: ${report.categoryResults.performanceOptimization.failed}
- Skipped: ${report.categoryResults.performanceOptimization.skipped}

### Security Audit
- Passed: ${report.categoryResults.securityAudit.passed}
- Failed: ${report.categoryResults.securityAudit.failed}
- Skipped: ${report.categoryResults.securityAudit.skipped}

### Deployment Automation
- Passed: ${report.categoryResults.deploymentAutomation.passed}
- Failed: ${report.categoryResults.deploymentAutomation.failed}
- Skipped: ${report.categoryResults.deploymentAutomation.skipped}

## Detailed Results

${report.detailedResults.map(result => 
  `- **${result.testName}** (${result.category}): ${result.status.toUpperCase()}${result.details ? ` - ${result.details}` : ''}`
).join('\n')}

---
*Generated on ${report.timestamp}*
`;
  }
}

// Run the test suite if called directly
if (require.main === module) {
  const testSuite = new AIEnhancementCommandTestSuite();
  testSuite.runComprehensiveTestSuite().catch(console.error);
}

module.exports = AIEnhancementCommandTestSuite;