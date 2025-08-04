#!/bin/bash

# CI-Optimized Essential Test Runner
# Runs only the essential tests for fast CI feedback

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting preview server and running E2E tests...${NC}"

# Start server in background with better error handling
pnpm run preview &
SERVER_PID=$!

# Function to cleanup server on exit
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up server process...${NC}"
    if kill $SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Server stopped successfully${NC}"
    fi
    # Don't wait for the process - just exit
}
trap cleanup EXIT

# Wait for server with improved health check
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
sleep 3  # Give server time to fully initialize

# Check multiple possible ports that Astro might use
PORTS=(4321 4322 4323 4324)
SERVER_URL=""

for port in "${PORTS[@]}"; do
    if curl -f -s -m 2 http://localhost:$port >/dev/null 2>&1; then
        SERVER_URL="http://localhost:$port"
        echo -e "${GREEN}✅ Server found on port $port${NC}"
        break
    fi
done

if [ -z "$SERVER_URL" ]; then
    echo -e "${RED}❌ Server not responding on any expected port${NC}"
    exit 1
fi

# Run essential tests only
echo -e "${BLUE}🧪 Running essential E2E tests...${NC}"
if pnpm exec playwright test --grep="@essential" --reporter=line; then
    echo -e "${GREEN}✅ Essential tests passed!${NC}"
    cleanup
    exit 0
else
    echo -e "${RED}❌ Essential tests failed${NC}"
    cleanup
    exit 1
fi
