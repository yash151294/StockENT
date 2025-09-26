# StockENT Deployment Guide

This guide addresses the common deployment issues and provides solutions for setting up your StockENT application in production.

## Issues Fixed

### 1. NPM/Yarn Cache Issues
- ✅ Created proper GitHub Actions workflow with correct cache paths
- ✅ Configured separate cache for backend and frontend dependencies
- ✅ Used `actions/cache@v3` with proper key strategies

### 2. PostgreSQL Role Error
- ✅ Updated database configuration to use `postgres` user instead of `root`
- ✅ Created production environment configuration
- ✅ Updated database setup script

## GitHub Actions Workflow

The workflow file `.github/workflows/deploy.yml` includes:

### Cache Configuration
```yaml
- name: Cache backend dependencies
  uses: actions/cache@v3
  with:
    path: |
      backend/node_modules
      ~/.npm
    key: ${{ runner.os }}-backend-${{ hashFiles('backend/package-lock.json') }}

- name: Cache frontend dependencies
  uses: actions/cache@v3
  with:
    path: |
      frontend/node_modules
      ~/.npm
    key: ${{ runner.os }}-frontend-${{ hashFiles('frontend/package-lock.json') }}
```

### Database Configuration
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: postgres  # Using 'postgres' instead of 'root'
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: stockent_test
```

## Environment Configuration

### Development (.env)
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/stockent_db"
```

### Production (.env.production)
```env
DATABASE_URL="postgresql://postgres:your_production_password@your_db_host:5432/stockent_production"
```

## Database Setup

### Local Development
1. Run the setup script:
   ```bash
   cd backend
   chmod +x setup-database.sh
   ./setup-database.sh
   ```

2. The script will:
   - Create PostgreSQL database and user
   - Run Prisma migrations
   - Seed the database
   - Create `.env` file with correct configuration

### Production Database
1. Create a PostgreSQL database on your hosting provider
2. Use the `postgres` user (not `root`)
3. Update your production environment variables

## Deployment Steps

### 1. Set up GitHub Secrets
In your GitHub repository, go to Settings > Secrets and add:

```
DATABASE_URL=postgresql://postgres:password@your-db-host:5432/stockent_production
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

### 2. Configure Your Hosting Platform
- **Database**: Use PostgreSQL with `postgres` user
- **Redis**: Set up Redis instance
- **Environment Variables**: Use the production template

### 3. Build and Deploy
The GitHub Actions workflow will:
1. Install dependencies with proper caching
2. Run tests with PostgreSQL and Redis services
3. Build the frontend
4. Deploy to your hosting platform

## Common Issues and Solutions

### Cache Issues
**Problem**: "Some specified paths were not resolved, unable to cache dependencies"

**Solution**: 
- Use correct cache paths in workflow
- Ensure `package-lock.json` files exist
- Use separate cache keys for backend/frontend

### Database Connection Issues
**Problem**: "FATAL: role 'root' does not exist"

**Solution**:
- Use `postgres` user instead of `root`
- Update `DATABASE_URL` in environment variables
- Ensure PostgreSQL service is running

### Environment Variables
**Problem**: Missing or incorrect environment variables

**Solution**:
- Copy `env.example` to `.env` for development
- Copy `env.production.example` to `.env.production` for production
- Update all placeholder values with actual credentials

## Testing the Setup

### Local Testing
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

### Production Testing
1. Check GitHub Actions workflow runs successfully
2. Verify database connection in production
3. Test API endpoints
4. Verify frontend builds and loads correctly

## Monitoring

### Logs
- Backend logs: `backend/logs/`
- GitHub Actions logs: Repository > Actions tab

### Database
- Use Prisma Studio: `npm run db:studio`
- Check database connection: `npm run db:migrate`

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **Database Passwords**: Use strong, unique passwords
3. **JWT Secrets**: Generate cryptographically secure secrets
4. **CORS**: Configure for your production domains
5. **Rate Limiting**: Configure appropriate limits for production

## Troubleshooting

### Cache Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Issues
```bash
# Check PostgreSQL status
pg_isready

# Connect to database
psql -U postgres -d stockent_db

# Reset database
npm run db:reset
```

### Build Issues
```bash
# Clear build cache
rm -rf frontend/build

# Rebuild
cd frontend
npm run build
```

## Support

If you encounter issues:
1. Check the GitHub Actions logs
2. Verify environment variables
3. Test database connectivity
4. Review application logs

For additional help, refer to:
- [Prisma Documentation](https://www.prisma.io/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
