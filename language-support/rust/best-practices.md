# Rust Best Practices

## Ownership and Borrowing
- Understand ownership rules: each value has a single owner
- Use borrowing (`&` and `&mut`) to avoid unnecessary moves
- Prefer borrowing over cloning when possible
- Use `Clone` explicitly when you need owned data

```rust
// Good - borrowing
fn process_data(data: &Vec<String>) -> usize {
    data.len()
}

// Good - mutable borrowing
fn modify_data(data: &mut Vec<String>) {
    data.push("new item".to_string());
}

// Use when you need owned data
fn take_ownership(data: Vec<String>) -> Vec<String> {
    // Process and return modified data
    data
}
```

## Error Handling
- Use `Result<T, E>` for recoverable errors
- Use `Option<T>` for nullable values
- Prefer `?` operator for error propagation
- Create custom error types for better error messages

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Parse error: {message}")]
    Parse { message: String },
    #[error("Validation failed")]
    Validation,
}

fn read_and_parse_file(path: &str) -> Result<Config, MyError> {
    let content = std::fs::read_to_string(path)?;
    let config = parse_config(&content)?;
    validate_config(&config)?;
    Ok(config)
}
```

## Pattern Matching
- Use `match` for exhaustive pattern matching
- Use `if let` for single pattern matching
- Use `while let` for iterative pattern matching
- Leverage destructuring in patterns

```rust
// Exhaustive matching
match result {
    Ok(value) => println!("Success: {}", value),
    Err(MyError::Io(e)) => eprintln!("IO error: {}", e),
    Err(MyError::Parse { message }) => eprintln!("Parse error: {}", message),
    Err(MyError::Validation) => eprintln!("Validation failed"),
}

// Single pattern
if let Ok(value) = result {
    println!("Got value: {}", value);
}

// Destructuring
let Person { name, age, .. } = person;
```

## Traits and Generics
- Use traits to define shared behavior
- Implement standard traits (`Debug`, `Clone`, `PartialEq`) when appropriate
- Use trait bounds to constrain generic types
- Prefer trait objects for dynamic dispatch when needed

```rust
// Define traits for shared behavior
trait Drawable {
    fn draw(&self);
}

// Generic function with trait bounds
fn render_all<T: Drawable>(items: &[T]) {
    for item in items {
        item.draw();
    }
}

// Trait objects for dynamic dispatch
fn process_drawables(items: &[Box<dyn Drawable>]) {
    for item in items {
        item.draw();
    }
}
```

## Async Programming
- Use `async`/`await` for asynchronous operations
- Choose appropriate async runtime (Tokio, async-std)
- Handle async errors properly
- Use `tokio::select!` for concurrent operations

```rust
use tokio::time::{sleep, Duration};

async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let text = response.text().await?;
    Ok(text)
}

async fn process_with_timeout() -> Result<String, Box<dyn std::error::Error>> {
    tokio::select! {
        result = fetch_data("https://api.example.com") => {
            result.map_err(Into::into)
        }
        _ = sleep(Duration::from_secs(5)) => {
            Err("Timeout".into())
        }
    }
}
```

## Testing
- Write unit tests with `#[cfg(test)]`
- Use integration tests in `tests/` directory
- Implement property-based testing with `proptest`
- Use `criterion` for benchmarking

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use proptest::prelude::*;

    #[test]
    fn test_basic_functionality() {
        let result = my_function(42);
        assert_eq!(result, expected_value);
    }

    // Property-based testing
    proptest! {
        #[test]
        fn test_property(x in 0..1000) {
            let result = my_function(x);
            prop_assert!(result >= 0);
        }
    }
}

// Integration test (in tests/ directory)
#[test]
fn integration_test() {
    let mut app = create_app();
    let response = app.call(request).unwrap();
    assert_eq!(response.status(), 200);
}
```

## Project Structure
```
my_project/
├── Cargo.toml              # Package manifest
├── Cargo.lock              # Lock file
├── src/
│   ├── lib.rs              # Library root
│   ├── main.rs             # Binary root
│   ├── bin/                # Additional binaries
│   └── modules/            # Additional modules
├── tests/                  # Integration tests
├── examples/               # Example code
├── benches/                # Benchmark tests
├── docs/                   # Documentation
└── README.md
```

## Performance Optimization
- Use `cargo bench` for performance testing
- Profile with `perf` or `cargo flamegraph`
- Avoid unnecessary allocations
- Use `Cow<str>` for borrowed or owned strings
- Consider `SmallVec` for small collections

```rust
use std::borrow::Cow;

// Efficient string handling
fn process_text(input: &str) -> Cow<str> {
    if input.contains("special") {
        Cow::Owned(input.replace("special", "normal"))
    } else {
        Cow::Borrowed(input)
    }
}

// Use iterators for efficient processing
fn sum_even_squares(numbers: &[i32]) -> i32 {
    numbers
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .sum()
}
```

## Safety and Security
- Avoid `unsafe` code unless absolutely necessary
- Use `cargo audit` to check for security vulnerabilities
- Validate input data thoroughly
- Use type-safe abstractions
- Handle sensitive data appropriately

```rust
// Type-safe wrappers
#[derive(Debug)]
pub struct UserId(u64);

impl UserId {
    pub fn new(id: u64) -> Option<Self> {
        if id > 0 {
            Some(UserId(id))
        } else {
            None
        }
    }
    
    pub fn get(&self) -> u64 {
        self.0
    }
}
```

## Code Organization
- Use modules to organize code logically
- Implement traits in the same module as types when possible
- Use `pub(crate)` for crate-internal APIs
- Group related functionality together

```rust
// Module structure
mod database {
    pub struct Connection;
    
    impl Connection {
        pub fn new() -> Self {
            Connection
        }
    }
}

mod user {
    use crate::database::Connection;
    
    pub struct User {
        pub id: u64,
        pub name: String,
    }
    
    impl User {
        pub fn find(conn: &Connection, id: u64) -> Option<Self> {
            // Implementation
            None
        }
    }
}
```

## Documentation
- Use `///` for documentation comments
- Include examples in documentation
- Use `cargo doc` to generate documentation
- Document public APIs thoroughly

```rust
/// Calculates the factorial of a number.
/// 
/// # Arguments
/// 
/// * `n` - The number to calculate the factorial for
/// 
/// # Returns
/// 
/// The factorial of `n`, or `None` if `n` is negative
/// 
/// # Examples
/// 
/// ```
/// use my_crate::factorial;
/// 
/// assert_eq!(factorial(5), Some(120));
/// assert_eq!(factorial(-1), None);
/// ```
pub fn factorial(n: i32) -> Option<u64> {
    if n < 0 {
        None
    } else {
        Some((1..=n as u64).product())
    }
}
```

## Cargo Configuration
```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <email@example.com>"]
description = "A brief description"
license = "MIT OR Apache-2.0"
repository = "https://github.com/user/repo"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", features = ["full"] }

[dev-dependencies]
criterion = "0.5"
proptest = "1.0"

[[bench]]
name = "my_benchmark"
harness = false

[profile.release]
lto = true
codegen-units = 1
panic = "abort"
```

## Linting and Formatting
- Always run `cargo fmt` before committing
- Use `cargo clippy` for additional linting
- Configure clippy with `clippy.toml`
- Use `rustfmt.toml` for formatting configuration

```toml
# clippy.toml
cognitive-complexity-threshold = 30
too-many-arguments-threshold = 8

# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
```