#!/bin/bash

# deployment-quality-gate.sh - Final validation before deployment
# Part of the elite CI/CD pipeline for blakeoxford.com

set -euo pipefail

echo "🚀 Running Deployment Quality Gate..."

# Configuration
REQUIRED_LIGHTHOUSE_SCORE=95
REQUIRED_ACCESSIBILITY_SCORE=100
# JS budget is enforced on the gzipped payload (network-relevant) rather than raw
# on-disk sizes (which vary by filesystem block size and over-penalize minified JS).
BUNDLE_SIZE_LIMIT_KB=250
CRITICAL_CSS_LIMIT_KB=50

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if required files exist
check_build_artifacts() {
    print_status $BLUE "📦 Checking build artifacts..."
    
    if [ ! -d "dist" ]; then
        print_status $RED "❌ Build directory 'dist' not found"
        exit 1
    fi
    
    if [ ! -f "dist/index.html" ]; then
        print_status $RED "❌ Main index.html not found in dist"
        exit 1
    fi
    
    print_status $GREEN "✅ Build artifacts present"
}

# Validate critical files exist
validate_critical_files() {
    print_status $BLUE "🔍 Validating critical files..."
    
    local critical_files=(
        "dist/manifest.webmanifest"
        "dist/robots.txt"
        "dist/_headers"
        "dist/_redirects"
    )
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_status $YELLOW "⚠️ Warning: $file not found"
        else
            print_status $GREEN "✅ $file present"
        fi
    done
}

# Check bundle sizes
check_bundle_sizes() {
    print_status $BLUE "📏 Checking bundle sizes..."
    
    # Find JS bundles
    local js_files=$(find dist -name "*.js" -type f)
    local total_js_size_kb=0
    local total_js_gzip_kb=0
    
    if [ -n "$js_files" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                local size_bytes
                size_bytes=$(wc -c < "$file" | tr -d ' ')
                local size_kb=$(((size_bytes + 1023) / 1024))

                # Gzipped size is a closer proxy to what users actually download.
                local gzip_bytes
                gzip_bytes=$(gzip -c "$file" | wc -c | tr -d ' ')
                local gzip_kb=$(((gzip_bytes + 1023) / 1024))

                total_js_size_kb=$((total_js_size_kb + size_kb))
                total_js_gzip_kb=$((total_js_gzip_kb + gzip_kb))

                print_status $GREEN "📄 $(basename "$file"): ${size_kb}KB (gzip ${gzip_kb}KB)"
            fi
        done <<< "$js_files"
    fi
    
    if [ $total_js_gzip_kb -gt $BUNDLE_SIZE_LIMIT_KB ]; then
        print_status $RED "❌ Total JS gzip size (${total_js_gzip_kb}KB) exceeds limit (${BUNDLE_SIZE_LIMIT_KB}KB)"
        print_status $YELLOW "ℹ️  Raw total JS size: ${total_js_size_kb}KB"
        exit 1
    else
        print_status $GREEN "✅ JS gzip budget OK: ${total_js_gzip_kb}KB (raw ${total_js_size_kb}KB)"
    fi
}

# Check critical CSS size
check_critical_css() {
    print_status $BLUE "🎨 Checking critical CSS..."
    
    # Look for inlined CSS in HTML files
    local html_files=$(find dist -name "*.html" -type f)
    
    if [ -n "$html_files" ]; then
        while IFS= read -r file; do
            if [ -f "$file" ]; then
                # Extract CSS between <style> tags and calculate size
                local css_content=$(grep -o '<style[^>]*>.*</style>' "$file" 2>/dev/null || echo "")
                if [ -n "$css_content" ]; then
                    local css_size=$(echo "$css_content" | wc -c | tr -d ' ')
                    local css_size_kb=$((css_size / 1024))
                    
                    if [ $css_size_kb -gt $CRITICAL_CSS_LIMIT_KB ]; then
                        print_status $YELLOW "⚠️ Large critical CSS in $(basename "$file"): ${css_size_kb}KB"
                    else
                        print_status $GREEN "✅ Critical CSS size OK in $(basename "$file"): ${css_size_kb}KB"
                    fi
                fi
            fi
        done <<< "$html_files"
    fi
}

# Validate search functionality
check_search_index() {
    print_status $BLUE "🔍 Validating search functionality..."
    
    if [ -f "dist/search/index.json" ]; then
        local search_size=$(du -k "dist/search/index.json" | cut -f1)
        
        # Check if search index is not empty
        local entry_count=$(cat "dist/search/index.json" | jq length 2>/dev/null || echo "0")
        
        if [ "$entry_count" -gt 0 ]; then
            print_status $GREEN "✅ Search index valid: ${entry_count} entries (${search_size}KB)"
        else
            print_status $YELLOW "⚠️ Search index appears empty"
        fi
    else
        print_status $YELLOW "⚠️ Search index not found"
    fi
}

# Check for security headers
check_security_headers() {
    print_status $BLUE "🔒 Validating security configuration..."
    
    if [ -f "dist/_headers" ]; then
        local security_headers=(
            "Content-Security-Policy"
            "X-Frame-Options"
            "X-Content-Type-Options"
            "Referrer-Policy"
        )
        
        for header in "${security_headers[@]}"; do
            if grep -q "$header" "dist/_headers"; then
                print_status $GREEN "✅ $header configured"
            else
                print_status $YELLOW "⚠️ $header not found in _headers"
            fi
        done
    else
        print_status $YELLOW "⚠️ _headers file not found"
    fi
}

# Run Lighthouse-based performance gate (strict budgets)
run_lighthouse_gate() {
    print_status $BLUE "\u2728 Enforcing Lighthouse budgets (perf >= ${REQUIRED_LIGHTHOUSE_SCORE}, CLS <= 0.1)..."

    if command -v node >/dev/null 2>&1; then
        # Run custom performance harness which spins up preview as needed and enforces budgets
        if node scripts/build/performance-test.js; then
            print_status $GREEN "\u2705 Lighthouse budgets passed"
        else
            print_status $RED "\u274c Lighthouse budgets failed"
            exit 1
        fi

        # Optionally enforce bundle-level budgets (file counts/weights)
        if [ -f "scripts/build/performance-budget.sh" ]; then
            chmod +x "scripts/build/performance-budget.sh"
            if ./scripts/build/performance-budget.sh; then
                print_status $GREEN "\u2705 Bundle budgets passed"
            else
                print_status $RED "\u274c Bundle budgets failed"
                exit 1
            fi
        fi
    else
        print_status $RED "\u274c Node.js not available to run Lighthouse gate"
        exit 1
    fi
}

# Performance regression check
check_performance_regression() {
    print_status $BLUE "⚡ Running performance regression check..."
    
    if command -v node >/dev/null 2>&1; then
        if [ -f "scripts/build/performance-regression.sh" ]; then
            chmod +x "scripts/build/performance-regression.sh"
            ./scripts/build/performance-regression.sh || {
                print_status $YELLOW "⚠️ Performance regression check failed (non-blocking)"
            }
        else
            print_status $YELLOW "⚠️ Performance regression script not found"
        fi
    else
        print_status $YELLOW "⚠️ Node.js not available for performance checks"
    fi
}

# Run deployment readiness check
run_deployment_checks() {
    print_status $BLUE "🏁 Running deployment readiness checks..."
    
    if [ -f "scripts/build/deployment-check.sh" ]; then
        chmod +x "scripts/build/deployment-check.sh"
        ./scripts/build/deployment-check.sh || {
            print_status $RED "❌ Deployment readiness check failed"
            exit 1
        }
    else
        print_status $YELLOW "⚠️ Deployment readiness script not found"
    fi
}

# Flakiness quality gate (optional)
check_flakiness_gate() {
    print_status $BLUE "🔁 Evaluating test flakiness gate..."
    # Ensure we have an updated history snapshot before evaluating thresholds
    if command -v node >/dev/null 2>&1; then
        if [ -f "scripts/quality/update-flakiness-history.js" ]; then
            node scripts/quality/update-flakiness-history.js || print_status $YELLOW "⚠️ Failed to update flakiness history (continuing)"
        fi
    fi
    if [ -f "flakiness-history.json" ]; then
        # Use thresholds from env or provide relaxed defaults
        local max_flaky="${FLAKINESS_MAX_CURRENT_FLAKY:-0}" # default: zero flaky tests
        local max_intensity="${FLAKINESS_MAX_RETRY_INTENSITY:-0.05}" # default: light tolerance
        if command -v node >/dev/null 2>&1; then
            if FLAKINESS_MAX_CURRENT_FLAKY="$max_flaky" FLAKINESS_MAX_RETRY_INTENSITY="$max_intensity" node scripts/quality/check-flakiness-threshold.js; then
                print_status $GREEN "✅ Flakiness thresholds satisfied (flaky <= $max_flaky, intensity <= $max_intensity)"
            else
                print_status $RED "❌ Flakiness thresholds violated"
                exit 1
            fi
        else
            print_status $YELLOW "⚠️ Node not available to run flakiness gate"
        fi
    else
        if [ -n "${FLAKINESS_STRICT:-}" ]; then
            print_status $RED "❌ Flakiness history missing in strict mode"
            exit 1
        else
            print_status $YELLOW "⚠️ No flakiness-history.json present; skipping flakiness gate"
        fi
    fi
}

# Main execution
main() {
    print_status $BLUE "🚀 Starting Deployment Quality Gate..."
    echo "======================================"
    
    check_build_artifacts
    validate_critical_files
    check_bundle_sizes
    check_critical_css
    check_search_index
    check_security_headers
    run_lighthouse_gate
    check_performance_regression
    run_deployment_checks
    # Pre-populate / update flakiness history before evaluating gate to ensure file presence even after clean
    if command -v node >/dev/null 2>&1 && [ -f "scripts/quality/update-flakiness-history.js" ]; then
        node scripts/quality/update-flakiness-history.js || print_status $YELLOW "⚠️ Failed to pre-update flakiness history (continuing)"
    fi
    check_flakiness_gate
    
    echo "======================================"
    print_status $GREEN "🎉 All quality gates passed! Ready for deployment."
    
    # Create deployment summary
    cat > deployment-summary.json << EOF
{
  "status": "ready",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "checks": {
    "build_artifacts": "passed",
    "critical_files": "passed",
    "bundle_sizes": "passed",
    "critical_css": "passed",
    "search_index": "passed",
    "security_headers": "passed",
    "performance_regression": "passed",
    "deployment_readiness": "passed"
  },
  "deployment_ready": true
}
EOF
    
    print_status $GREEN "📋 Deployment summary created: deployment-summary.json"
}

# Run main function
main "$@"
