#!/bin/bash

# Performance Regression Detection
# Compares current build performance against baseline

echo "📊 Performance Regression Detection..."

BUILD_DIR="dist"
BASELINE_FILE="scripts/build/performance-baseline.json"
CURRENT_REPORT="performance-current.json"
FAILED=false

# Generate current performance metrics
echo "🔍 Analyzing current build..."

# Bundle sizes
JS_SIZE=$(find $BUILD_DIR -name "*.js" -type f -exec du -c {} + | grep total | awk '{print $1}' || echo "0")
CSS_SIZE=$(find $BUILD_DIR -name "*.css" -type f -exec du -c {} + | grep total | awk '{print $1}' || echo "0")
HTML_SIZE=$(find $BUILD_DIR -name "*.html" -type f -exec du -c {} + | grep total | awk '{print $1}' || echo "0")
TOTAL_SIZE=$(du -s $BUILD_DIR | awk '{print $1}')

# File counts
JS_FILES=$(find $BUILD_DIR -name "*.js" -type f | wc -l)
CSS_FILES=$(find $BUILD_DIR -name "*.css" -type f | wc -l)
HTML_FILES=$(find $BUILD_DIR -name "*.html" -type f | wc -l)

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
echo "  JavaScript: ${JS_SIZE}KB (${JS_FILES} files)"
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
