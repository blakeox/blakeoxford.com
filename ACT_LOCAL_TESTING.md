# Local GitHub Actions Testing with Act

This project is configured to run GitHub Actions locally using [act](https://github.com/nektos/act), which helps debug CI issues without pushing to GitHub.

## 🚀 Quick Start

### Prerequisites
- **act**: Install with `brew install act` (already done ✅)
- **Docker**: Must be running for act to work

### Running Tests Locally

```bash
# Quick options - use npm scripts
pnpm local:e2e      # Run just the failing E2E tests
pnpm local:debug    # Debug test environment and server setup
pnpm local:unit     # Run unit tests only
pnpm act:e2e        # Run E2E tests using act (GitHub Actions simulation)
pnpm act:debug      # Dry run with act to see what would happen

# Or use the interactive script directly
./scripts/local-ci.sh           # Interactive menu
./scripts/local-ci.sh e2e       # Run E2E tests
./scripts/local-ci.sh debug     # Debug mode with dry run
./scripts/local-ci.sh comprehensive  # Full CI pipeline
```

## 🔧 Configuration Files

- **`.actrc`**: Act configuration with Ubuntu 24.04 container and resource limits
- **`.github/workflows/act-local.yml`**: Optimized workflow for local testing
- **`scripts/local-ci.sh`**: Interactive script for running different test scenarios
- **`scripts/debug-tests.sh`**: Comprehensive debugging for test failures

## 🐛 Debugging Your Current Issues

You're seeing 44 failed tests across Firefox and WebKit. Here's how to debug:

### Step 1: Start with debugging script
```bash
./scripts/debug-tests.sh
```

This will:
- ✅ Check dependencies and build process
- ✅ Test preview server startup
- ✅ Run a single test with maximum debugging
- 🔍 Identify common failure patterns

### Step 2: Run local E2E tests
```bash
pnpm local:e2e
```

This runs the E2E tests in a controlled local environment that mimics CI.

### Step 3: Use act to simulate GitHub Actions
```bash
pnpm act:debug    # Dry run to see what would happen
pnpm act:e2e      # Actually run the workflow
```

## 🎯 Most Likely Issues and Solutions

Based on your test failures, here are the most probable causes:

### 1. **Browser Installation in Act/Docker**
The Docker container might not have all browsers properly installed.

**Solution**: The `.github/workflows/act-local.yml` workflow includes browser installation with fallbacks.

### 2. **Server Startup Timing**
The preview server might not be ready when tests start running.

**Solution**: Enhanced server startup with proper health checks in the debug workflow.

### 3. **Network Connectivity**
Tests might not be able to connect to `localhost:4322` in the container.

**Solution**: Using `--network=host` in `.actrc` to improve localhost handling.

## 📋 Common Commands

```bash
# Interactive testing menu
./scripts/local-ci.sh

# Quick debugging
pnpm local:debug

# Run just the essential failing tests
pnpm test:e2e:essential

# Clean up act artifacts
./scripts/local-ci.sh cleanup

# Test the preview server manually
pnpm build && pnpm preview  # In one terminal
curl http://localhost:4322  # In another terminal
```

## 🔍 Understanding the Failures

Your failing tests fall into these categories:

1. **Accessibility Tests** (WCAG compliance, heading hierarchy, keyboard navigation)
2. **Navigation Tests** (page loads, mobile menu functionality)  
3. **Performance Tests** (Core Web Vitals, resource loading)

All are failing across Firefox and WebKit, suggesting:
- ✅ **Not a browser-specific issue**
- ❌ **Likely a server/environment issue**
- 🎯 **Focus on getting Chromium tests passing first**

## 🎉 Next Steps

1. **Run the debug script**: `./scripts/debug-tests.sh`
2. **Try local E2E**: `pnpm local:e2e`
3. **If those work, try act**: `pnpm act:e2e`
4. **Report back what you find!**

The scripts will provide detailed output to help identify exactly where the issue is occurring.
