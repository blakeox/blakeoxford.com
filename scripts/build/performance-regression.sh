#!/bin/bash

# Performance Regression Detection
# Compares current build performance against baseline
# Measures user-facing payload (referenced assets, gzip compression)

echo "📊 Performance Regression Detection..."

BUILD_DIR="dist"
BASELINE_FILE="scripts/build/performance-baseline.json"
CURRENT_REPORT="performance-current.json"
FAILED=false

# Portable helpers (same as performance-budget.sh)
stat_bytes() {
    local path="$1"
    if stat -f%z / >/dev/null 2>&1; then
        stat -f%z "$path" 2>/dev/null || echo 0
    else
        stat -c%s "$path" 2>/dev/null || echo 0
    fi
}

sum_kb_from_pathlist() {
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
    local total_bytes=0
    local p
    while IFS= read -r p; do
        [ -n "$p" ] || continue
        [ -f "$p" ] || continue
        local gz_bytes
        gz_bytes=$(gzip -c "$p" | wc -c | tr -d ' ')
        total_bytes=$((total_bytes + gz_bytes))
    done
    echo $(( (total_bytes + 1023) / 1024 ))
}

collect_referenced_urls() {
    grep -RohE "(/_astro|/assets)/[^\"'<>[:space:]]+" "$BUILD_DIR" --include="*.html" 2>/dev/null \
        | sed 's/[?].*$//' \
        | sort -u
}

# Generate current performance metrics
echo "🔍 Analyzing current build..."

# Referenced JS (user-facing payload)
REFERENCED_JS_PATHS=$(collect_referenced_urls \
    | grep -E "^(/_astro|/assets)/.*\.js$" \
    | sed "s#^#$BUILD_DIR#")

if [ -n "$REFERENCED_JS_PATHS" ]; then
    JS_FILES=$(printf "%s\n" "$REFERENCED_JS_PATHS" | sort -u | wc -l | tr -d ' ')
    JS_SIZE=$(printf "%s\n" "$REFERENCED_JS_PATHS" | sort -u | sum_gzip_kb_from_pathlist)
else
    JS_FILES=0
    JS_SIZE=0
fi

# Referenced CSS
REFERENCED_CSS_PATHS=$(collect_referenced_urls \
    | grep -E "^(/_astro|/assets)/.*\.css$" \
    | sed "s#^#$BUILD_DIR#")

if [ -n "$REFERENCED_CSS_PATHS" ]; then
    CSS_FILES=$(printf "%s\n" "$REFERENCED_CSS_PATHS" | sort -u | wc -l | tr -d ' ')
    CSS_SIZE=$(printf "%s\n" "$REFERENCED_CSS_PATHS" | sort -u | sum_kb_from_pathlist)
else
    CSS_FILES=0
    CSS_SIZE=0
fi

# HTML size (all HTML)
HTML_FILES=$(find $BUILD_DIR -name "*.html" -type f | wc -l | tr -d ' ')
HTML_SIZE=$(find $BUILD_DIR -name "*.html" -type f -print0 2>/dev/null | xargs -0 ls -l 2>/dev/null | awk '{s+=$5} END {printf "%.0f\n", s/1024}' || echo "0")

# Total dist size
TOTAL_SIZE=$(du -sk $BUILD_DIR 2>/dev/null | awk '{print $1}' || echo "0")

# Create current metrics
cat > $CURRENT_REPORT << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "metrics": {
    "bundle_sizes": {
      "js_kb": $JS_SIZE,
      "css_kb": $CSS_SIZE,
      "html_kb": $HTML_SIZE,
      "total_kb": $TOTAL_SIZE
    },
    "file_counts": {
      "js_files": $JS_FILES,
      "css_files": $CSS_FILES,
      "html_files": $HTML_FILES
    }
  }
}
EOF

echo "📈 Current Performance Metrics:"
echo "  JavaScript: ${JS_SIZE}KB gzip (${JS_FILES} files)"
echo "  CSS: ${CSS_SIZE}KB (${CSS_FILES} files)"
echo "  HTML: ${HTML_SIZE}KB (${HTML_FILES} files)"
echo "  Total: ${TOTAL_SIZE}KB"

# Compare with baseline if it exists
if [ -f "$BASELINE_FILE" ]; then
    echo ""
    echo "⚖️ Comparing with baseline..."
    
    # Extract baseline values using grep and sed (more portable than jq)
    BASELINE_JS=$(grep -o '"js_kb": [0-9]*' $BASELINE_FILE | grep -o '[0-9]*')
    BASELINE_CSS=$(grep -o '"css_kb": [0-9]*' $BASELINE_FILE | grep -o '[0-9]*')
    BASELINE_TOTAL=$(grep -o '"total_kb": [0-9]*' $BASELINE_FILE | grep -o '[0-9]*')
    
    # Calculate changes (10% tolerance)
    JS_INCREASE=$(( ($JS_SIZE - $BASELINE_JS) * 100 / $BASELINE_JS ))
    CSS_INCREASE=$(( ($CSS_SIZE - $BASELINE_CSS) * 100 / $BASELINE_CSS ))
    TOTAL_INCREASE=$(( ($TOTAL_SIZE - $BASELINE_TOTAL) * 100 / $BASELINE_TOTAL ))
    
    echo "  JS change: ${JS_INCREASE}% (${JS_SIZE}KB vs ${BASELINE_JS}KB)"
    echo "  CSS change: ${CSS_INCREASE}% (${CSS_SIZE}KB vs ${BASELINE_CSS}KB)"
    echo "  Total change: ${TOTAL_INCREASE}% (${TOTAL_SIZE}KB vs ${BASELINE_TOTAL}KB)"
    
    # Check for regressions (>15% increase)
    if [ $JS_INCREASE -gt 15 ]; then
        echo "❌ JavaScript bundle size regression: +${JS_INCREASE}%"
        FAILED=true
    fi
    
    if [ $CSS_INCREASE -gt 15 ]; then
        echo "❌ CSS bundle size regression: +${CSS_INCREASE}%"
        FAILED=true
    fi
    
    if [ $TOTAL_INCREASE -gt 10 ]; then
        echo "❌ Total bundle size regression: +${TOTAL_INCREASE}%"
        FAILED=true
    fi
    
    if [ "$FAILED" = false ]; then
        echo "✅ No significant performance regressions detected"
    fi
else
    echo "📝 No baseline found. Current metrics will be used as baseline."
    cp $CURRENT_REPORT $BASELINE_FILE
fi

# Clean up
rm -f $CURRENT_REPORT

if [ "$FAILED" = true ]; then
    echo ""
    echo "❌ Performance regression detected!"
    echo "Bundle sizes have increased significantly compared to baseline."
    exit 1
else
    echo ""
    echo "✅ Performance regression check passed"
fi
