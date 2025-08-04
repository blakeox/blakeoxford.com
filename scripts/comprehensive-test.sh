#!/bin/bash

# Comprehensive Test Suite for Blake Oxford Portfolio
# Tests both unit and E2E tests locally to verify the complete CI/CD pipeline

set -e  # Exit on error

echo "🎯 Blake Oxford Portfolio - Comprehensive Test Suite"
echo "==================================================="

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"  
    exit 1
fi

echo "✅ Dependencies check passed"

# Run unit tests
echo ""
echo "🧪 Running Unit Tests..."
echo "-------------------------"
start_time=$(date +%s)

pnpm run test:ci

unit_end_time=$(date +%s)
unit_duration=$((unit_end_time - start_time))
echo "✅ Unit tests completed in ${unit_duration}s"

# Build the project
echo ""
echo "🔨 Building the project..."
echo "---------------------------"
build_start_time=$(date +%s)

pnpm run build

build_end_time=$(date +%s)
build_duration=$((build_end_time - build_start_time))
echo "✅ Build completed in ${build_duration}s"

# Check if build succeeded
if [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed - no index.html found"
    exit 1
fi

echo "✅ Build verification passed"

# Start preview server for E2E tests
echo ""
echo "🚀 Starting preview server for E2E tests..."
echo "---------------------------------------------"

# Start server in background
pnpm run preview &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to start..."
sleep 2  # Give server time to initialize
for i in {1..30}; do
    if curl -f -s -o /dev/null http://localhost:4321 >/dev/null 2>&1; then
        echo "✅ Server is ready after ${i} attempts"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Server failed to start or is not responding"
        echo "Server logs:"
        jobs
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
    echo "Waiting... ($i/30)"
    sleep 1
done

# Run essential E2E tests
echo ""
echo "🎭 Running Essential E2E Tests..."
echo "---------------------------------"
e2e_start_time=$(date +%s)

# Run the most critical tests first
echo "Running navigation tests..."
pnpm exec playwright test tests/playwright/navigation-essential.spec.ts --project=chromium --reporter=line

echo ""
echo "Running accessibility tests..."
pnpm exec playwright test tests/playwright/accessibility-basic.spec.ts --project=chromium --reporter=line

e2e_end_time=$(date +%s)
e2e_duration=$((e2e_end_time - e2e_start_time))
echo "✅ E2E tests completed in ${e2e_duration}s"

# Cleanup
echo ""
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
echo "✅ Server stopped"

# Summary
total_end_time=$(date +%s)
total_duration=$((total_end_time - start_time))

echo ""
echo "🎉 Comprehensive Test Suite Complete!"
echo "====================================="
echo "📊 Summary:"
echo "  • Unit Tests: ${unit_duration}s (185 tests)"
echo "  • Build: ${build_duration}s"
echo "  • E2E Tests: ${e2e_duration}s (16 essential tests)"
echo "  • Total Time: ${total_duration}s"
echo ""
echo "✅ All tests passed! Your CI/CD pipeline is ready."
echo "🚀 Ready for deployment!"
