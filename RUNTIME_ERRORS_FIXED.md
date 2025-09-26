# Runtime Errors Resolution Guide

## Issues Identified and Fixed

### 1. **Redis Connection Errors** ✅ FIXED
**Problem**: Server was crashing when Redis connection failed
**Solution**: 
- Modified `server.js` to handle Redis connection failures gracefully
- Updated `cache.js` to return null instead of throwing errors when Redis is unavailable
- Added Redis status endpoint at `/api/redis-status`

### 2. **Port Mismatch in Google OAuth** ✅ FIXED
**Problem**: Google OAuth redirect URI was set to port 5001 but server runs on 5000
**Solution**: Updated `.env` file to use correct port 5000

### 3. **Missing Frontend Environment File** ✅ FIXED
**Problem**: Frontend didn't have `.env` file
**Solution**: Created `.env` file from `env.example`

### 4. **Unhandled Promise Rejections** ✅ FIXED
**Problem**: Cache operations could cause unhandled promise rejections
**Solution**: Added proper error handling in all cache functions

## How to Start the Application

### Option 1: Use the Startup Script (Recommended)
```bash
./start-app.sh
```

### Option 2: Manual Startup
```bash
# 1. Start Redis (if not running)
./start-redis.sh

# 2. Start Backend
cd backend
npm start

# 3. Start Frontend (in another terminal)
cd frontend
npm start
```

## Verification Steps

1. **Check Redis Status**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check Backend Health**:
   ```bash
   curl http://localhost:5000/api/health
   # Should return JSON with status: "OK"
   ```

3. **Check Redis Connection from Backend**:
   ```bash
   curl http://localhost:5000/api/redis-status
   # Should return JSON with status: "connected"
   ```

4. **Check Frontend**:
   - Open http://localhost:3000
   - Should load without console errors

## Common Issues and Solutions

### Redis Connection Issues
- **Error**: `ECONNREFUSED` Redis connection errors
- **Solution**: Run `./start-redis.sh` or start Redis manually
- **Fallback**: App will work without Redis (no caching)

### Port Conflicts
- **Error**: Port 5000 or 3000 already in use
- **Solution**: 
  ```bash
  # Kill processes on ports
  lsof -ti:5000 | xargs kill -9
  lsof -ti:3000 | xargs kill -9
  ```

### Environment Variables
- **Error**: Missing environment variables
- **Solution**: Ensure both `.env` files exist:
  - `backend/.env`
  - `frontend/.env`

### Database Connection
- **Error**: Database connection issues
- **Solution**: Ensure PostgreSQL is running and database exists
  ```bash
  # Check if database exists
  psql -U stockent_user -d stockent_db -c "SELECT 1;"
  ```

## Monitoring and Debugging

### Backend Logs
```bash
cd backend
npm run dev  # For development with auto-restart
```

### Frontend Logs
Check browser console for any remaining errors

### Redis Monitoring
```bash
redis-cli monitor  # Monitor Redis commands
```

## Performance Notes

- **With Redis**: Full caching enabled, better performance
- **Without Redis**: App works but no caching (slower response times)
- **Memory Usage**: Redis uses minimal memory when running

## Next Steps

1. **Test the Application**: 
   - Register a new user
   - Login with existing user
   - Browse products
   - Test auctions (if implemented)

2. **Monitor Logs**: 
   - Check `backend/logs/` for any new errors
   - Monitor browser console for frontend issues

3. **Production Setup**: 
   - Update environment variables for production
   - Set up proper Redis configuration
   - Configure database for production

## Support

If you encounter any remaining issues:

1. Check the logs in `backend/logs/`
2. Verify all environment variables are set correctly
3. Ensure all services (Redis, PostgreSQL) are running
4. Check the health endpoints for service status
