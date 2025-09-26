#!/bin/bash

# StockENT Application Startup Script
echo "🚀 Starting StockENT Application..."

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

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ]; then
    print_error "Please run this script from the StockENT root directory"
    exit 1
fi

print_status "Checking system requirements..."

# Check Node.js
if ! command -v node > /dev/null 2>&1; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check npm
if ! command -v npm > /dev/null 2>&1; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "Node.js and npm are available"

# Start Redis
print_status "Starting Redis..."
if [ -f "./start-redis.sh" ]; then
    ./start-redis.sh
    if [ $? -ne 0 ]; then
        print_warning "Redis startup failed, but continuing..."
    fi
else
    print_warning "Redis startup script not found, checking Redis manually..."
    if ! redis-cli ping > /dev/null 2>&1; then
        print_warning "Redis is not running. The app will work without caching."
    else
        print_success "Redis is running"
    fi
fi

# Check environment files
print_status "Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found. Creating from example..."
    if [ -f "backend/env.example" ]; then
        cp backend/env.example backend/.env
        print_success "Created backend/.env from example"
    else
        print_error "Backend env.example not found. Please create .env manually."
        exit 1
    fi
fi

if [ ! -f "frontend/.env" ]; then
    print_warning "Frontend .env file not found. Creating from example..."
    if [ -f "frontend/env.example" ]; then
        cp frontend/env.example frontend/.env
        print_success "Created frontend/.env from example"
    else
        print_error "Frontend env.example not found. Please create .env manually."
        exit 1
    fi
fi

# Install dependencies
print_status "Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

print_status "Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

cd ..

# Start the application
print_status "Starting the application..."

# Start backend in background
print_status "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    print_success "Backend server is running on port 5001"
else
    print_warning "Backend server may not be running properly"
fi

# Start frontend
print_status "Starting frontend development server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

print_success "Application startup initiated!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5001/api"
echo "🔍 Health Check: http://localhost:5001/api/health"
echo "📊 Redis Status: http://localhost:5001/api/redis-status"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    print_status "Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    print_success "All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
