# JavaScript Best Practices

## Code Style
- Use `const` for values that won't be reassigned, `let` for values that will
- Prefer arrow functions for callbacks and functional programming
- Use template literals for string interpolation
- Destructure objects and arrays when appropriate
- Use optional chaining (`?.`) and nullish coalescing (`??`)

## Async Programming
- Always use `async/await` over callbacks or raw promises
- Handle errors with try/catch blocks
- Use `Promise.all()` for parallel async operations
- Implement proper error boundaries in React applications

## Module System
- Use ES6 modules (import/export) over CommonJS when possible
- Keep modules focused and single-purpose
- Use named exports for utilities, default exports for main components
- Organize imports: external deps, internal modules, styles

## Error Handling
```javascript
// Good
try {
  const result = await riskyOperation();
  return processResult(result);
} catch (error) {
  logger.error('Operation failed:', error);
  throw new CustomError('Failed to process', { cause: error });
}
```

## Performance
- Use `Object.freeze()` for immutable objects
- Implement debouncing/throttling for event handlers
- Use Web Workers for CPU-intensive tasks
- Lazy load modules and components when appropriate
- Implement proper memoization for expensive computations

## Security
- Never trust user input - always validate and sanitize
- Use parameterized queries to prevent SQL injection
- Implement Content Security Policy (CSP)
- Store secrets in environment variables
- Use HTTPS everywhere
- Implement rate limiting for APIs

## Testing
- Write tests before or alongside code (TDD/BDD)
- Aim for >80% code coverage
- Test edge cases and error conditions
- Use mocks and stubs appropriately
- Keep tests isolated and independent

## Documentation
- Use JSDoc comments for functions and classes
- Document complex algorithms and business logic
- Keep README files up to date
- Document API endpoints with OpenAPI/Swagger
- Include examples in documentation