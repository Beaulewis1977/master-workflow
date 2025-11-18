# TypeScript Best Practices

## Type System Fundamentals
- Always enable strict mode in `tsconfig.json`
- Use interfaces for object shapes and contracts
- Prefer type unions over enums when representing a finite set of values
- Use const assertions for literal types

```typescript
// Good - strict configuration
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}

// Good - interface for object shape
interface User {
  readonly id: string;
  name: string;
  email: string;
  age?: number;
}

// Good - union types
type Theme = 'light' | 'dark' | 'auto';

// Good - const assertion
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE'] as const;
type HttpMethod = typeof HTTP_METHODS[number];
```

## Generic Types and Utility Types
- Use generics for reusable components and functions
- Leverage built-in utility types (`Partial`, `Required`, `Pick`, `Omit`)
- Create custom utility types for domain-specific transformations

```typescript
// Generic function with constraints
function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

// Utility types for API responses
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// Custom utility types
type NonNullable<T> = T extends null | undefined ? never : T;
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Practical usage
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;
type UserPublic = Omit<User, 'email'>;
```

## Error Handling and Type Safety
- Use discriminated unions for error handling
- Create custom error types with proper inheritance
- Use Result patterns for functional error handling

```typescript
// Discriminated union for API results
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// Custom error types
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Safe async function
async function fetchUser(id: string): Promise<Result<User, ValidationError>> {
  try {
    if (!id.trim()) {
      return {
        success: false,
        error: new ValidationError('ID cannot be empty', 'id', id)
      };
    }
    
    const user = await api.getUser(id);
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof ValidationError ? error : new Error('Unknown error')
    };
  }
}
```

## Advanced Type Patterns
- Use conditional types for complex type transformations
- Implement mapped types for object transformations
- Use template literal types for string manipulation

```typescript
// Conditional types
type ApiEndpoint<T> = T extends 'user' ? '/api/users' : 
                     T extends 'post' ? '/api/posts' : never;

// Mapped types
type Nullable<T> = {
  [P in keyof T]: T[P] | null;
};

// Template literal types
type EventName<T extends string> = `on${Capitalize<T>}`;
type UserEvents = EventName<'create' | 'update' | 'delete'>; // 'onCreate' | 'onUpdate' | 'onDelete'

// Complex type manipulation
type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};
```

## Code Organization and Module Design
- Use barrel exports for clean module interfaces
- Organize types in dedicated type files
- Use namespace for related type groupings

```typescript
// types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

// types/index.ts (barrel export)
export * from './user';
export * from './api';
export * from './common';

// Using namespaces for related types
namespace API {
  export interface Request<T = unknown> {
    data: T;
    headers: Record<string, string>;
  }
  
  export interface Response<T = unknown> {
    data: T;
    status: number;
    headers: Record<string, string>;
  }
}
```

## Testing with TypeScript
- Use type-safe mocking and testing utilities
- Test type definitions with compilation tests
- Use assertion functions for runtime type checking

```typescript
// Type-safe mock
interface MockUser extends User {
  mockMethod: jest.MockedFunction<(id: string) => Promise<void>>;
}

// Type assertion function
function assertIsUser(value: unknown): asserts value is User {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Expected object');
  }
  
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.name !== 'string') {
    throw new Error('Invalid user object');
  }
}

// Compilation test
type TestType = User extends { id: string } ? true : false;
const compilationTest: TestType = true; // This will fail compilation if User doesn't have id
```

## Performance and Bundle Optimization
- Use tree shaking friendly imports and exports
- Implement lazy loading with dynamic imports
- Use type-only imports when appropriate

```typescript
// Type-only imports
import type { User } from './types/user';
import type { ApiResponse } from './types/api';

// Regular import for runtime usage
import { validateUser } from './utils/validation';

// Dynamic imports for code splitting
const LazyComponent = React.lazy(() => import('./components/HeavyComponent'));

// Tree-shakable utility exports
export const userUtils = {
  validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  formatName: (name: string) => name.trim().toLowerCase(),
} as const;
```

## Configuration and Environment
- Use environment-specific type definitions
- Implement configuration validation
- Use const assertions for configuration objects

```typescript
// Environment types
interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  API_URL: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
}

// Configuration validation
function validateConfig(config: Record<string, unknown>): Environment {
  const requiredKeys: (keyof Environment)[] = ['NODE_ENV', 'API_URL', 'DATABASE_URL', 'JWT_SECRET'];
  
  for (const key of requiredKeys) {
    if (!(key in config) || typeof config[key] !== 'string') {
      throw new Error(`Missing or invalid environment variable: ${key}`);
    }
  }
  
  return config as Environment;
}

// Type-safe configuration
const config = {
  development: {
    apiUrl: 'http://localhost:3000',
    debug: true,
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false,
  },
} as const;

type Config = typeof config;
type Environment = keyof Config;
```

## React with TypeScript
- Use proper component typing with React.FC or function components
- Implement type-safe props and state
- Use generic components when appropriate

```typescript
// Functional component with props
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  variant, 
  size = 'medium', 
  onClick, 
  children, 
  disabled = false 
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage
<List
  items={users}
  renderItem={(user) => <div>{user.name}</div>}
  keyExtractor={(user) => user.id}
/>
```

## Node.js and Express with TypeScript
- Use proper typing for middleware and route handlers
- Implement type-safe request/response handling
- Use dependency injection for better testability

```typescript
// Express with TypeScript
import express, { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: User;
}

// Type-safe middleware
const authenticateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const user = await verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Type-safe route handler
const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response<User | { error: string }>
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
```

## Build Configuration
```json
// tsconfig.json for strict TypeScript
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```