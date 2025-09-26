#!/bin/bash

# StockENT B2B Textile Marketplace - Change Monitor
# This script monitors file changes and triggers automated deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WATCH_DIRS=("backend" "frontend")
DEPLOY_SCRIPT="./scripts/deploy.sh"
LOG_FILE="change-monitor.log"
LAST_CHECK_FILE=".last-check"

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

# Function to get file checksums
get_checksums() {
    find "${WATCH_DIRS[@]}" -type f -name "*.js" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.prisma" | \
    xargs md5sum 2>/dev/null | sort
}

# Function to check for changes
check_for_changes() {
    local current_checksums
    local stored_checksums
    
    current_checksums=$(get_checksums)
    
    if [ -f "$LAST_CHECK_FILE" ]; then
        stored_checksums=$(cat "$LAST_CHECK_FILE")
    else
        stored_checksums=""
    fi
    
    if [ "$current_checksums" != "$stored_checksums" ]; then
        echo "$current_checksums" > "$LAST_CHECK_FILE"
        return 0  # Changes detected
    else
        return 1  # No changes
    fi
}

# Function to analyze changes
analyze_changes() {
    log "🔍 Analyzing changes..."
    
    # Check for critical changes
    local critical_changes=false
    
    # Check for authentication changes
    if git diff --name-only HEAD~1 HEAD | grep -E "(auth|login|register)" >/dev/null; then
        log_warning "Authentication changes detected - requires careful review"
        critical_changes=true
    fi
    
    # Check for payment/transaction changes
    if git diff --name-only HEAD~1 HEAD | grep -E "(payment|transaction|billing)" >/dev/null; then
        log_warning "Payment/transaction changes detected - requires careful review"
        critical_changes=true
    fi
    
    # Check for database schema changes
    if git diff --name-only HEAD~1 HEAD | grep -E "(schema\.prisma|migration)" >/dev/null; then
        log_warning "Database schema changes detected - requires migration"
        critical_changes=true
    fi
    
    # Check for auction system changes
    if git diff --name-only HEAD~1 HEAD | grep -E "(auction|bid)" >/dev/null; then
        log_warning "Auction system changes detected - requires testing"
        critical_changes=true
    fi
    
    # Check for product management changes
    if git diff --name-only HEAD~1 HEAD | grep -E "(product|inventory)" >/dev/null; then
        log_warning "Product management changes detected - requires testing"
        critical_changes=true
    fi
    
    if [ "$critical_changes" = true ]; then
        log_warning "Critical changes detected - manual review recommended"
        return 1
    else
        log_success "No critical changes detected"
        return 0
    fi
}

# Function to trigger deployment
trigger_deployment() {
    log "🚀 Triggering automated deployment..."
    
    if [ -f "$DEPLOY_SCRIPT" ]; then
        if bash "$DEPLOY_SCRIPT"; then
            log_success "Deployment completed successfully"
        else
            log_error "Deployment failed"
            return 1
        fi
    else
        log_error "Deployment script not found: $DEPLOY_SCRIPT"
        return 1
    fi
}

# Function to create meaningful commit message
create_commit_message() {
    local changed_files
    local commit_type="feat"
    local scope=""
    local description=""
    
    changed_files=$(git diff --name-only --cached)
    
    # Determine commit type and scope
    if echo "$changed_files" | grep -q "backend/"; then
        scope="backend"
    elif echo "$changed_files" | grep -q "frontend/"; then
        scope="frontend"
    fi
    
    # Determine description based on changed files
    if echo "$changed_files" | grep -q "auth"; then
        description="Update authentication system"
    elif echo "$changed_files" | grep -q "auction"; then
        description="Update auction functionality"
    elif echo "$changed_files" | grep -q "product"; then
        description="Update product management"
    elif echo "$changed_files" | grep -q "message"; then
        description="Update messaging system"
    else
        description="Update marketplace functionality"
    fi
    
    echo "$commit_type($scope): $description"
}

# Function to commit changes
commit_changes() {
    log "📝 Committing changes..."
    
    # Stage all changes
    git add .
    
    # Create commit message
    local commit_msg
    commit_msg=$(create_commit_message)
    
    # Commit changes
    if git commit -m "$commit_msg"; then
        log_success "Changes committed: $commit_msg"
    else
        log_error "Failed to commit changes"
        return 1
    fi
}

# Function to push changes
push_changes() {
    log "📤 Pushing changes to remote..."
    
    if git push origin main; then
        log_success "Changes pushed to main branch"
    else
        log_error "Failed to push changes"
        return 1
    fi
}

# Function to monitor changes continuously
monitor_continuous() {
    log "👀 Starting continuous monitoring..."
    log "Watching directories: ${WATCH_DIRS[*]}"
    
    while true; do
        if check_for_changes; then
            log "📝 Changes detected!"
            
            # Analyze changes
            if analyze_changes; then
                # Commit changes
                commit_changes
                
                # Push changes
                push_changes
                
                # Trigger deployment
                trigger_deployment
            else
                log_warning "Critical changes detected - skipping automatic deployment"
                log "Please review changes manually before deploying"
            fi
        else
            log "No changes detected"
        fi
        
        # Wait before next check
        sleep 30
    done
}

# Function to monitor changes once
monitor_once() {
    log "🔍 Checking for changes once..."
    
    if check_for_changes; then
        log "📝 Changes detected!"
        
        # Analyze changes
        if analyze_changes; then
            # Commit changes
            commit_changes
            
            # Push changes
            push_changes
            
            # Trigger deployment
            trigger_deployment
        else
            log_warning "Critical changes detected - skipping automatic deployment"
            log "Please review changes manually before deploying"
        fi
    else
        log "No changes detected"
    fi
}

# Main function
main() {
    log "🚀 Starting StockENT Change Monitor"
    
    case "${1:-once}" in
        "continuous"|"watch")
            monitor_continuous
            ;;
        "once"|"check")
            monitor_once
            ;;
        *)
            echo "Usage: $0 [once|continuous]"
            echo "  once       - Check for changes once and exit"
            echo "  continuous - Monitor changes continuously"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"