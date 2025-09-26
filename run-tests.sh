#!/bin/bash

# StockENT Comprehensive Testing Script
# This script runs all types of tests for the B2B textile marketplace

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    if [ -d "backend" ]; then
        print_status "Installing backend dependencies..."
        cd backend && npm install && cd ..
    fi
    
    # Install frontend dependencies
    if [ -d "frontend" ]; then
        print_status "Installing frontend dependencies..."
        cd frontend && npm install && cd ..
    fi
    
    # Install e2e dependencies
    if [ -d "e2e" ]; then
        print_status "Installing e2e dependencies..."
        cd e2e && npm install && cd ..
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Set test environment variables
    export NODE_ENV=test
    export TEST_DATABASE_URL=${TEST_DATABASE_URL:-"postgresql://test:test@localhost:5432/stockent_test"}
    export TEST_REDIS_URL=${TEST_REDIS_URL:-"redis://localhost:6379/1"}
    export JWT_SECRET="test-jwt-secret-key"
    export JWT_REFRESH_SECRET="test-refresh-secret-key"
    export FRONTEND_URL="http://localhost:3000"
    export PORT="5001"
    
    print_success "Test environment configured"
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Run unit tests
        print_status "Running backend unit tests..."
        npm run test:unit || {
            print_error "Backend unit tests failed"
            cd ..
            return 1
        }
        
        # Run integration tests
        print_status "Running backend integration tests..."
        npm run test:integration || {
            print_error "Backend integration tests failed"
            cd ..
            return 1
        }
        
        # Run performance tests
        print_status "Running backend performance tests..."
        npm run test:performance || {
            print_warning "Backend performance tests failed (non-critical)"
        }
        
        cd ..
        print_success "Backend tests completed"
    else
        print_warning "Backend directory not found, skipping backend tests"
    fi
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    if [ -d "frontend" ]; then
        cd frontend
        
        # Run unit tests
        print_status "Running frontend unit tests..."
        npm run test:unit || {
            print_error "Frontend unit tests failed"
            cd ..
            return 1
        }
        
        # Run integration tests
        print_status "Running frontend integration tests..."
        npm run test:integration || {
            print_error "Frontend integration tests failed"
            cd ..
            return 1
        }
        
        cd ..
        print_success "Frontend tests completed"
    else
        print_warning "Frontend directory not found, skipping frontend tests"
    fi
}

# Function to run e2e tests
run_e2e_tests() {
    print_status "Running end-to-end tests..."
    
    if [ -d "e2e" ]; then
        cd e2e
        
        # Install Playwright browsers if not already installed
        npx playwright install --with-deps || {
            print_warning "Failed to install Playwright browsers"
        }
        
        # Run e2e tests
        npx playwright test || {
            print_error "End-to-end tests failed"
            cd ..
            return 1
        }
        
        cd ..
        print_success "End-to-end tests completed"
    else
        print_warning "E2E directory not found, skipping e2e tests"
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    
    if [ -d "backend" ]; then
        cd backend
        
        # Run performance tests
        npm run test:performance || {
            print_warning "Performance tests failed (non-critical)"
        }
        
        cd ..
        print_success "Performance tests completed"
    else
        print_warning "Backend directory not found, skipping performance tests"
    fi
}

# Function to generate test report
generate_test_report() {
    print_status "Generating test report..."
    
    # Create reports directory
    mkdir -p test-reports
    
    # Generate backend coverage report
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage test-reports/backend-coverage
        print_success "Backend coverage report generated"
    fi
    
    # Generate frontend coverage report
    if [ -d "frontend/coverage" ]; then
        cp -r frontend/coverage test-reports/frontend-coverage
        print_success "Frontend coverage report generated"
    fi
    
    # Generate e2e test report
    if [ -d "e2e/test-results" ]; then
        cp -r e2e/test-results test-reports/e2e-results
        print_success "E2E test report generated"
    fi
    
    print_success "Test reports generated in test-reports/ directory"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up test environment..."
    
    # Kill any running processes
    pkill -f "node.*server.js" || true
    pkill -f "react-scripts" || true
    pkill -f "playwright" || true
    
    # Clean up test databases
    if command_exists psql; then
        psql -h localhost -U test -d postgres -c "DROP DATABASE IF EXISTS stockent_test;" || true
    fi
    
    print_success "Cleanup completed"
}

# Main function
main() {
    print_status "Starting StockENT Comprehensive Testing Suite"
    print_status "=============================================="
    
    # Parse command line arguments
    TEST_TYPE="all"
    SKIP_INSTALL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --type)
                TEST_TYPE="$2"
                shift 2
                ;;
            --skip-install)
                SKIP_INSTALL=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --type TYPE        Test type: all, backend, frontend, e2e, performance"
                echo "  --skip-install     Skip dependency installation"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check prerequisites
    check_prerequisites
    
    # Install dependencies if not skipped
    if [ "$SKIP_INSTALL" = false ]; then
        install_dependencies
    fi
    
    # Setup test environment
    setup_test_environment
    
    # Run tests based on type
    case $TEST_TYPE in
        "all")
            run_backend_tests
            run_frontend_tests
            run_e2e_tests
            run_performance_tests
            ;;
        "backend")
            run_backend_tests
            ;;
        "frontend")
            run_frontend_tests
            ;;
        "e2e")
            run_e2e_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        *)
            print_error "Invalid test type: $TEST_TYPE"
            exit 1
            ;;
    esac
    
    # Generate test report
    generate_test_report
    
    print_success "All tests completed successfully!"
    print_status "Test reports available in test-reports/ directory"
}

# Trap to cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"