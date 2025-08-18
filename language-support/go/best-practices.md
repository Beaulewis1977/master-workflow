# Go Best Practices

## Code Style and Formatting
- Always use `gofmt` or `goimports` for consistent formatting
- Follow the official Go Code Review Comments guidelines
- Use meaningful variable and function names
- Keep line length reasonable (typically under 100 characters)
- Use camelCase for exported functions, lowercase for unexported

## Package Design
- Keep packages focused and cohesive
- Use clear, descriptive package names
- Avoid package names like `util`, `common`, or `base`
- Make the zero value useful whenever possible
- Design APIs that are hard to misuse

## Error Handling
```go
// Good - explicit error handling
func processFile(filename string) error {
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("failed to open file %q: %w", filename, err)
    }
    defer file.Close()
    
    // Process file...
    return nil
}

// Use custom error types for specific cases
type ValidationError struct {
    Field string
    Value string
}

func (e ValidationError) Error() string {
    return fmt.Sprintf("validation failed for field %s with value %s", e.Field, e.Value)
}
```

## Concurrency
- Use goroutines for concurrent operations
- Communicate through channels, don't share memory
- Use `sync.WaitGroup` for waiting on multiple goroutines
- Use `context.Context` for cancellation and timeouts
- Avoid goroutine leaks by ensuring proper cleanup

```go
// Good concurrency pattern
func processItems(ctx context.Context, items []Item) error {
    var wg sync.WaitGroup
    errChan := make(chan error, len(items))
    
    for _, item := range items {
        wg.Add(1)
        go func(item Item) {
            defer wg.Done()
            if err := processItem(ctx, item); err != nil {
                errChan <- err
            }
        }(item)
    }
    
    wg.Wait()
    close(errChan)
    
    // Check for errors
    for err := range errChan {
        if err != nil {
            return err
        }
    }
    return nil
}
```

## Interface Design
- Keep interfaces small and focused
- Define interfaces at the point of use, not implementation
- Accept interfaces, return structs
- Use io.Reader, io.Writer, and other standard interfaces

```go
// Good - small, focused interface
type UserRepository interface {
    GetUser(id string) (*User, error)
    SaveUser(*User) error
}

// Better - even more focused
type UserGetter interface {
    GetUser(id string) (*User, error)
}

type UserSaver interface {
    SaveUser(*User) error
}
```

## Testing
- Write table-driven tests for multiple test cases
- Use testify/assert for readable assertions
- Test edge cases and error conditions
- Use dependency injection for testable code
- Create test helpers for common setup

```go
func TestCalculateTotal(t *testing.T) {
    tests := []struct {
        name     string
        items    []Item
        expected float64
        wantErr  bool
    }{
        {
            name:     "empty items",
            items:    []Item{},
            expected: 0,
            wantErr:  false,
        },
        {
            name:     "single item",
            items:    []Item{{Price: 10.50}},
            expected: 10.50,
            wantErr:  false,
        },
        // More test cases...
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            result, err := CalculateTotal(tt.items)
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
                assert.Equal(t, tt.expected, result)
            }
        })
    }
}
```

## Project Structure
```
project/
├── cmd/                    # Application entrypoints
│   └── myapp/
│       └── main.go
├── internal/               # Private application code
│   ├── auth/
│   ├── user/
│   └── config/
├── pkg/                    # Public library code
│   └── utils/
├── api/                    # API definitions
│   ├── openapi/
│   └── proto/
├── web/                    # Web assets
├── configs/                # Configuration files
├── scripts/                # Build scripts
├── test/                   # Test data and helpers
├── docs/                   # Documentation
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

## Performance
- Use profiling tools (go tool pprof) to identify bottlenecks
- Prefer sync.Pool for expensive object allocation
- Use buffered channels appropriately
- Consider using sync.Map for concurrent map access
- Implement benchmarks for performance-critical code

```go
func BenchmarkExpensiveOperation(b *testing.B) {
    for i := 0; i < b.N; i++ {
        result := ExpensiveOperation()
        _ = result // Prevent compiler optimization
    }
}
```

## Security
- Validate all inputs from external sources
- Use crypto/rand for cryptographic randomness
- Implement proper authentication and authorization
- Use HTTPS everywhere
- Sanitize data for SQL injection prevention
- Use secure headers in HTTP responses

## Documentation
- Write clear, concise comments for exported functions
- Use examples in documentation comments
- Keep README files up to date
- Document complex algorithms and business logic
- Use godoc for generating documentation

```go
// CalculateTotal computes the total price of all items including tax.
// It returns an error if any item has a negative price.
//
// Example:
//   items := []Item{{Price: 10.00}, {Price: 15.50}}
//   total, err := CalculateTotal(items)
//   if err != nil {
//       log.Fatal(err)
//   }
//   fmt.Printf("Total: $%.2f\n", total)
func CalculateTotal(items []Item) (float64, error) {
    // Implementation...
}
```

## Build and Deployment
- Use Makefiles for common build tasks
- Implement proper CI/CD pipelines
- Use multi-stage Docker builds for smaller images
- Set build-time variables with ldflags
- Use semantic versioning for releases
- Implement health checks for services

```makefile
# Example Makefile
.PHONY: build test lint clean

build:
	go build -ldflags="-X main.version=$(VERSION)" -o bin/myapp cmd/myapp/main.go

test:
	go test -v -race -coverprofile=coverage.out ./...

lint:
	golangci-lint run

clean:
	rm -rf bin/
```