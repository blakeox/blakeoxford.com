#!/bin/bash
# Debug Playwright Test Failures
# This script helps identify why the E2E tests are failing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Debugging Playwright Test Failures${NC}"
echo -e "${BLUE}====================================${NC}"

# Step 1: Check if dependencies are installed
echo -e "${YELLOW}1. Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${RED}❌ node_modules not found. Running pnpm install...${NC}"
    pnpm install --frozen-lockfile
else
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Step 2: Check Playwright browsers
echo -e "${YELLOW}2. Checking Playwright browsers...${NC}"
if pnpm exec playwright install --dry-run 2>/dev/null; then
    echo -e "${GREEN}✅ Playwright browsers are available${NC}"
else
    echo -e "${YELLOW}⚠️ Installing Playwright browsers...${NC}"
    pnpm exec playwright install
fi

# Step 3: Build the application
echo -e "${YELLOW}3. Building application...${NC}"
if pnpm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
    
    # Check what was built
    if [ -f "dist/index.html" ]; then
        echo -e "${GREEN}✅ index.html found in dist/${NC}"
        
        # Show build contents
        echo -e "${BLUE}Build contents:${NC}"
        find dist/ -name "*.html" | head -5
    else
        echo -e "${RED}❌ No index.html found in dist/${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# Step 4: Test preview server
echo -e "${YELLOW}4. Testing preview server...${NC}"

# Start server in background
echo -e "${BLUE}Starting preview server...${NC}"
pnpm run preview &
SERVER_PID=$!

# Function to cleanup server
cleanup_server() {
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup_server EXIT

# Wait for server with more detailed feedback
echo -e "${BLUE}Waiting for server to start (timeout: 30s)...${NC}"
for i in {1..30}; do
    if curl -f -s http://localhost:4322 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server started successfully after ${i} seconds${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
        echo -e "${YELLOW}Server logs:${NC}"
        jobs
        ps aux | grep -i preview || echo "No preview process found"
        exit 1
    fi
    
    printf "."
    sleep 1
done

echo ""

# Step 5: Test server response
echo -e "${YELLOW}5. Testing server response...${NC}"
echo -e "${BLUE}HTTP response headers:${NC}"
curl -I http://localhost:4322 2>/dev/null || echo "Failed to get headers"

echo -e "${BLUE}Content preview (first 500 chars):${NC}"
curl -s http://localhost:4322 | head -c 500 || echo "Failed to get content"

# Step 6: Run a single failing test with maximum debugging
echo -e "${YELLOW}6. Running a single failing test with debug info...${NC}"

# Create a temporary test-specific Playwright config
cat > playwright.debug.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  timeout: 60 * 1000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4322',
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium-debug',
      use: { 
        ...devices['Desktop Chrome'],
        // Extra debugging options
        launchOptions: {
          slowMo: 100, // Slow down actions
          headless: false, // Show browser (if display available)
        }
      },
    },
  ],
  webServer: undefined, // We're managing the server manually
});
EOF

# Run one specific failing test
echo -e "${BLUE}Running accessibility-basic test with maximum debugging...${NC}"

# Set debugging environment variables
export DEBUG=pw:api
export PLAYWRIGHT_DEBUG=1

# Try to run the test
if pnpm exec playwright test \
  --config=playwright.debug.config.ts \
  --project=chromium-debug \
  tests/playwright/accessibility-basic.spec.ts:7 \
  --reporter=line \
  --headed=false \
  --timeout=120000; then
    echo -e "${GREEN}✅ Test passed with debugging config!${NC}"
else
    echo -e "${RED}❌ Test still failing. Checking common issues...${NC}"
    
    # Check if server is still running
    if curl -f -s http://localhost:4322 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is still responding${NC}"
    else
        echo -e "${RED}❌ Server stopped responding during test${NC}"
    fi
    
    # Check for common error patterns in test output
    echo -e "${BLUE}Checking test-results for common errors...${NC}"
    if [ -d "test-results" ]; then
        find test-results -name "*.txt" -exec grep -l "ERR_CONNECTION_REFUSED\|ECONNREFUSED\|timeout\|Navigation timeout" {} \; | head -3
    fi
fi

# Step 7: Summary and recommendations
echo -e "${YELLOW}7. Summary and Next Steps${NC}"
echo -e "${BLUE}==============================${NC}"

echo -e "${GREEN}✅ What worked:${NC}"
echo "  - Dependencies are installed"
echo "  - Application builds successfully"
echo "  - Preview server starts and responds"

echo -e "${YELLOW}⚠️ Potential issues to investigate:${NC}"
echo "  - Browser installation in act/Docker environment"
echo "  - Network connectivity between test and server"
echo "  - Timing issues with server startup"
echo "  - Missing dependencies in container environment"

echo -e "${BLUE}🎯 Recommended next steps:${NC}"
echo "  1. Run: ./scripts/local-ci.sh debug"
echo "  2. Try: ./scripts/local-ci.sh e2e"
echo "  3. Check act logs for browser installation errors"
echo "  4. Consider running tests in Chromium-only mode first"

# Cleanup
cleanup_server
rm -f playwright.debug.config.ts

echo -e "${GREEN}🎉 Debug session complete!${NC}"
