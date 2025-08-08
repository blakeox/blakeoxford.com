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

# 5. Check Total Bundle Size (separating images vs. non-images)
echo "📊 Checking total bundle size (split by type)..."

# Calculate total size of everything
TOTAL_SIZE=$(du -s $BUILD_DIR | awk '{print $1}')

# Calculate size of image assets only
IMAGES_SIZE=$(find "$BUILD_DIR" \
    -type f \
    \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.avif" -o -iname "*.gif" -o -iname "*.svg" \) \
    -exec du -c {} + 2>/dev/null | awk '/total/{print $1}' )

# Default to 0 if no images found
IMAGES_SIZE=${IMAGES_SIZE:-0}

# Non-image size = total - images (floor at 0)
NON_IMAGE_SIZE=$(( TOTAL_SIZE - IMAGES_SIZE ))
if [ "$NON_IMAGE_SIZE" -lt 0 ]; then NON_IMAGE_SIZE=0; fi

# Budgets (KB)
NON_IMAGE_LIMIT=20000   # 20MB for HTML/JS/CSS/other
IMAGES_LIMIT=40000      # 40MB for image assets (portfolio content)

echo "   • Total size:        ${TOTAL_SIZE}KB"
echo "   • Non-image assets: ${NON_IMAGE_SIZE}KB (limit: ${NON_IMAGE_LIMIT}KB)"
echo "   • Images:           ${IMAGES_SIZE}KB (limit: ${IMAGES_LIMIT}KB)"

if [ "$NON_IMAGE_SIZE" -gt "$NON_IMAGE_LIMIT" ]; then
    echo "❌ Non-image assets exceed budget: ${NON_IMAGE_SIZE}KB > ${NON_IMAGE_LIMIT}KB"
    FAILED=true
else
    echo "✅ Non-image assets within budget"
fi

if [ "$IMAGES_SIZE" -gt "$IMAGES_LIMIT" ]; then
    echo "❌ Image assets exceed budget: ${IMAGES_SIZE}KB > ${IMAGES_LIMIT}KB"
    echo "   Consider additional image optimization or pruning heavy images."
    FAILED=true
else
    echo "✅ Image assets within budget"
fi

# Summary
echo ""
echo "📋 Performance Budget Summary:"
echo "  JavaScript: ${JS_SIZE}KB (${JS_FILE_COUNT} files)"
echo "  CSS: ${CSS_SIZE}KB"
echo "  Total: ${TOTAL_SIZE}KB (non-images: ${NON_IMAGE_SIZE}KB, images: ${IMAGES_SIZE}KB)"
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
