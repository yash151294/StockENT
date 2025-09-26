# StockENT Database Setup Guide

This guide provides step-by-step instructions for setting up the PostgreSQL database for the StockENT B2B Textile Marketplace application.

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

## 🚀 Quick Setup (Automated)

### Option 1: Using the Setup Script (Recommended)

```bash
cd backend
./setup-database.sh
```

This script will:
- Check PostgreSQL installation
- Create database and user
- Install dependencies
- Generate Prisma client
- Run migrations
- Seed the database
- Create .env file

## 🔧 Manual Setup

### Step 1: Install PostgreSQL

#### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

#### Docker (Alternative)
```bash
docker run --name stockent-postgres \
  -e POSTGRES_DB=stockent_db \
  -e POSTGRES_USER=stockent_user \
  -e POSTGRES_PASSWORD=stockent_secure_password_2024 \
  -p 5432:5432 \
  -d postgres:15
```

### Step 2: Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Create user
CREATE USER stockent_user WITH PASSWORD 'stockent_secure_password_2024';

# Create database
CREATE DATABASE stockent_db;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stockent_db TO stockent_user;

# Exit psql
\q
```

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

### Step 4: Configure Environment

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL="postgresql://stockent_user:stockent_secure_password_2024@localhost:5432/stockent_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
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
```

### Step 5: Generate Prisma Client

```bash
npx prisma generate
```

### Step 6: Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### Step 7: Seed the Database

```bash
npx prisma db seed
```

## 📊 Database Schema Overview

The StockENT application uses the following main entities:

### Core Entities

1. **Users** - Buyers, sellers, and admins
2. **Products** - Textile products with specifications
3. **Categories** - Hierarchical product categories
4. **Auctions** - Auction listings
5. **Bids** - Auction bids
6. **Conversations** - Buyer-seller messaging
7. **Messages** - Individual messages
8. **Sample Requests** - Product sample requests
9. **Watchlist** - User's saved products
10. **Notifications** - System notifications

### Key Relationships

- Users can have multiple products (sellers)
- Products belong to categories (hierarchical)
- Products can have auctions
- Auctions have multiple bids
- Users can have conversations about products
- Users can add products to watchlist
- Users receive notifications

## 🛠️ Database Management Commands

### View Database Schema
```bash
npm run db:studio
```

### Reset Database
```bash
npm run db:reset
```

### Run New Migrations
```bash
npm run db:migrate
```

### Deploy Migrations (Production)
```bash
npm run db:deploy
```

### Generate Prisma Client
```bash
npm run db:generate
```

## 🔍 Verification

### Check Database Connection
```bash
psql -h localhost -U stockent_user -d stockent_db
```

### Verify Tables
```sql
\dt
```

### Check Sample Data
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM categories;
```

## 🚨 Troubleshooting

### Common Issues

1. **PostgreSQL not running**
   ```bash
   # macOS
   brew services start postgresql@15
   
   # Linux
   sudo systemctl start postgresql
   ```

2. **Permission denied errors**
   ```bash
   sudo chown -R $(whoami) /usr/local/var/postgres
   ```

3. **Port 5432 already in use**
   ```bash
   lsof -i :5432
   kill -9 <PID>
   ```

4. **Database connection failed**
   - Check if PostgreSQL is running
   - Verify credentials in .env file
   - Ensure database exists

### Reset Everything
```bash
# Stop application
# Drop database
dropdb stockent_db

# Recreate database
createdb stockent_db

# Run setup script again
./setup-database.sh
```

## 📈 Production Considerations

### Security
- Change all default passwords
- Use strong JWT secrets
- Enable SSL for database connections
- Use environment-specific configurations

### Performance
- Add database indexes for frequently queried fields
- Configure connection pooling
- Set up database monitoring
- Regular backups

### Scaling
- Consider read replicas for heavy read workloads
- Implement database sharding if needed
- Use Redis for caching frequently accessed data

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 Support

If you encounter issues:
1. Check the logs: `tail -f logs/app.log`
2. Verify database connection
3. Check Prisma schema syntax
4. Ensure all dependencies are installed

For additional help, refer to the application documentation or contact the development team.
