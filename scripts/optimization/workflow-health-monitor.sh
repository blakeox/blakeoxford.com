#!/bin/bash

# workflow-health-monitor.sh - Monitor CI/CD pipeline health
# Part of the elite CI/CD suite for blakeoxford.com

set -euo pipefail

echo "🏥 CI/CD Workflow Health Monitor"
echo "================================"

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

# Check workflow files exist and are valid
check_workflows() {
    print_status $BLUE "📊 Checking workflow integrity..."
    
    local workflows_dir=".github/workflows"
    local required_workflows=(
        "ci-fast.yml"
        "ci-comprehensive.yml"
        "security.yml"
        "pr-size-guard.yml"
        "deployment-status.yml"
    )
    
    local missing_count=0
    local invalid_count=0
    
    for workflow in "${required_workflows[@]}"; do
        local workflow_path="$workflows_dir/$workflow"
        
        if [ -f "$workflow_path" ]; then
            print_status $GREEN "✅ $workflow exists"
            
            # Basic YAML structure check (GitHub Actions specific)
            if grep -q "^name:" "$workflow_path" && grep -q "^on:" "$workflow_path" && grep -q "^jobs:" "$workflow_path"; then
                print_status $GREEN "✅ $workflow structure valid"
            else
                print_status $RED "❌ $workflow structure invalid"
                invalid_count=$((invalid_count + 1))
            fi
        else
            print_status $RED "❌ $workflow missing"
            missing_count=$((missing_count + 1))
        fi
    done
    
    if [ $missing_count -eq 0 ] && [ $invalid_count -eq 0 ]; then
        print_status $GREEN "🎉 All workflows healthy!"
        return 0
    else
        print_status $RED "❌ Workflow issues found: $missing_count missing, $invalid_count invalid"
        return 1
    fi
}

# Check script health
check_scripts() {
    print_status $BLUE "🛠 Checking script integrity..."
    
    local script_dirs=("scripts/build" "scripts/optimization")
    local critical_scripts=(
        "scripts/build/performance-budget.sh"
        "scripts/build/performance-regression.sh"
        "scripts/optimization/deployment-quality-gate.sh"
    )
    
    local missing_count=0
    local non_executable=0
    
    for script in "${critical_scripts[@]}"; do
        if [ -f "$script" ]; then
            print_status $GREEN "✅ $script exists"
            
            if [ -x "$script" ]; then
                print_status $GREEN "✅ $script executable"
            else
                print_status $YELLOW "⚠️ $script not executable"
                non_executable=$((non_executable + 1))
            fi
        else
            print_status $RED "❌ $script missing"
            missing_count=$((missing_count + 1))
        fi
    done
    
    if [ $missing_count -eq 0 ]; then
        print_status $GREEN "🎉 All critical scripts present!"
        if [ $non_executable -gt 0 ]; then
            print_status $YELLOW "⚠️ $non_executable scripts need executable permissions"
        fi
        return 0
    else
        print_status $RED "❌ Script issues found: $missing_count missing"
        return 1
    fi
}

# Check package.json health
check_package_json() {
    print_status $BLUE "📦 Checking package.json health..."
    
    if [ ! -f "package.json" ]; then
        print_status $RED "❌ package.json missing"
        return 1
    fi
    
    # Check JSON syntax
    if ! python3 -m json.tool package.json > /dev/null 2>&1; then
        print_status $RED "❌ package.json syntax invalid"
        return 1
    fi
    
    # Check for required scripts
    local required_scripts=(
        "build"
        "dev"
        "test"
        "lint"
        "typecheck"
    )
    
    local missing_scripts=0
    
    for script in "${required_scripts[@]}"; do
        if grep -q "\"$script\":" package.json; then
            print_status $GREEN "✅ Script '$script' found"
        else
            print_status $RED "❌ Script '$script' missing"
            missing_scripts=$((missing_scripts + 1))
        fi
    done
    
    if [ $missing_scripts -eq 0 ]; then
        print_status $GREEN "🎉 Package.json is healthy!"
        return 0
    else
        print_status $RED "❌ Package.json issues: $missing_scripts missing scripts"
        return 1
    fi
}

# Check dependency health
check_dependencies() {
    print_status $BLUE "🔗 Checking dependency health..."
    
    if [ -f "pnpm-lock.yaml" ]; then
        print_status $GREEN "✅ pnpm lockfile present"
    elif [ -f "package-lock.json" ]; then
        print_status $GREEN "✅ npm lockfile present"
    else
        print_status $YELLOW "⚠️ No lockfile found"
    fi
    
    # Check for critical dependencies
    local critical_deps=(
        "astro"
        "@astrojs/check"
        "typescript"
        "eslint"
        "vitest"
        "@playwright/test"
    )
    
    local missing_deps=0
    
    for dep in "${critical_deps[@]}"; do
        if grep -q "\"$dep\":" package.json; then
            print_status $GREEN "✅ Dependency '$dep' found"
        else
            print_status $YELLOW "⚠️ Dependency '$dep' not found"
            missing_deps=$((missing_deps + 1))
        fi
    done
    
    if [ $missing_deps -eq 0 ]; then
        print_status $GREEN "🎉 All critical dependencies present!"
    else
        print_status $YELLOW "⚠️ $missing_deps critical dependencies missing"
    fi
    
    return 0
}

# Generate health report
generate_health_report() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat > workflow-health-report.json << EOF
{
  "timestamp": "$timestamp",
  "overall_health": "$1",
  "checks": {
    "workflows": "$2",
    "scripts": "$3",
    "package_json": "$4",
    "dependencies": "$5"
  },
  "recommendations": [
    "Monitor workflow execution times regularly",
    "Keep dependencies updated for security",
    "Review and optimize CI/CD resource usage monthly",
    "Ensure all team members understand the CI/CD pipeline"
  ]
}
EOF
    
    print_status $GREEN "📋 Health report generated: workflow-health-report.json"
}

# Main execution
main() {
    local workflow_health="healthy"
    local script_health="healthy"
    local package_health="healthy"
    local dependency_health="healthy"
    local overall_health="healthy"
    
    print_status $BLUE "🏥 Starting CI/CD Health Check..."
    echo "======================================"
    
    # Run all checks
    if ! check_workflows; then
        workflow_health="unhealthy"
        overall_health="unhealthy"
    fi
    
    if ! check_scripts; then
        script_health="degraded"
        if [ "$overall_health" = "healthy" ]; then
            overall_health="degraded"
        fi
    fi
    
    if ! check_package_json; then
        package_health="unhealthy"
        overall_health="unhealthy"
    fi
    
    if ! check_dependencies; then
        dependency_health="degraded"
        if [ "$overall_health" = "healthy" ]; then
            overall_health="degraded"
        fi
    fi
    
    echo "======================================"
    
    # Final status
    case $overall_health in
        "healthy")
            print_status $GREEN "🎉 CI/CD Pipeline: EXCELLENT HEALTH!"
            ;;
        "degraded")
            print_status $YELLOW "⚠️ CI/CD Pipeline: GOOD HEALTH (minor issues)"
            ;;
        "unhealthy")
            print_status $RED "❌ CI/CD Pipeline: NEEDS ATTENTION"
            ;;
    esac
    
    # Generate report
    generate_health_report "$overall_health" "$workflow_health" "$script_health" "$package_health" "$dependency_health"
    
    # Exit with appropriate code
    if [ "$overall_health" = "unhealthy" ]; then
        exit 1
    elif [ "$overall_health" = "degraded" ]; then
        exit 2
    else
        exit 0
    fi
}

# Run main function
main "$@"
