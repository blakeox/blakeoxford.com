#!/bin/bash

# Enhanced Playwright browser installation script for CI environments
# This script attempts multiple installation strategies to ensure browsers work in CI

set -e

echo "🎭 Enhanced Playwright Browser Installation"
echo "=========================================="

# Function to check if we're in a CI environment
is_ci() {
    [ -n "$CI" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$JENKINS_URL" ]
}

# Function to check available system dependencies
check_system_deps() {
    echo "🔍 Checking system dependencies..."
    
    if command -v apt-get >/dev/null 2>&1; then
        echo "📦 APT package manager detected"
        # Update package list
        sudo apt-get update -qq
        
        # Install essential dependencies for browser installation
        sudo apt-get install -y \
            libnss3-dev \
            libatk-bridge2.0-dev \
            libdrm-dev \
            libxkbcommon-dev \
            libgtk-3-dev \
            libgbm-dev \
            libasound2-dev \
            xvfb \
            wget \
            ca-certificates \
            fonts-liberation \
            libasound2 \
            libatk1.0-0 \
            libc6 \
            libcairo2 \
            libcups2 \
            libdbus-1-3 \
            libexpat1 \
            libfontconfig1 \
            libgcc1 \
            libgconf-2-4 \
            libgdk-pixbuf2.0-0 \
            libglib2.0-0 \
            libgtk-3-0 \
            libnspr4 \
            libpango-1.0-0 \
            libpangocairo-1.0-0 \
            libstdc++6 \
            libx11-6 \
            libx11-xcb1 \
            libxcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxext6 \
            libxfixes3 \
            libxi6 \
            libxrandr2 \
            libxrender1 \
            libxss1 \
            libxtst6 \
            lsb-release \
            xdg-utils
    fi
}

# Function to install browsers with multiple attempts
install_browsers() {
    local attempt=1
    local max_attempts=3
    
    while [ $attempt -le $max_attempts ]; do
        echo "🔄 Browser installation attempt $attempt/$max_attempts"
        
        if pnpm exec playwright install --with-deps; then
            echo "✅ Browser installation successful on attempt $attempt"
            return 0
        else
            echo "❌ Browser installation failed on attempt $attempt"
            if [ $attempt -lt $max_attempts ]; then
                echo "⏳ Waiting 10 seconds before retry..."
                sleep 10
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo "⚠️ All browser installation attempts failed, trying fallback methods..."
    return 1
}

# Function to install only Chromium as fallback
install_chromium_only() {
    echo "🔄 Attempting Chromium-only installation..."
    
    if pnpm exec playwright install chromium --with-deps; then
        echo "✅ Chromium installation successful"
        return 0
    else
        echo "❌ Chromium installation failed"
        return 1
    fi
}

# Function to verify browser installations
verify_browsers() {
    echo "🔍 Verifying browser installations..."
    
    if node scripts/build/check-playwright-browsers.cjs; then
        echo "✅ Browser verification successful"
        return 0
    else
        echo "⚠️ Browser verification shows limited availability"
        return 1
    fi
}

# Main installation flow
main() {
    if is_ci; then
        echo "🏗️ CI environment detected, installing system dependencies..."
        check_system_deps
    fi
    
    echo "📥 Starting browser installation..."
    
    if install_browsers; then
        echo "🎉 Full browser installation completed"
    elif install_chromium_only; then
        echo "⚠️ Fallback to Chromium-only installation completed"
        echo "PLAYWRIGHT_BROWSERS_LIMITED=true" >> "$GITHUB_ENV"
    else
        echo "❌ All browser installation methods failed"
        exit 1
    fi
    
    # Verify installation
    verify_browsers || echo "⚠️ Continuing with limited browser support"
    
    echo "🎭 Browser installation process completed"
}

# Run main function
main "$@"
