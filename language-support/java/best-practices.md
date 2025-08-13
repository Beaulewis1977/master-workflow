# Java Best Practices

## Code Style and Conventions
- Follow Oracle's Java Code Conventions and Google Java Style Guide
- Use meaningful class, method, and variable names
- Follow camelCase for variables and methods, PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Keep methods small and focused (ideally under 20 lines)

```java
// Good naming conventions
public class UserService {
    private static final int MAX_RETRY_ATTEMPTS = 3;
    private final UserRepository userRepository;
    
    public Optional<User> findUserById(Long userId) {
        return userRepository.findById(userId);
    }
}

// Good method structure
public boolean isValidEmail(String email) {
    if (email == null || email.trim().isEmpty()) {
        return false;
    }
    return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
}
```

## Object-Oriented Design
- Use appropriate access modifiers (private, protected, public)
- Implement proper encapsulation with getters and setters
- Favor composition over inheritance
- Follow SOLID principles

```java
// Good encapsulation
public class BankAccount {
    private BigDecimal balance;
    private final String accountNumber;
    
    public BankAccount(String accountNumber, BigDecimal initialBalance) {
        this.accountNumber = Objects.requireNonNull(accountNumber);
        this.balance = Objects.requireNonNull(initialBalance);
        if (initialBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Initial balance cannot be negative");
        }
    }
    
    public BigDecimal getBalance() {
        return balance;
    }
    
    public void deposit(BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Deposit amount must be positive");
        }
        this.balance = this.balance.add(amount);
    }
}

// Composition over inheritance
public class Car {
    private final Engine engine;
    private final Transmission transmission;
    
    public Car(Engine engine, Transmission transmission) {
        this.engine = Objects.requireNonNull(engine);
        this.transmission = Objects.requireNonNull(transmission);
    }
    
    public void start() {
        engine.start();
    }
}
```

## Exception Handling
- Use specific exception types rather than generic Exception
- Create custom exceptions for domain-specific errors
- Use try-with-resources for automatic resource management
- Don't catch exceptions you can't handle

```java
// Custom exception
public class InsufficientFundsException extends Exception {
    private final BigDecimal availableBalance;
    private final BigDecimal requestedAmount;
    
    public InsufficientFundsException(BigDecimal availableBalance, BigDecimal requestedAmount) {
        super(String.format("Insufficient funds. Available: %s, Requested: %s", 
              availableBalance, requestedAmount));
        this.availableBalance = availableBalance;
        this.requestedAmount = requestedAmount;
    }
    
    public BigDecimal getAvailableBalance() { return availableBalance; }
    public BigDecimal getRequestedAmount() { return requestedAmount; }
}

// Try-with-resources
public List<String> readLines(String filename) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(Paths.get(filename))) {
        return reader.lines()
                    .collect(Collectors.toList());
    }
}

// Proper exception handling
public void withdraw(BigDecimal amount) throws InsufficientFundsException {
    if (amount.compareTo(BigDecimal.ZERO) <= 0) {
        throw new IllegalArgumentException("Withdrawal amount must be positive");
    }
    
    if (balance.compareTo(amount) < 0) {
        throw new InsufficientFundsException(balance, amount);
    }
    
    balance = balance.subtract(amount);
}
```

## Collections and Generics
- Use appropriate collection types for your use case
- Prefer interfaces over concrete classes in declarations
- Use generics for type safety
- Use Streams API for functional programming

```java
// Good collection usage
public class UserService {
    private final Map<Long, User> userCache = new ConcurrentHashMap<>();
    private final List<UserValidator> validators = new ArrayList<>();
    
    // Generic method
    public <T> Optional<T> findFirst(List<T> items, Predicate<T> condition) {
        return items.stream()
                   .filter(condition)
                   .findFirst();
    }
    
    // Stream API usage
    public List<User> getActiveUsers(List<User> users) {
        return users.stream()
                   .filter(User::isActive)
                   .filter(user -> user.getLastLoginDate().isAfter(LocalDate.now().minusDays(30)))
                   .sorted(Comparator.comparing(User::getLastName))
                   .collect(Collectors.toList());
    }
}
```

## Concurrency and Threading
- Use java.util.concurrent classes instead of raw threads
- Prefer CompletableFuture for asynchronous programming
- Use thread-safe collections when needed
- Always synchronize access to shared mutable state

```java
// Using ExecutorService
public class AsyncTaskProcessor {
    private final ExecutorService executor = Executors.newFixedThreadPool(10);
    
    public CompletableFuture<String> processAsync(String input) {
        return CompletableFuture.supplyAsync(() -> {
            // Expensive operation
            return processExpensiveOperation(input);
        }, executor);
    }
    
    public CompletableFuture<List<String>> processMultiple(List<String> inputs) {
        List<CompletableFuture<String>> futures = inputs.stream()
            .map(this::processAsync)
            .collect(Collectors.toList());
            
        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList()));
    }
    
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}

// Thread-safe singleton
public class ConfigurationManager {
    private static volatile ConfigurationManager instance;
    private final Map<String, String> config = new ConcurrentHashMap<>();
    
    private ConfigurationManager() {
        loadConfiguration();
    }
    
    public static ConfigurationManager getInstance() {
        if (instance == null) {
            synchronized (ConfigurationManager.class) {
                if (instance == null) {
                    instance = new ConfigurationManager();
                }
            }
        }
        return instance;
    }
}
```

## Testing Best Practices
- Write unit tests for all public methods
- Use meaningful test names that describe the scenario
- Follow AAA pattern (Arrange, Act, Assert)
- Use mocking frameworks for dependencies

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private EmailService emailService;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void shouldCreateUserSuccessfully_WhenValidDataProvided() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest("john@example.com", "John Doe");
        User expectedUser = new User(1L, "john@example.com", "John Doe");
        
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(expectedUser);
        
        // Act
        User result = userService.createUser(request);
        
        // Assert
        assertThat(result.getEmail()).isEqualTo("john@example.com");
        assertThat(result.getName()).isEqualTo("John Doe");
        verify(emailService).sendWelcomeEmail(expectedUser);
    }
    
    @Test
    void shouldThrowException_WhenEmailAlreadyExists() {
        // Arrange
        CreateUserRequest request = new CreateUserRequest("existing@example.com", "John Doe");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        
        // Act & Assert
        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(EmailAlreadyExistsException.class)
            .hasMessage("Email already exists: existing@example.com");
    }
    
    @ParameterizedTest
    @ValueSource(strings = {"", " ", "invalid-email", "@example.com"})
    void shouldThrowException_WhenInvalidEmailProvided(String email) {
        // Arrange
        CreateUserRequest request = new CreateUserRequest(email, "John Doe");
        
        // Act & Assert
        assertThatThrownBy(() -> userService.createUser(request))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
```

## Spring Boot Best Practices
- Use constructor injection over field injection
- Leverage Spring Boot's auto-configuration
- Use profiles for environment-specific configuration
- Implement proper error handling with @ControllerAdvice

```java
// Constructor injection
@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final PaymentService paymentService;
    private final NotificationService notificationService;
    
    public OrderService(OrderRepository orderRepository,
                       PaymentService paymentService,
                       NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.paymentService = paymentService;
        this.notificationService = notificationService;
    }
}

// REST Controller with proper error handling
@RestController
@RequestMapping("/api/users")
@Validated
public class UserController {
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable @Min(1) Long id) {
        return userService.findById(id)
            .map(user -> ResponseEntity.ok(UserDto.fromEntity(user)))
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request) {
        User user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(UserDto.fromEntity(user));
    }
}

// Global error handler
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleEmailAlreadyExists(EmailAlreadyExistsException e) {
        ErrorResponse error = new ErrorResponse("EMAIL_ALREADY_EXISTS", e.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .collect(Collectors.joining(", "));
        
        ErrorResponse error = new ErrorResponse("VALIDATION_ERROR", message);
        return ResponseEntity.badRequest().body(error);
    }
}
```

## Performance Optimization
- Use appropriate data structures for your use case
- Implement caching where appropriate
- Use lazy loading for expensive operations
- Profile your application to identify bottlenecks

```java
// Caching with Spring Cache
@Service
public class UserService {
    
    @Cacheable(value = "users", key = "#id")
    public User findById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new UserNotFoundException(id));
    }
    
    @CacheEvict(value = "users", key = "#user.id")
    public User updateUser(User user) {
        return userRepository.save(user);
    }
}

// Lazy initialization
public class ExpensiveResource {
    private volatile ExpensiveObject expensiveObject;
    
    public ExpensiveObject getExpensiveObject() {
        if (expensiveObject == null) {
            synchronized (this) {
                if (expensiveObject == null) {
                    expensiveObject = createExpensiveObject();
                }
            }
        }
        return expensiveObject;
    }
}

// Efficient String operations
public String buildQuery(List<String> conditions) {
    if (conditions.isEmpty()) {
        return "SELECT * FROM users";
    }
    
    StringBuilder query = new StringBuilder("SELECT * FROM users WHERE ");
    for (int i = 0; i < conditions.size(); i++) {
        if (i > 0) {
            query.append(" AND ");
        }
        query.append(conditions.get(i));
    }
    return query.toString();
}
```

## Security Best Practices
- Validate all input data
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Store sensitive data securely

```java
// Input validation
@Component
public class UserValidator {
    
    public void validateCreateUserRequest(CreateUserRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("User request cannot be null");
        }
        
        validateEmail(request.getEmail());
        validateName(request.getName());
        validatePassword(request.getPassword());
    }
    
    private void validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        
        if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }
}

// Secure password handling
@Service
public class AuthenticationService {
    private final PasswordEncoder passwordEncoder;
    
    public AuthenticationService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }
    
    public User createUser(String email, String rawPassword) {
        String hashedPassword = passwordEncoder.encode(rawPassword);
        return new User(email, hashedPassword);
    }
    
    public boolean authenticate(String email, String rawPassword, String hashedPassword) {
        return passwordEncoder.matches(rawPassword, hashedPassword);
    }
}

// SQL injection prevention with JPA
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.active = true")
    Optional<User> findActiveUserByEmail(@Param("email") String email);
    
    @Query(value = "SELECT * FROM users WHERE created_date > :date", nativeQuery = true)
    List<User> findUsersCreatedAfter(@Param("date") LocalDate date);
}
```

## Build Configuration and Dependencies
```xml
<!-- Maven pom.xml best practices -->
<project>
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>my-project</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>
    
    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        
        <!-- Dependency versions -->
        <spring.boot.version>3.1.0</spring.boot.version>
        <junit.version>5.9.2</junit.version>
        <mockito.version>4.11.0</mockito.version>
    </properties>
    
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <version>0.8.8</version>
                <configuration>
                    <rules>
                        <rule>
                            <element>BUNDLE</element>
                            <limits>
                                <limit>
                                    <counter>INSTRUCTION</counter>
                                    <value>COVEREDRATIO</value>
                                    <minimum>0.80</minimum>
                                </limit>
                            </limits>
                        </rule>
                    </rules>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```