# StockENT - Stock Trading Platform

A comprehensive stock trading platform built with React, Node.js, and PostgreSQL, featuring real-time auctions, user management, and secure authentication.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/registration with Google OAuth integration
- **Role-based Access Control**: Admin, Seller, and Buyer roles with different permissions
- **Product Management**: Create, edit, and manage stock listings
- **Real-time Auctions**: Live bidding system with WebSocket support
- **Messaging System**: In-app communication between users
- **Search & Filtering**: Advanced product search with category filtering

### Technical Features
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Real-time Updates**: WebSocket integration for live data
- **File Upload**: Secure image upload with validation
- **Email Notifications**: Automated email system for important events
- **Cron Jobs**: Automated cleanup and daily reset tasks
- **Rate Limiting**: API protection against abuse
- **Caching**: Redis integration for improved performance

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Context API** for state management
- **React Router** for navigation
- **Axios** for API communication
- **Socket.io-client** for real-time features

### Backend
- **Node.js** with Express.js
- **Prisma ORM** for database management
- **PostgreSQL** database
- **Redis** for caching and sessions
- **Socket.io** for real-time communication
- **JWT** for authentication
- **Multer** for file uploads

### DevOps & Tools
- **Docker** support
- **Cron jobs** for automation
- **Winston** for logging
- **Helmet** for security
- **CORS** configuration
- **Rate limiting**

## 📁 Project Structure

```
StockENT/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API services
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── backend/                 # Node.js backend application
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── validators/      # Input validation
│   ├── prisma/              # Database schema and migrations
│   └── uploads/             # File upload storage
└── docs/                    # Documentation files
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Redis server
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/StockENT.git
   cd StockENT
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Environment Setup**
   
   **Backend Environment** (`backend/.env`):
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL="postgresql://username:password@localhost:5432/stockent"
   REDIS_URL="redis://localhost:6379"
   JWT_SECRET="your-jwt-secret"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   EMAIL_HOST="smtp.gmail.com"
   EMAIL_PORT=587
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASS="your-app-password"
   ```

   **Frontend Environment** (`frontend/.env`):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
   ```

4. **Database Setup**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Start Redis (in a separate terminal)
   redis-server
   
   # Start backend (from backend directory)
   npm run dev
   
   # Start frontend (from frontend directory)
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Available Scripts

### Backend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm run db:reset` - Reset database

### Frontend Scripts
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📊 Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- **Users**: User accounts with role-based access
- **Products**: Stock listings with auction details
- **Auctions**: Bidding information and timers
- **Messages**: User-to-user communication
- **Categories**: Product categorization

## 🔐 Authentication & Security

- **JWT Tokens**: Secure authentication with refresh tokens
- **Google OAuth**: Social login integration
- **Role-based Access**: Admin, Seller, Buyer permissions
- **Rate Limiting**: API protection
- **Input Validation**: Comprehensive data validation
- **File Upload Security**: Secure file handling

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Auctions
- `GET /api/auctions` - List auctions
- `POST /api/auctions/bid` - Place bid
- `GET /api/auctions/:id` - Get auction details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

If you find a bug, please create an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 💡 Feature Requests

We welcome feature requests! Please create an issue with:
- Clear description of the feature
- Use case and benefits
- Any mockups or examples

## 📞 Support

For support, email support@stockent.com or create an issue in this repository.

---

**StockENT** - Empowering stock trading through technology 🚀