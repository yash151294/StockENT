#!/bin/bash

# Start Redis if not running
echo "🔍 Checking Redis status..."

if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running. Starting Redis..."
    
    # Try to start Redis with Homebrew (macOS)
    if command -v brew > /dev/null 2>&1; then
        echo "🍺 Starting Redis with Homebrew..."
        brew services start redis
        sleep 2
        
        # Check if Redis started successfully
        if redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis started successfully with Homebrew"
        else
            echo "❌ Failed to start Redis with Homebrew"
            echo "   Please start Redis manually: brew services start redis"
            exit 1
        fi
    else
        echo "❌ Homebrew not found. Please start Redis manually:"
        echo "   - Install Redis: brew install redis"
        echo "   - Start Redis: brew services start redis"
        echo "   - Or start Redis directly: redis-server"
        exit 1
    fi
else
    echo "✅ Redis is already running"
fi

echo "🚀 Redis is ready!"
echo "   Test connection: redis-cli ping"
echo "   Monitor Redis: redis-cli monitor"
