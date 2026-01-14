#!/bin/bash

# Performance Budget Validation Script
# Enforces the performance-first principles outlined in copilot-instructions.md

echo "🎯 Running Performance Budget Validation..."

BUILD_DIR="dist"
FAILED=false

# Portable helpers for size calculations (true KB)
# Uses stat to sum bytes, then converts to KB; works on macOS (-f%z) and Linux (-c%s)
stat_bytes() {
    local path="$1"
    if stat -f%z / >/dev/null 2>&1; then
        stat -f%z "$path" 2>/dev/null || echo 0
    else
        stat -c%s "$path" 2>/dev/null || echo 0
    fi
}

sum_kb_from_pathlist() {
    # Reads newline-delimited file paths from stdin.
    # Outputs total KB (rounded up).
    local total_bytes=0
    local p
    while IFS= read -r p; do
        [ -n "$p" ] || continue
        [ -f "$p" ] || continue
        total_bytes=$((total_bytes + $(stat_bytes "$p")))
    done
    echo $(( (total_bytes + 1023) / 1024 ))
}

sum_gzip_kb_from_pathlist() {
    # Reads newline-delimited file paths from stdin.
    # Outputs total gzip KB (rounded up).
    local total_bytes=0
    local p
    while IFS= read -r p; do
        [ -n "$p" ] || continue
        [ -f "$p" ] || continue
        # wc output is padded; strip spaces
        local gz_bytes
        gz_bytes=$(gzip -c "$p" | wc -c | tr -d ' ')
        total_bytes=$((total_bytes + gz_bytes))
    done
    echo $(( (total_bytes + 1023) / 1024 ))
}

sum_kb_from_find() {
    # Args: find command (path and predicates). This function appends -print0 and feeds to xargs.
    if stat -f%z / >/dev/null 2>&1; then
        # macOS/BSD stat
        find "$@" -print0 2>/dev/null | xargs -0 stat -f%z 2>/dev/null | awk '{s+=$1} END {printf "%.0f\n", s/1024}'
    else
        # GNU/Linux stat
        find "$@" -print0 2>/dev/null | xargs -0 stat -c%s 2>/dev/null | awk '{s+=$1} END {printf "%.0f\n", s/1024}'
    fi
}

collect_referenced_urls() {
    # Extracts referenced asset URLs from built HTML.
    # Includes script src, modulepreload href, astro-island component-url, renderer-url, etc.
    # Outputs newline-delimited URLs beginning with /_astro or /assets, with any query string removed.
    grep -RohE "(/_astro|/assets)/[^\"'<>[:space:]]+" "$BUILD_DIR" --include="*.html" 2>/dev/null \
        | sed 's/[?].*$//' \
        | sort -u
}

# 1. Check JavaScript Bundle Size (minimal JS principle)
echo "📦 Checking JavaScript bundle size..."
REFERENCED_JS_PATHS=$(collect_referenced_urls \
    | grep -E "^(/_astro|/assets)/.*\\.js$" \
    | sed "s#^#$BUILD_DIR#")

if [ -n "$REFERENCED_JS_PATHS" ]; then
    JS_FILE_COUNT=$(printf "%s\n" "$REFERENCED_JS_PATHS" | sort -u | wc -l | tr -d ' ')
    JS_RAW_SIZE=$(printf "%s\n" "$REFERENCED_JS_PATHS" | sort -u | sum_kb_from_pathlist)
    JS_GZIP_SIZE=$(printf "%s\n" "$REFERENCED_JS_PATHS" | sort -u | sum_gzip_kb_from_pathlist)
else
    # Fallback: count/sum all JS files in dist
    JS_FILE_COUNT=$(find "$BUILD_DIR" -type f -name "*.js" | wc -l | tr -d ' ')
    JS_RAW_SIZE=$(sum_kb_from_find "$BUILD_DIR" -type f -name "*.js")
    JS_GZIP_SIZE=$JS_RAW_SIZE
fi

# Budget (KB) based on network-relevant gzip size for referenced bundles
JS_GZIP_LIMIT=150

echo "✅ JavaScript referenced bundles: ${JS_GZIP_SIZE}KB gzip (${JS_RAW_SIZE}KB raw)"

if [ "$JS_GZIP_SIZE" -gt "$JS_GZIP_LIMIT" ]; then
    echo "❌ JavaScript bundle too large (gzip): ${JS_GZIP_SIZE}KB (limit: ${JS_GZIP_LIMIT}KB)"
    FAILED=true
else
    echo "✅ JavaScript bundle within gzip budget"
fi

if [ "$JS_FILE_COUNT" -gt 15 ]; then  # 15 files limit (more realistic)
    echo "❌ Too many JavaScript files: $JS_FILE_COUNT (limit: 15)"
    FAILED=true
else
    echo "✅ JavaScript file count: $JS_FILE_COUNT"
fi

# 2. Check CSS Bundle Size
echo "🎨 Checking CSS bundle size..."
CSS_SIZE=$(sum_kb_from_find "$BUILD_DIR" -type f -name "*.css")
CSS_SIZE=${CSS_SIZE:-0}
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
# Find jpg/png, exclude known required icons, and skip files with webp/avif siblings
IMAGE_CANDIDATES=$(find "$BUILD_DIR/assets/images" -type f \( -iname "*.jpg" -o -iname "*.png" \) \
    | grep -vE "/favicons/|/favicon(.*)\\.png$|/apple-touch-icon\\.png$|/icon-[0-9]+x[0-9]+\\.png$" \
    | grep -vE "/optimized/.*\\.png$" )

UNOPTIMIZED_LIST=""
COUNT=0
# Iterate over candidates line-by-line to support spaces in filenames
while IFS= read -r img; do
    [ -z "$img" ] && continue
    base_no_ext="${img%.*}"
    if [ -f "${base_no_ext}.webp" ] || [ -f "${base_no_ext}.avif" ]; then
        continue
    fi
    UNOPTIMIZED_LIST+="$img\n"
    COUNT=$((COUNT+1))
    if [ $COUNT -ge 5 ]; then break; fi
done <<EOF
$IMAGE_CANDIDATES
EOF

if [ $COUNT -gt 0 ]; then
    echo "⚠️ Warning: Found potentially unoptimized images (no WebP/AVIF sibling):"
    printf "$UNOPTIMIZED_LIST"
    echo "Consider using WebP/AVIF formats or exclude intentional PNG/JPG."
fi

# 5. Check Total Bundle Size (separating images vs. non-images)
echo "📊 Checking total bundle size (split by type)..."

# Use referenced URLs (preserve paths) to avoid basename collisions like multiple index.html files.
REFERENCED_ALL_PATHS=$(collect_referenced_urls \
    | grep -E "^(/_astro|/assets)/.*\\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|map)$" \
    | sed "s#^#$BUILD_DIR#")

HTML_PATHS=$(find "$BUILD_DIR" -type f -name "*.html" 2>/dev/null || true)

if [ -n "$REFERENCED_ALL_PATHS$HTML_PATHS" ]; then
    TOTAL_SIZE=$( (printf "%s\n" "$REFERENCED_ALL_PATHS"; printf "%s\n" "$HTML_PATHS") \
        | sort -u \
        | sum_kb_from_pathlist)
else
    TOTAL_SIZE=$(du -sk "$BUILD_DIR" | awk '{print $1}')
fi

REFERENCED_IMAGE_PATHS=$(collect_referenced_urls \
    | grep -E "^(/_astro|/assets)/.*\\.(png|jpg|jpeg|webp|avif|gif|svg)$" \
    | sed "s#^#$BUILD_DIR#")

IMAGES_SIZE=0
if [ -n "$REFERENCED_IMAGE_PATHS" ]; then
    IMAGES_SIZE=$(printf "%s\n" "$REFERENCED_IMAGE_PATHS" | sort -u | sum_kb_from_pathlist)
else
    # Fallback to summing all images if reference scan yields nothing
    IMAGES_SIZE=$(sum_kb_from_find "$BUILD_DIR" \
            -type f \
            \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.webp" -o -iname "*.avif" -o -iname "*.gif" -o -iname "*.svg" \))
fi

# Default to 0 if no images found
IMAGES_SIZE=${IMAGES_SIZE:-0}

# Non-image size (referenced) = total (referenced) - images (referenced)
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
echo "  JavaScript: ${JS_GZIP_SIZE}KB gzip (${JS_RAW_SIZE}KB raw, ${JS_FILE_COUNT} files)"
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
