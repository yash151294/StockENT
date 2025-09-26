#!/bin/bash

# StockENT Database Setup Script
# This script sets up PostgreSQL database for the StockENT application

set -e

echo "🚀 Setting up StockENT Database..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL first."
    echo "Installation options:"
    echo "1. macOS: brew install postgresql@15"
    echo "2. Ubuntu: sudo apt-get install postgresql postgresql-contrib"
    echo "3. Docker: docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15"
    exit 1
fi

print_status "PostgreSQL is installed"

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    print_warning "PostgreSQL service is not running. Starting it..."
    
    # Try to start PostgreSQL service
    if command -v brew &> /dev/null; then
        # macOS with Homebrew
        brew services start postgresql@15 || brew services start postgresql
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start postgresql
    else
        print_error "Cannot start PostgreSQL service automatically. Please start it manually."
        exit 1
    fi
fi

print_status "PostgreSQL service is running"

# Database configuration
DB_NAME="stockent_db"
DB_USER="postgres"
DB_PASSWORD="stockent_secure_password_2024"

echo ""
echo "📋 Database Configuration:"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""

# Create database and user
echo "🔧 Creating database and user..."

# Create user (ignore error if user already exists)
psql -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || true

# Create database (ignore error if database already exists)
createdb $DB_NAME 2>/dev/null || true

# Grant privileges
psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true

print_status "Database and user created"

# Install Node.js dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
    print_status "Dependencies installed"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

print_status "Prisma client generated"

# Run database migrations
echo "🗄️  Running database migrations..."
npx prisma migrate dev --name init

print_status "Database migrations completed"

# Seed the database
echo "🌱 Seeding database..."
npx prisma db seed

print_status "Database seeded"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-here-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="development"

# CORS
FRONTEND_URL="http://localhost:3000"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH="./uploads"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@stockent.com"

# External APIs
CURRENCY_API_KEY="your-currency-api-key"
CURRENCY_API_URL="https://api.exchangerate-api.com/v4/latest"

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL="info"
LOG_FILE="logs/app.log"

# Socket.IO
SOCKET_CORS_ORIGIN="http://localhost:3000"

# Admin
ADMIN_EMAIL="admin@stockent.com"
ADMIN_PASSWORD="admin123456"

# File Storage
STORAGE_TYPE="local"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
AWS_S3_BUCKET=""

# Monitoring
SENTRY_DSN=""
EOF
    print_status ".env file created"
else
    print_warning ".env file already exists. Please update DATABASE_URL manually if needed."
fi

echo ""
echo "🎉 Database setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the .env file with your actual configuration values"
echo "2. Start the application: npm run dev"
echo "3. Access Prisma Studio: npm run db:studio"
echo ""
echo "🔗 Database connection string:"
echo "   postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""
echo "📊 You can now:"
echo "   - View your database: npm run db:studio"
echo "   - Reset your database: npm run db:reset"
echo "   - Run migrations: npm run db:migrate"
echo ""
