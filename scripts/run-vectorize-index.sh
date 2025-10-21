#!/bin/bash

# Vectorize Index Runner
# This script helps run the vectorize indexer with proper authentication

echo "🔍 Vectorize Content Indexer Setup"
echo "=================================="
echo ""

# Check if CLOUDFLARE_API_TOKEN is already set
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
    echo "✅ CLOUDFLARE_API_TOKEN is already set"
    echo ""
    node scripts/vectorize-content.mjs
    exit $?
fi

echo "ℹ️  CLOUDFLARE_API_TOKEN not found in environment"
echo ""
echo "📝 To get your API token:"
echo "   1. Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "   2. Create a token with 'Workers AI' permissions"
echo "   3. Copy the token"
echo ""
echo "Then run ONE of these options:"
echo ""
echo "Option A - Set for this session:"
echo "   export CLOUDFLARE_API_TOKEN=your-token-here"
echo "   pnpm vectorize:index"
echo ""
echo "Option B - Run with inline token:"
echo "   CLOUDFLARE_API_TOKEN=your-token pnpm vectorize:index"
echo ""
echo "Option C - Use this script interactively:"
read -sp "   Paste your Cloudflare API token: " TOKEN
echo ""

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

echo ""
echo "🚀 Running indexer with provided token..."
echo ""

CLOUDFLARE_API_TOKEN="$TOKEN" node scripts/vectorize-content.mjs
