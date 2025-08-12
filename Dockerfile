# Minimal dev environment image for MASTER-WORKFLOW
FROM node:20-bookworm

ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    jq \
    python3 \
    python3-pip \
    python3-venv \
    tzdata \
    locales \
  && rm -rf /var/lib/apt/lists/* \
  && locale-gen en_US.UTF-8

ENV LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8

# Enable Corepack (pnpm/yarn) for Node 20+
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate || true

WORKDIR /workspace
RUN git config --global --add safe.directory /workspace
EXPOSE 13800 8787

# Keep container running for interactive/dev use
CMD ["bash", "-lc", "tail -f /dev/null"]
