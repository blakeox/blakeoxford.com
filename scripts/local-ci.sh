#!/bin/bash
# Local GitHub Actions Testing with Act
# This script provides easy commands to test GitHub Actions locally

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo -e "${RED}❌ act is not installed. Install it with: brew install act${NC}"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
    exit 1
fi

echo -e "${BLUE}🎭 Blake Oxford Local CI Testing with Act${NC}"
echo -e "${BLUE}===========================================${NC}"

# Function to run specific workflow
run_workflow() {
    local workflow=$1
    local job=$2
    local additional_flags=$3
    
    echo -e "${YELLOW}🚀 Running workflow: $workflow${NC}"
    if [ -n "$job" ]; then
        echo -e "${YELLOW}📋 Job: $job${NC}"
    fi
    
    # Create a temporary .env file for local testing
    cat > .env.local << EOF
CI=true
COMPREHENSIVE_TESTS=false
NODE_ENV=test
EOF
    
    local act_command="act -W .github/workflows/$workflow"
    
    if [ -n "$job" ]; then
        act_command="$act_command -j $job"
    fi
    
    if [ -n "$additional_flags" ]; then
        act_command="$act_command $additional_flags"
    fi
    
    # Add environment file
    act_command="$act_command --env-file .env.local"
    
    echo -e "${BLUE}🔧 Running: $act_command${NC}"
    eval $act_command
    
    # Cleanup
    rm -f .env.local
}

# Function to run comprehensive tests locally
run_comprehensive() {
    echo -e "${GREEN}🎯 Running Comprehensive CI Pipeline Locally${NC}"
    
    # Create enhanced local environment
    cat > .env.local << EOF
CI=true
COMPREHENSIVE_TESTS=true
NODE_ENV=test
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=false
EOF
    
    act -W .github/workflows/ci-comprehensive.yml \
        --env-file .env.local \
        --artifact-server-path ./act-artifacts \
        -v
    
    rm -f .env.local
}

# Function to run just the E2E tests
run_e2e_only() {
    echo -e "${GREEN}🎪 Running E2E Tests Only${NC}"
    
    cat > .env.local << EOF
CI=true
COMPREHENSIVE_TESTS=false
NODE_ENV=test
EOF
    
    act -W .github/workflows/ci-comprehensive.yml \
        -j comprehensive-tests \
        --matrix test-group:e2e \
        --env-file .env.local \
        -v
    
    rm -f .env.local
}

# Function to run unit tests only
run_unit_only() {
    echo -e "${GREEN}🧪 Running Unit Tests Only${NC}"
    
    cat > .env.local << EOF
CI=true
NODE_ENV=test
EOF
    
    act -W .github/workflows/ci-comprehensive.yml \
        -j comprehensive-tests \
        --matrix test-group:unit \
        --env-file .env.local \
        -v
    
    rm -f .env.local
}

# Function to debug a specific failing test
debug_failing_tests() {
    echo -e "${YELLOW}🔍 Debug Mode: Running with maximum verbosity${NC}"
    
    cat > .env.local << EOF
CI=true
COMPREHENSIVE_TESTS=false
NODE_ENV=test
DEBUG=1
PLAYWRIGHT_DEBUG=1
EOF
    
    act -W .github/workflows/ci-comprehensive.yml \
        -j comprehensive-tests \
        --matrix test-group:e2e \
        --env-file .env.local \
        --verbose \
        --dryrun
    
    echo -e "${BLUE}Above was a dry run. Run again without --dryrun to execute.${NC}"
    rm -f .env.local
}

# Function to clean up act artifacts
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up act artifacts...${NC}"
    rm -rf act-artifacts/
    rm -f .env.local
    docker system prune -f --filter "label=act"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Main menu
case "${1:-menu}" in
    "comprehensive"|"full")
        run_comprehensive
        ;;
    "e2e"|"playwright")
        run_e2e_only
        ;;
    "unit"|"vitest")
        run_unit_only
        ;;
    "debug")
        debug_failing_tests
        ;;
    "fast"|"ci-fast")
        run_workflow "ci-fast.yml" "" "--env-file .env.local"
        ;;
    "security")
        run_workflow "security.yml" "" "--env-file .env.local"
        ;;
    "cleanup"|"clean")
        cleanup
        ;;
    "help"|"--help"|"-h")
        echo -e "${BLUE}🎭 Blake Oxford Local CI Testing${NC}"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  comprehensive|full    Run the full comprehensive CI pipeline"
        echo "  e2e|playwright       Run only E2E tests"
        echo "  unit|vitest          Run only unit tests"
        echo "  debug                Debug failing tests with dry-run"
        echo "  fast|ci-fast         Run the fast CI workflow"
        echo "  security             Run security checks"
        echo "  cleanup|clean        Clean up act artifacts and Docker containers"
        echo "  help                 Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 e2e                # Test just the E2E failures"
        echo "  $0 debug              # Debug the failing tests"
        echo "  $0 comprehensive      # Run everything like CI"
        echo ""
        ;;
    "menu"|*)
        echo -e "${BLUE}🎭 Blake Oxford Local CI Testing${NC}"
        echo ""
        echo "Select an option:"
        echo "1) Run E2E tests only (debug your failing tests)"
        echo "2) Run unit tests only"
        echo "3) Run comprehensive pipeline"
        echo "4) Debug mode (dry run)"
        echo "5) Fast CI workflow"
        echo "6) Security checks"
        echo "7) Cleanup"
        echo "8) Help"
        echo ""
        read -p "Enter choice [1-8]: " choice
        
        case $choice in
            1) run_e2e_only ;;
            2) run_unit_only ;;
            3) run_comprehensive ;;
            4) debug_failing_tests ;;
            5) run_workflow "ci-fast.yml" ;;
            6) run_workflow "security.yml" ;;
            7) cleanup ;;
            8) exec $0 help ;;
            *) echo -e "${RED}Invalid option${NC}" ;;
        esac
        ;;
esac
