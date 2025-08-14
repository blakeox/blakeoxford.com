#!/bin/bash

# Performance Budget Validation Script
# Enforces the performance-first principles outlined in copilot-instructions.md

echo "🎯 Running Performance Budget Validation..."

BUILD_DIR="dist"
FAILED=false

# Portable helpers for size calculations (true KB)
# Uses stat to sum bytes, then converts to KB; works on macOS (-f%z) and Linux (-c%s)
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

# 1. Check JavaScript Bundle Size (minimal JS principle)
echo "📦 Checking JavaScript bundle size..."
JS_SIZE=$(sum_kb_from_find "$BUILD_DIR" -type f -name "*.js")

# Prefer counting only JS files that are actually referenced by built HTML (scripts/modulepreload)
# This avoids penalizing unreferenced helper chunks or diagnostics emitted by tooling.
REFERENCED_JS_BASENAMES=$(grep -RohE "(<script[^>]+src=\"(/_astro|/assets)/[A-Za-z0-9._\/-]+\.js(\?[^\"'<> ]*)?\"|<link[^>]+rel=\"modulepreload\"[^>]+href=\"(/_astro|/assets)/[A-Za-z0-9._\/-]+\.js(\?[^\"'<> ]*)?\")" "$BUILD_DIR" 2>/dev/null \
    | sed -E 's/.*(\/_astro|\/assets)\//\1\//; s/\?.*\"/\"/; s/^[^"]*\"//; s/\".*$//' \
    | sed 's#.*/##' \
    | sort -u)

if [ -n "$REFERENCED_JS_BASENAMES" ]; then
    # Resolve basenames back to files in BUILD_DIR and count unique paths
    TMPJS=$(mktemp)
    echo "$REFERENCED_JS_BASENAMES" > "$TMPJS"
    JS_FILE_COUNT=$(while IFS= read -r name; do find "$BUILD_DIR" -type f -name "$name"; done < "$TMPJS" \
        | sort -u | wc -l | tr -d ' ')
    rm -f "$TMPJS"
else
    # Fallback: count all JS files in dist
    JS_FILE_COUNT=$(find "$BUILD_DIR" -type f -name "*.js" | wc -l | tr -d ' ')
fi

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
for img in $IMAGE_CANDIDATES; do
    base_no_ext="${img%.*}"
    if [ -f "${base_no_ext}.webp" ] || [ -f "${base_no_ext}.avif" ]; then
        continue
    fi
    UNOPTIMIZED_LIST+="$img\n"
    COUNT=$((COUNT+1))
    if [ $COUNT -ge 5 ]; then break; fi
done

if [ $COUNT -gt 0 ]; then
    echo "⚠️ Warning: Found potentially unoptimized images (no WebP/AVIF sibling):"
    printf "$UNOPTIMIZED_LIST"
    echo "Consider using WebP/AVIF formats or exclude intentional PNG/JPG."
fi

# 5. Check Total Bundle Size (separating images vs. non-images)
echo "📊 Checking total bundle size (split by type)..."

# Calculate total size of referenced assets only (KB)
# 1) Collect referenced asset basenames from built HTML/JS/CSS for /_astro and /assets paths
REFERENCED_ALL=$(grep -RohE "(/_astro|/assets)/[A-Za-z0-9._/-]+\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|map)" "$BUILD_DIR" 2>/dev/null \
    | sed 's#.*/##' \
    | sort -u)

# 2) Include HTML files explicitly (they are entry points)
HTML_LIST=$(find "$BUILD_DIR" -type f -name "*.html" -exec basename {} \; 2>/dev/null || true)

# 3) Sum bytes for referenced assets + HTML, then convert to KB
if [ -n "$REFERENCED_ALL$HTML_LIST" ]; then
    TMPREF=$(mktemp)
    echo "$REFERENCED_ALL" > "$TMPREF"
    # Append HTML basenames
    if [ -n "$HTML_LIST" ]; then echo "$HTML_LIST" >> "$TMPREF"; fi
    if stat -f%z / >/dev/null 2>&1; then
        BYTES_TOTAL=$(while IFS= read -r name; do find "$BUILD_DIR" -type f -name "$name" -print0; done < "$TMPREF" \
            | xargs -0 stat -f%z 2>/dev/null | awk '{s+=$1} END {printf "%.0f\n", s}')
    else
        BYTES_TOTAL=$(while IFS= read -r name; do find "$BUILD_DIR" -type f -name "$name" -print0; done < "$TMPREF" \
            | xargs -0 stat -c%s 2>/dev/null | awk '{s+=$1} END {printf "%.0f\n", s}')
    fi
    TOTAL_SIZE=$(( (BYTES_TOTAL + 1023) / 1024 ))
    rm -f "$TMPREF"
else
    TOTAL_SIZE=$(du -sk "$BUILD_DIR" | awk '{print $1}')
fi

# Calculate size of image assets only (only those referenced by built files)
# Build a list of referenced asset basenames from HTML/JS/CSS and sum their sizes
REFERENCED_LIST=$(grep -RohE "(/_astro|/assets)/[A-Za-z0-9._-]+\.(png|jpg|jpeg|webp|avif|gif|svg)" "$BUILD_DIR" 2>/dev/null \
    | sed 's#.*/##' \
    | sort -u)

IMAGES_SIZE=0
if [ -n "$REFERENCED_LIST" ]; then
    # Create a temp file list and sum sizes for matches in BUILD_DIR
    TMPFILE=$(mktemp)
    echo "$REFERENCED_LIST" > "$TMPFILE"
    # Find matching files in BUILD_DIR/_astro and BUILD_DIR/assets by basename
    # Then sum their sizes in KB
    if stat -f%z / >/dev/null 2>&1; then
        # macOS/BSD stat
        BYTES=$(while IFS= read -r name; do find "$BUILD_DIR" -type f -name "$name" -print0; done < "$TMPFILE" \
            | xargs -0 stat -f%z 2>/dev/null | awk '{s+=$1} END {printf "%.0f\n", s}')
    else
        # GNU/Linux stat
        BYTES=$(while IFS= read -r name; do find "$BUILD_DIR" -type f -name "$name" -print0; done < "$TMPFILE" \
            | xargs -0 stat -c%s 2>/dev/null | awk '{s+=$1} END {printf "%.0f\n", s}')
    fi
    IMAGES_SIZE=$(( (BYTES + 1023) / 1024 ))
    rm -f "$TMPFILE"
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
