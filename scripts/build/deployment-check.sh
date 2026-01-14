#!/bin/bash

# Deployment Readiness Check
# Validates that the build meets all production requirements

echo "🚀 Checking deployment readiness..."

BUILD_DIR="dist"
FAILED=false

# 1. Required files check
REQUIRED_FILES=("index.html" "robots.txt" "manifest.webmanifest")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$BUILD_DIR/$file" ]; then
        echo "❌ Missing required file: $file"
        FAILED=true
    else
        echo "✅ Found: $file"
    fi
done

# 2. Security headers check
echo "🔒 Checking security configurations..."
if [ -f "$BUILD_DIR/_headers" ]; then
    echo "✅ Security headers file found"
else
    echo "⚠️ Warning: dist/_headers file not found"
fi

# 3. Cloudflare configuration
if [ -f "$BUILD_DIR/_redirects" ]; then
    echo "✅ Redirects configuration found"
else
    echo "⚠️ Warning: dist/_redirects file not found"
fi

# 4. Check for common issues
echo "🔍 Checking for common deployment issues..."

# Check for development URLs
DEV_URL_PATTERN='(https?:\/\/|wss?:\/\/)(localhost|127\.0\.0\.1)(:[0-9]{1,5})?\b|\blocalhost:[0-9]{1,5}\b'
DEV_URLS=$(grep -R -nE "$DEV_URL_PATTERN" "$BUILD_DIR" --include="*.html" --include="*.js" --include="*.css" | wc -l | tr -d ' ')
if [ "$DEV_URLS" -gt 0 ]; then
    echo "❌ Found $DEV_URLS references to localhost in build"
    FAILED=true
else
    echo "✅ No localhost references found"
fi

# Check for source maps in production
SOURCE_MAPS=$(find $BUILD_DIR -name "*.map" | wc -l || echo "0")
if [ "$SOURCE_MAPS" -gt 0 ]; then
    echo "⚠️ Warning: Found $SOURCE_MAPS source map files (consider removing for production)"
else
    echo "✅ No source maps found"
fi

# 5. Fail on unexpected external CDNs (e.g., jsdelivr) that can affect Best Practices/CSP
CDN_JSDELIVR=$(grep -R "https://cdn.jsdelivr.net" "$BUILD_DIR" --include="*.html" --include="*.js" | wc -l || echo "0")
if [ "$CDN_JSDELIVR" -gt 0 ]; then
    echo "❌ Found $CDN_JSDELIVR references to jsDelivr CDN in build (should be vendored)"
    FAILED=true
else
    echo "✅ No jsDelivr references found"
fi

# Summary
if [ "$FAILED" = true ]; then
    echo ""
    echo "❌ Deployment readiness check FAILED"
    echo "Please fix the issues above before deploying"
    exit 1
else
    echo ""
    echo "✅ Deployment readiness check PASSED"
    echo "Build is ready for production deployment"
fi
