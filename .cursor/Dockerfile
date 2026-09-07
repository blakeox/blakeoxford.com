FROM node:24-bookworm-slim

# System packages required to build native dependencies (sharp, workerd, etc.)
# and to let Cursor and git operate inside the container.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        build-essential \
        python3 \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable

USER node
