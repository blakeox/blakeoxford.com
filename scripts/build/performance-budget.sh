#!/bin/bash

# Performance Budget Validation Script
# Enforces the performance-first principles outlined in copilot-instructions.md

echo "🎯 Running Performance Budget Validation..."

BUILD_DIR="dist"
FAILED=false

# 1. Check JavaScript Bundle Size (minimal JS principle)
echo "📦 Checking JavaScript bundle size..."
JS_SIZE=$(find $BUILD_DIR -name "*.js" -type f -exec du -c {} + | grep total | awk '{print $1}')
JS_FILE_COUNT=$(find $BUILD_DIR -name "*.js" -type f | wc -l)

if [ "$JS_SIZE" -gt 500 ]; then  # 500KB limit (more realistic for modern sites)
    echo "❌ JavaScript bundle too large: ${JS_SIZE}KB (limit: 500KB)"
    FAILED=true
else
    echo "✅ JavaScript bundle size: ${JS_SIZE}KB"
fi

if [ "$JS_FILE_COUNT" -gt 15 ]; then  # 15 files limit (more realistic)
    echo "❌ Too many JavaScript files: $JS_FILE_COUNT (limit: 15)"
    FAILED=true
else
    echo "✅ JavaScript file count: $JS_FILE_COUNT"
fi

# 2. Check CSS Bundle Size
echo "🎨 Checking CSS bundle size..."
CSS_SIZE=$(find $BUILD_DIR -name "*.css" -type f -exec du -c {} + | grep total | awk '{print $1}' || echo "0")
if [ "$CSS_SIZE" -gt 300 ]; then  # 300KB limit for CSS (realistic with Tailwind + custom styles)
    echo "❌ CSS bundle too large: ${CSS_SIZE}KB (limit: 300KB)"
    FAILED=true
else
    echo "✅ CSS bundle size: ${CSS_SIZE}KB"
fi

# 3. Check HTML Files for Critical CSS
echo "🔍 Checking for critical CSS implementation..."
CRITICAL_CSS_COUNT=$(grep -r "<style>" $BUILD_DIR --include="*.html" | wc -l || echo "0")
if [ "$CRITICAL_CSS_COUNT" -eq 0 ]; then
    echo "⚠️ Warning: No critical CSS detected in HTML files"
else
    echo "✅ Critical CSS found in $CRITICAL_CSS_COUNT files"
fi

# 4. Check for Proper Image Optimization
echo "🖼️ Checking image optimization..."
UNOPTIMIZED_IMAGES=$(find $BUILD_DIR -name "*.jpg" -o -name "*.png" | head -5)
if [ -n "$UNOPTIMIZED_IMAGES" ]; then
    echo "⚠️ Warning: Found potentially unoptimized images:"
    echo "$UNOPTIMIZED_IMAGES"
    echo "Consider using WebP/AVIF formats"
fi

# 5. Check Total Bundle Size
echo "📊 Checking total bundle size..."
TOTAL_SIZE=$(du -s $BUILD_DIR | awk '{print $1}')
if [ "$TOTAL_SIZE" -gt 20000 ]; then  # 20MB limit (realistic for modern sites with images)
    echo "❌ Total bundle too large: ${TOTAL_SIZE}KB (limit: 20MB)"
    FAILED=true
else
    echo "✅ Total bundle size: ${TOTAL_SIZE}KB"
fi

# Summary
echo ""
echo "📋 Performance Budget Summary:"
echo "  JavaScript: ${JS_SIZE}KB (${JS_FILE_COUNT} files)"
echo "  CSS: ${CSS_SIZE}KB"
echo "  Total: ${TOTAL_SIZE}KB"
echo "  Critical CSS: $CRITICAL_CSS_COUNT files"

if [ "$FAILED" = true ]; then
    echo ""
    echo "❌ Performance budget validation FAILED"
    echo "Please optimize your bundle sizes before merging"
    exit 1
else
    echo ""
    echo "✅ Performance budget validation PASSED"
    echo "Bundle sizes meet performance-first requirements"
fi
