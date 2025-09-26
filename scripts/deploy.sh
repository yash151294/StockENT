#!/bin/bash

# StockENT B2B Textile Marketplace - Deployment Script
# This script handles automated deployment with proper validation

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
LOG_FILE="deployment.log"
DEPLOYMENT_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Function to log messages
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a $LOG_FILE
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a $LOG_FILE
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a $LOG_FILE
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to validate environment
validate_environment() {
    log "🔍 Validating deployment environment..."
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if backend directory exists
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found"
        exit 1
    fi
    
    # Check if frontend directory exists
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# Function to install dependencies
install_dependencies() {
    log "📦 Installing dependencies..."
    
    # Backend dependencies
    log "Installing backend dependencies..."
    cd $BACKEND_DIR
    npm ci --silent
    cd ..
    
    # Frontend dependencies
    log "Installing frontend dependencies..."
    cd $FRONTEND_DIR
    npm ci --silent
    cd ..
    
    log_success "Dependencies installed successfully"
}

# Function to run tests
run_tests() {
    log "🧪 Running tests..."
    
    # Backend tests
    log "Running backend tests..."
    cd $BACKEND_DIR
    if npm test; then
        log_success "Backend tests passed"
    else
        log_error "Backend tests failed"
        exit 1
    fi
    cd ..
    
    # Frontend tests
    log "Running frontend tests..."
    cd $FRONTEND_DIR
    if npm test -- --coverage --watchAll=false; then
        log_success "Frontend tests passed"
    else
        log_error "Frontend tests failed"
        exit 1
    fi
    cd ..
    
    log_success "All tests passed"
}

# Function to build applications
build_applications() {
    log "🔨 Building applications..."
    
    # Build frontend
    log "Building frontend..."
    cd $FRONTEND_DIR
    if npm run build; then
        log_success "Frontend build successful"
    else
        log_error "Frontend build failed"
        exit 1
    fi
    cd ..
    
    # Lint backend
    log "Linting backend..."
    cd $BACKEND_DIR
    if npm run lint; then
        log_success "Backend linting passed"
    else
        log_warning "Backend linting issues found, but continuing..."
    fi
    cd ..
    
    log_success "Build process completed"
}

# Function to commit and push changes
commit_and_push() {
    log "📝 Committing and pushing changes..."
    
    # Check if there are changes to commit
    if git diff --quiet && git diff --staged --quiet; then
        log "No changes to commit"
        return 0
    fi
    
    # Stage all changes
    git add .
    
    # Generate commit message based on changes
    COMMIT_MSG=""
    if git diff --cached --name-only | grep -q "backend/"; then
        COMMIT_MSG="feat(backend): "
    elif git diff --cached --name-only | grep -q "frontend/"; then
        COMMIT_MSG="feat(frontend): "
    else
        COMMIT_MSG="feat: "
    fi
    
    # Add timestamp and deployment info
    COMMIT_MSG+="Auto-deploy changes - $DEPLOYMENT_TIMESTAMP"
    
    # Commit changes
    if git commit -m "$COMMIT_MSG"; then
        log_success "Changes committed successfully"
    else
        log_error "Failed to commit changes"
        exit 1
    fi
    
    # Push to main branch
    if git push origin main; then
        log_success "Changes pushed to main branch"
    else
        log_error "Failed to push changes"
        exit 1
    fi
}

# Function to create deployment tag
create_deployment_tag() {
    log "🏷️  Creating deployment tag..."
    
    TAG_NAME="deploy-$DEPLOYMENT_TIMESTAMP"
    
    if git tag -a "$TAG_NAME" -m "Deployment tag for $DEPLOYMENT_TIMESTAMP"; then
        log_success "Deployment tag created: $TAG_NAME"
        
        if git push origin "$TAG_NAME"; then
            log_success "Deployment tag pushed to remote"
        else
            log_warning "Failed to push deployment tag"
        fi
    else
        log_warning "Failed to create deployment tag"
    fi
}

# Function to check critical files
check_critical_files() {
    log "🔍 Checking critical files for textile marketplace..."
    
    CRITICAL_FILES=(
        "backend/src/server.js"
        "backend/prisma/schema.prisma"
        "frontend/src/App.tsx"
        "backend/package.json"
        "frontend/package.json"
    )
    
    for file in "${CRITICAL_FILES[@]}"; do
        if [ -f "$file" ]; then
            log_success "Critical file exists: $file"
        else
            log_error "Critical file missing: $file"
            exit 1
        fi
    done
}

# Function to validate textile marketplace specific components
validate_marketplace_components() {
    log "🏭 Validating textile marketplace components..."
    
    # Check for auction functionality
    if grep -q "auction" backend/src/server.js; then
        log_success "Auction functionality detected"
    else
        log_warning "Auction functionality not found"
    fi
    
    # Check for product management
    if grep -q "product" backend/src/server.js; then
        log_success "Product management detected"
    else
        log_warning "Product management not found"
    fi
    
    # Check for messaging system
    if grep -q "message" backend/src/server.js; then
        log_success "Messaging system detected"
    else
        log_warning "Messaging system not found"
    fi
    
    # Check for authentication
    if grep -q "auth" backend/src/server.js; then
        log_success "Authentication system detected"
    else
        log_warning "Authentication system not found"
    fi
}

# Main deployment function
main() {
    log "🚀 Starting StockENT B2B Textile Marketplace Deployment"
    log "Deployment ID: $DEPLOYMENT_TIMESTAMP"
    
    # Validate environment
    validate_environment
    
    # Check critical files
    check_critical_files
    
    # Validate marketplace components
    validate_marketplace_components
    
    # Install dependencies
    install_dependencies
    
    # Run tests
    run_tests
    
    # Build applications
    build_applications
    
    # Commit and push changes
    commit_and_push
    
    # Create deployment tag
    create_deployment_tag
    
    log_success "🎉 Deployment completed successfully!"
    log "Deployment log saved to: $LOG_FILE"
}

# Run main function
main "$@"