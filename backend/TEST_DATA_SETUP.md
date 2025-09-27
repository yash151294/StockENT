# StockENT Test Data Setup

This document describes how to populate and manage test data for the StockENT application.

## Overview

The test data setup includes:
- User profiles with realistic company information
- Contact person names and phone numbers
- Country information for international users
- Conversation aliases for messaging

## Scripts

### Main Setup Script: `setup-test-data.js`

This is the primary script for setting up test data. It performs the following actions:

1. **Updates existing users** with realistic test data
2. **Creates additional test users** for testing purposes
3. **Updates conversation aliases** to ensure proper messaging
4. **Provides a summary** of the database state

#### Usage

```bash
cd backend
node setup-test-data.js
```

#### Features

- **Smart Updates**: Only updates users that need data (skips users with complete profiles)
- **Role-based Data**: Assigns appropriate company types for buyers vs sellers
- **International Data**: Includes users from different countries
- **Conversation Support**: Ensures all conversations have proper aliases

## Test Data Categories

### Buyers
- Fashion Forward Ltd (United States)
- Style Solutions Inc (Canada)
- Trendy Textiles Co (Mexico)
- Fabric World Ltd (South Korea)
- Textile Traders (China)

### Sellers
- Premium Fabrics Co (Turkey)
- Cotton Masters Ltd (India)
- Silk & More Inc (Italy)
- Global Textiles (Germany)
- Fabric Excellence (United Kingdom)

## User Accounts

### Existing Test Users
- `admin@stockent.com` - Admin user
- `seller@textilemill.com` - Seller account
- `buyer@garmentfactory.com` - Buyer account
- `yash151294@gmail.com` - Seller account

### Additional Test Users
- `testbuyer1@example.com` - Test buyer account
- `testseller1@example.com` - Test seller account

All test users have the password: `TestPass123!`

## Database Schema Requirements

The test data setup requires the following Prisma schema fields:

```prisma
model User {
  companyName       String?
  contactPerson     String?
  phone             String?
  country           String?
  // ... other fields
}

model Conversation {
  buyerAlias        String
  sellerAlias       String
  // ... other fields
}
```

## Running the Setup

1. **Ensure database is synced**:
   ```bash
   npx prisma db push
   ```

2. **Run the setup script**:
   ```bash
   node setup-test-data.js
   ```

3. **Verify the results** by checking the console output

## Output Example

```
🚀 Starting StockENT test data setup...

📝 Updating existing users with test data...
Found 10 users to update
✅ Updated 9 users

👥 Creating additional test users...
✅ Created: 2 users
⏭️  Skipped: 0 users (already exist)

💬 Updating conversation aliases...
Found 2 conversations to check
✅ Updated 0 conversations

📊 Database Summary:
👥 Total Users: 12
🛒 Buyers: 5
🏪 Sellers: 6
👑 Admins: 1
💬 Conversations: 2

🎉 Test data setup completed successfully!
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure the database is running and accessible
2. **Prisma Client**: Make sure Prisma client is generated (`npx prisma generate`)
3. **Schema Sync**: Run `npx prisma db push` before running the script

### Error Handling

The script includes comprehensive error handling:
- Skips users that already have complete data
- Continues processing even if individual users fail
- Provides detailed error messages for debugging

## Maintenance

### Adding New Test Users

To add new test users, modify the `additionalTestUsers` array in `setup-test-data.js`:

```javascript
const additionalTestUsers = [
  {
    email: 'newuser@example.com',
    password: 'TestPass123!',
    role: 'BUYER',
    companyName: 'New Company',
    contactPerson: 'New Person',
    phone: '+1-555-9999',
    country: 'United States'
  }
];
```

### Updating Existing Data

The script automatically updates users with missing data. To force updates, you can:

1. Clear specific fields in the database
2. Re-run the setup script
3. The script will detect missing data and update accordingly

## Security Notes

- Test passwords are simple and should only be used in development
- Real production data should never be used in test environments
- Consider using environment-specific test data for different deployment stages
