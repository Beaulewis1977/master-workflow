FROM rust:1.75-slim AS chef
RUN cargo install cargo-chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=planner /app/recipe.json recipe.json
# Build dependencies - this is the caching Docker layer!
RUN cargo chef cook --release --recipe-path recipe.json

# Build application
COPY . .
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r app && useradd -r -g app app

WORKDIR /app

# Copy the binary
COPY --from=builder /app/target/release/{{projectName}}-backend /usr/local/bin/{{projectName}}-backend

# Copy migrations
COPY --from=builder /app/migrations ./migrations

# Create uploads directory
RUN mkdir -p /app/uploads && chown app:app /app/uploads

USER app

EXPOSE 8000

CMD ["{{projectName}}-backend"]