# StockENT Comprehensive Test Data Summary

## Overview

This document summarizes the comprehensive test data that has been created for the StockENT B2B textile marketplace application. The test data includes users, products, auctions, messages, categories, and various other entities to provide a realistic testing environment.

## Created Files

### 1. `comprehensive-test-data.js`
The main script that creates all test data including:
- User accounts with different roles
- Product categories hierarchy
- Products listed by different sellers
- Auctions with different statuses
- Conversations and messages
- Bids on auctions
- Watchlist items
- Sample requests

### 2. `enhance-test-data.js`
An enhancement script that adds:
- Active auctions with real bids
- Additional products from different sellers
- More conversations and messages
- Realistic auction timing

### 3. `verify-comprehensive-test-data.js`
A verification script that displays:
- Complete overview of all created data
- Detailed breakdown by entity type
- Sample data from each category
- Final statistics

## Test Data Summary

### 👥 Users (11 total)
- **1 Admin**: `admin@stockent.com` - StockENT Administration
- **5 Sellers** from different countries:
  - `premium.fabrics@example.com` - Premium Fabrics Co (Turkey)
  - `cotton.masters@example.com` - Cotton Masters Ltd (India)
  - `silk.more@example.com` - Silk & More Inc (Italy)
  - `global.textiles@example.com` - Global Textiles (Germany)
  - `fabric.excellence@example.com` - Fabric Excellence (UK)
- **5 Buyers** from different countries:
  - `fashion.forward@example.com` - Fashion Forward Ltd (USA)
  - `style.solutions@example.com` - Style Solutions Inc (Canada)
  - `trendy.textiles@example.com` - Trendy Textiles Co (Mexico)
  - `fabric.world@example.com` - Fabric World Ltd (South Korea)
  - `textile.traders@example.com` - Textile Traders (China)

**All test users have the password: `TestPass123!` (for buyers/sellers) or `AdminPass123!` (for admin)**

### 📂 Categories (18 total)
Three-level hierarchy with main categories:
- **Textiles** (Level 0)
  - Natural Fibers (Level 1) → Cotton, Silk, Wool (Level 2)
  - Synthetic Fibers (Level 1) → Polyester, Nylon (Level 2)
  - Fabrics (Level 1) → Cotton Fabric, Denim (Level 2)
- **Apparel** (Level 0)
  - Men's Clothing (Level 1) → T-Shirts, Shirts (Level 2)
  - Women's Clothing (Level 1) → Dresses, Blouses (Level 2)

### 🛍️ Products (9 total)
Products listed by different sellers across various categories:

#### Premium Fabrics Co (Turkey) - 3 products
- Premium Organic Cotton Fiber ($3.50 USD, FIXED_PRICE)
- High-Quality Linen Fabric ($15.00 USD, FIXED_PRICE)
- Denim Fabric 14oz ($12.00 USD, AUCTION)

#### Silk & More Inc (Italy) - 2 products
- Mulberry Silk Yarn 20/22 Denier ($45.00 USD, AUCTION)
- Recycled Polyester Fabric ($6.50 USD, AUCTION)

#### Cotton Masters Ltd (India) - 2 products
- Polyester DTY Yarn 150D/144F ($2.80 USD, NEGOTIABLE)
- Bamboo Fiber Yarn ($8.50 USD, NEGOTIABLE)

#### Global Textiles (Germany) - 1 product
- Merino Wool Fiber ($12.00 USD, FIXED_PRICE)

#### Fabric Excellence (UK) - 1 product
- Cotton Poplin Fabric ($8.50 USD, FIXED_PRICE)

### 🎯 Auctions (3 total)
- **2 Active auctions** with real bids
- **1 Scheduled auction** for future testing
- Different auction types (English auctions)
- Realistic pricing with starting prices, reserve prices, and current bids

### 💰 Bids (3 total)
- Bids from different buyers on active auctions
- Mix of automatic and manual bids
- Different bid statuses (WINNING, OUTBID)
- Realistic bid progression

### 💬 Conversations (11 total)
- Conversations between buyers and sellers for different products
- Multiple conversations per buyer/seller pair
- Realistic conversation starters about products and samples

### 📨 Messages (42 total)
- Sample conversation flows between buyers and sellers
- Messages about product inquiries, samples, and pricing
- Realistic timing spread over hours
- Mix of buyer and seller messages

### 👀 Watchlist Items (17 total)
- Each buyer has 2-4 products in their watchlist
- Products from different sellers
- Realistic distribution across product types

### 📦 Sample Requests (5 total)
- Sample requests from buyers to sellers
- Different statuses (PENDING, APPROVED, SHIPPED)
- Realistic sample costs and shipping costs
- Some with tracking numbers

## Key Features Demonstrated

### 1. **Multi-Seller Product Listings**
- Products are listed by different sellers from various countries
- Different product types (fibers, yarns, fabrics)
- Various listing types (FIXED_PRICE, AUCTION, NEGOTIABLE)

### 2. **Realistic Auction System**
- Active auctions with real bids
- Different auction statuses (ACTIVE, SCHEDULED)
- Proper bid progression and current bid tracking

### 3. **International Marketplace**
- Users from 8 different countries
- Products from various global locations
- Realistic company names and contact information

### 4. **Complete User Interactions**
- Conversations between buyers and sellers
- Sample requests and negotiations
- Watchlist functionality
- Bid participation

### 5. **Product Specifications**
- Detailed product specifications for each item
- Realistic textile industry specifications
- Proper categorization

## Usage Instructions

### Running the Test Data Creation
```bash
cd backend
node comprehensive-test-data.js
```

### Enhancing the Test Data
```bash
cd backend
node enhance-test-data.js
```

### Verifying the Test Data
```bash
cd backend
node verify-comprehensive-test-data.js
```

## Test User Credentials

| Role | Email | Password | Company |
|------|-------|----------|---------|
| Admin | admin@stockent.com | AdminPass123! | StockENT Administration |
| Seller | premium.fabrics@example.com | SellerPass123! | Premium Fabrics Co |
| Seller | cotton.masters@example.com | SellerPass123! | Cotton Masters Ltd |
| Seller | silk.more@example.com | SellerPass123! | Silk & More Inc |
| Seller | global.textiles@example.com | SellerPass123! | Global Textiles |
| Seller | fabric.excellence@example.com | SellerPass123! | Fabric Excellence |
| Buyer | fashion.forward@example.com | BuyerPass123! | Fashion Forward Ltd |
| Buyer | style.solutions@example.com | BuyerPass123! | Style Solutions Inc |
| Buyer | trendy.textiles@example.com | BuyerPass123! | Trendy Textiles Co |
| Buyer | fabric.world@example.com | BuyerPass123! | Fabric World Ltd |
| Buyer | textile.traders@example.com | BuyerPass123! | Textile Traders |

## Database Statistics

- **Total Users**: 11 (1 admin, 5 sellers, 5 buyers)
- **Categories**: 18 (3-level hierarchy)
- **Products**: 9 (across different sellers and categories)
- **Auctions**: 3 (2 active, 1 scheduled)
- **Bids**: 3 (on active auctions)
- **Conversations**: 11 (between buyers and sellers)
- **Messages**: 42 (realistic conversation flows)
- **Watchlist Items**: 17 (products saved by buyers)
- **Sample Requests**: 5 (with different statuses)

This comprehensive test data provides a realistic environment for testing all aspects of the StockENT marketplace, including user interactions, product listings, auctions, messaging, and business workflows.
