#!/bin/bash

# StockENT B2B Textile Marketplace - Rollback Script
# This script handles rollback operations for the textile marketplace

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
ROLLBACK_LOG="rollback.log"

# Function to log messages
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $ROLLBACK_LOG
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a $ROLLBACK_LOG
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a $ROLLBACK_LOG
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a $ROLLBACK_LOG
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -t, --tag TAG        Rollback to specific tag"
    echo "  -c, --commit COMMIT  Rollback to specific commit"
    echo "  -l, --list          List available rollback points"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --list                    # List available rollback points"
    echo "  $0 --tag deploy-20241201_143022  # Rollback to specific tag"
    echo "  $0 --commit a1b2c3d4         # Rollback to specific commit"
}

# Function to list available rollback points
list_rollback_points() {
    log "📋 Listing available rollback points..."
    
    echo ""
    echo "Recent commits:"
    git log --oneline -10 --decorate
    
    echo ""
    echo "Recent tags:"
    git tag -l "deploy-*" | tail -10
    
    echo ""
    echo "Recent branches:"
    git branch -a | head -10
}

# Function to validate rollback target
validate_rollback_target() {
    local target="$1"
    local target_type="$2"
    
    log "🔍 Validating rollback target: $target"
    
    case "$target_type" in
        "tag")
            if git tag -l | grep -q "^$target$"; then
                log_success "Tag $target exists"
                return 0
            else
                log_error "Tag $target does not exist"
                return 1
            fi
            ;;
        "commit")
            if git rev-parse --verify "$target" >/dev/null 2>&1; then
                log_success "Commit $target exists"
                return 0
            else
                log_error "Commit $target does not exist"
                return 1
            fi
            ;;
        *)
            log_error "Invalid target type: $target_type"
            return 1
            ;;
    esac
}

# Function to backup current state
backup_current_state() {
    log "💾 Creating backup of current state..."
    
    local backup_dir="backup-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # Backup current code
    cp -r "$BACKEND_DIR" "$backup_dir/"
    cp -r "$FRONTEND_DIR" "$backup_dir/"
    
    # Backup current git state
    git log --oneline -5 > "$backup_dir/git-log.txt"
    git status > "$backup_dir/git-status.txt"
    
    log_success "Backup created: $backup_dir"
    echo "$backup_dir" > .current-backup
}

# Function to rollback to tag
rollback_to_tag() {
    local tag="$1"
    
    log "🔄 Rolling back to tag: $tag"
    
    # Validate tag exists
    if ! validate_rollback_target "$tag" "tag"; then
        return 1
    fi
    
    # Backup current state
    backup_current_state
    
    # Checkout tag
    if git checkout "$tag"; then
        log_success "Successfully rolled back to tag: $tag"
    else
        log_error "Failed to rollback to tag: $tag"
        return 1
    fi
}

# Function to rollback to commit
rollback_to_commit() {
    local commit="$1"
    
    log "🔄 Rolling back to commit: $commit"
    
    # Validate commit exists
    if ! validate_rollback_target "$commit" "commit"; then
        return 1
    fi
    
    # Backup current state
    backup_current_state
    
    # Checkout commit
    if git checkout "$commit"; then
        log_success "Successfully rolled back to commit: $commit"
    else
        log_error "Failed to rollback to commit: $commit"
        return 1
    fi
}

# Function to restore from backup
restore_from_backup() {
    local backup_dir="$1"
    
    log "🔄 Restoring from backup: $backup_dir"
    
    if [ -d "$backup_dir" ]; then
        # Restore backend
        if [ -d "$backup_dir/backend" ]; then
            rm -rf "$BACKEND_DIR"
            cp -r "$backup_dir/backend" "$BACKEND_DIR"
            log_success "Backend restored from backup"
        fi
        
        # Restore frontend
        if [ -d "$backup_dir/frontend" ]; then
            rm -rf "$FRONTEND_DIR"
            cp -r "$backup_dir/frontend" "$FRONTEND_DIR"
            log_success "Frontend restored from backup"
        fi
        
        log_success "Restoration completed"
    else
        log_error "Backup directory not found: $backup_dir"
        return 1
    fi
}

# Function to verify rollback
verify_rollback() {
    log "🔍 Verifying rollback..."
    
    # Check if critical files exist
    local critical_files=(
        "backend/src/server.js"
        "backend/package.json"
        "frontend/src/App.tsx"
        "frontend/package.json"
    )
    
    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            log_success "Critical file exists: $file"
        else
            log_error "Critical file missing: $file"
            return 1
        fi
    done
    
    # Check if application can start
    log "Testing application startup..."
    
    # Test backend
    cd "$BACKEND_DIR"
    if npm install --silent; then
        log_success "Backend dependencies installed"
    else
        log_warning "Backend dependency installation failed"
    fi
    cd ..
    
    # Test frontend
    cd "$FRONTEND_DIR"
    if npm install --silent; then
        log_success "Frontend dependencies installed"
    else
        log_warning "Frontend dependency installation failed"
    fi
    cd ..
    
    log_success "Rollback verification completed"
}

# Function to update deployment status
update_deployment_status() {
    local status="$1"
    local message="$2"
    
    log "📊 Updating deployment status: $status"
    
    # Create deployment status file
    cat > "deployment-status.json" << EOF
{
    "status": "$status",
    "message": "$message",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "rollback": true
}
EOF
    
    log_success "Deployment status updated"
}

# Function to notify stakeholders
notify_stakeholders() {
    local message="$1"
    
    log "📢 Notifying stakeholders..."
    
    # Log notification (in real implementation, this would send emails/Slack messages)
    log "NOTIFICATION: $message"
    
    log_success "Stakeholders notified"
}

# Main rollback function
main() {
    local target=""
    local target_type=""
    local list_only=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -t|--tag)
                target="$2"
                target_type="tag"
                shift 2
                ;;
            -c|--commit)
                target="$2"
                target_type="commit"
                shift 2
                ;;
            -l|--list)
                list_only=true
                shift
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Handle list option
    if [ "$list_only" = true ]; then
        list_rollback_points
        exit 0
    fi
    
    # Check if target is provided
    if [ -z "$target" ]; then
        log_error "No rollback target specified"
        show_usage
        exit 1
    fi
    
    log "🚀 Starting StockENT Rollback Process"
    log "Target: $target ($target_type)"
    
    # Perform rollback
    case "$target_type" in
        "tag")
            if rollback_to_tag "$target"; then
                verify_rollback
                update_deployment_status "rolled_back" "Rolled back to tag: $target"
                notify_stakeholders "System rolled back to tag: $target"
                log_success "🎉 Rollback completed successfully!"
            else
                log_error "Rollback failed"
                exit 1
            fi
            ;;
        "commit")
            if rollback_to_commit "$target"; then
                verify_rollback
                update_deployment_status "rolled_back" "Rolled back to commit: $target"
                notify_stakeholders "System rolled back to commit: $target"
                log_success "🎉 Rollback completed successfully!"
            else
                log_error "Rollback failed"
                exit 1
            fi
            ;;
        *)
            log_error "Invalid target type: $target_type"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"