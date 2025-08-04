#!/bin/bash

# CI-Optimized Essential Test Runner
# Runs only the essential tests for fast CI feedback
# Relies on Playwright's webServer config to start the server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Running optimized essential E2E tests...${NC}"
echo -e "${YELLOW}Note: Server will be managed by Playwright webServer config${NC}"

# Check if all browsers are available, set fallback if needed
if ! command -v firefox >/dev/null 2>&1 || ! command -v webkit >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Some browsers unavailable, using Chromium-only mode${NC}"
    export BROWSER_INSTALL_FAILED=true
    
    # Run with Chromium only
    if pnpm exec playwright test --grep="@essential" --project=chromium --reporter=line; then
        echo -e "${GREEN}✅ Essential tests passed with Chromium!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Essential tests failed${NC}"
        exit 1
    fi
else
    # All browsers available, run full test
    if pnpm exec playwright test --grep="@essential" --reporter=line; then
        echo -e "${GREEN}✅ Essential tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}❌ Essential tests failed${NC}"
        exit 1
    fi
fi
