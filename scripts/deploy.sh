#!/bin/bash

# StockENT Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-staging}

print_header() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}          StockENT Deployment - ${ENVIRONMENT^^}                    ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [staging|production]"
    exit 1
fi

print_header

# Production safeguard
if [[ "$ENVIRONMENT" == "production" ]]; then
    print_warning "You are deploying to PRODUCTION!"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    if [[ "$confirm" != "yes" ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if we're on main/master branch for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
        print_error "Production deployments must be from main/master branch"
        print_error "Current branch: $CURRENT_BRANCH"
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    print_warning "You have uncommitted changes"
    read -p "Continue anyway? (y/N): " continue_dirty
    if [[ ! "$continue_dirty" =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled"
        exit 1
    fi
fi

# Run tests
print_status "Running tests..."
task test || {
    print_error "Tests failed! Fix tests before deploying."
    exit 1
}

# Run linting
print_status "Running linting..."
task lint || {
    print_warning "Linting issues found, but continuing..."
}

# Build
print_status "Building application..."
task build || {
    print_error "Build failed!"
    exit 1
}

# Get version info
VERSION=$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)
COMMIT=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d%H%M%S)

print_status "Deploying version: $VERSION (commit: $COMMIT)"

# Environment-specific deployment
case $ENVIRONMENT in
    staging)
        print_status "Deploying to staging..."
        # Add your staging deployment commands here
        # Example: SSH to staging server and pull/restart
        # ssh staging@your-server.com "cd /app && git pull && npm run restart"

        # Or trigger CI/CD
        # curl -X POST "https://api.github.com/repos/owner/repo/dispatches" \
        #   -H "Authorization: token $GITHUB_TOKEN" \
        #   -d '{"event_type":"deploy-staging"}'

        print_success "Staging deployment triggered"
        ;;

    production)
        print_status "Creating production release..."

        # Create a git tag for the release
        TAG_NAME="v$TIMESTAMP"
        print_status "Creating tag: $TAG_NAME"

        git tag -a "$TAG_NAME" -m "Production release $TAG_NAME"
        git push origin "$TAG_NAME"

        print_success "Production release $TAG_NAME created and pushed"
        print_status "GitHub Actions will handle the deployment"
        ;;
esac

# Post-deployment
print_status "Deployment initiated!"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║${NC}              Deployment Complete!                          ${GREEN}║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Version:     ${CYAN}$VERSION${NC}"
echo -e "Commit:      ${CYAN}$COMMIT${NC}"
echo -e "Environment: ${CYAN}$ENVIRONMENT${NC}"
echo ""

if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo -e "Staging URL: ${CYAN}https://staging.stockent.com${NC}"
elif [[ "$ENVIRONMENT" == "production" ]]; then
    echo -e "Production URL: ${CYAN}https://stockent.com${NC}"
fi
echo ""
