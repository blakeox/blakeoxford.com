#!/bin/bash

# Test runner script for local development
# Usage: ./test-runner.sh [fast|full|essential]

set -e

echo "🧪 Blake Oxford Portfolio Test Runner"
echo "======================================"

# Default to fast if no argument provided
MODE=${1:-fast}

case $MODE in
  "fast")
    echo "🚀 Running Fast CI tests (linting + unit + essential E2E)..."
    echo ""
    
    echo "📝 Running linter..."
    pnpm run lint
    echo "✅ Linting passed"
    echo ""
    
    echo "🏗️  Building application..."
    pnpm run build
    echo "✅ Build succeeded"
    echo ""
    
    echo "🧪 Running unit tests..."
    pnpm test
    echo "✅ Unit tests passed"
    echo ""
    
    echo "🎭 Running essential E2E tests..."
    pnpm run test:e2e:essential
    echo "✅ Essential E2E tests passed"
    echo ""
    
    echo "🎉 Fast CI tests completed successfully!"
    ;;
    
  "full")
    echo "🔍 Running Comprehensive CI tests (full suite)..."
    echo ""
    
    echo "📝 Running linter..."
    pnpm run lint
    echo "✅ Linting passed"
    echo ""
    
    echo "🏗️  Building application..."
    pnpm run build
    echo "✅ Build succeeded"
    echo ""
    
    echo "🧪 Running unit tests with coverage..."
    pnpm run test:coverage
    echo "✅ Unit tests with coverage passed"
    echo ""
    
    echo "🎭 Running full E2E test suite..."
    pnpm run test:e2e
    echo "✅ Full E2E tests passed"
    echo ""
    
    echo "🎉 Comprehensive CI tests completed successfully!"
    ;;
    
  "essential")
    echo "⚡ Running essential tests only..."
    echo ""
    
    echo "🎭 Running essential E2E tests..."
    pnpm run test:e2e:essential
    echo "✅ Essential E2E tests passed"
    echo ""
    
    echo "🎉 Essential tests completed successfully!"
    ;;
    
  *)
    echo "❌ Unknown mode: $MODE"
    echo ""
    echo "Usage: ./test-runner.sh [fast|full|essential]"
    echo ""
    echo "  fast      - Fast CI tests (linting + unit + essential E2E) ~5-10 minutes"
    echo "  full      - Comprehensive tests (full suite) ~20-30 minutes"
    echo "  essential - Essential E2E tests only ~3-5 minutes"
    echo ""
    exit 1
    ;;
esac