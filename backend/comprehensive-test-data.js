const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Comprehensive test data for StockENT
const testData = {
  // Categories hierarchy
  categories: [
    {
      name: 'Textiles',
      level: 0,
      path: 'textiles',
      description: 'All textile products and materials',
      children: [
        {
          name: 'Natural Fibers',
          level: 1,
          path: 'textiles/natural-fibers',
          description: 'Cotton, silk, wool, linen, hemp',
          children: [
            { name: 'Cotton', level: 2, path: 'textiles/natural-fibers/cotton', description: 'Cotton fiber and yarn' },
            { name: 'Silk', level: 2, path: 'textiles/natural-fibers/silk', description: 'Silk fiber and yarn' },
            { name: 'Wool', level: 2, path: 'textiles/natural-fibers/wool', description: 'Wool fiber and yarn' }
          ]
        },
        {
          name: 'Synthetic Fibers',
          level: 1,
          path: 'textiles/synthetic-fibers',
          description: 'Polyester, nylon, acrylic, spandex',
          children: [
            { name: 'Polyester', level: 2, path: 'textiles/synthetic-fibers/polyester', description: 'Polyester fiber and yarn' },
            { name: 'Nylon', level: 2, path: 'textiles/synthetic-fibers/nylon', description: 'Nylon fiber and yarn' }
          ]
        },
        {
          name: 'Fabrics',
          level: 1,
          path: 'textiles/fabrics',
          description: 'Woven and knitted fabrics',
          children: [
            { name: 'Cotton Fabric', level: 2, path: 'textiles/fabrics/cotton', description: 'Cotton woven fabrics' },
            { name: 'Denim', level: 2, path: 'textiles/fabrics/denim', description: 'Denim fabrics' }
          ]
        }
      ]
    },
    {
      name: 'Apparel',
      level: 0,
      path: 'apparel',
      description: 'Clothing and apparel items',
      children: [
        {
          name: 'Men\'s Clothing',
          level: 1,
          path: 'apparel/mens',
          description: 'Men\'s clothing items',
          children: [
            { name: 'T-Shirts', level: 2, path: 'apparel/mens/tshirts', description: 'Men\'s t-shirts' },
            { name: 'Shirts', level: 2, path: 'apparel/mens/shirts', description: 'Men\'s dress shirts' }
          ]
        },
        {
          name: 'Women\'s Clothing',
          level: 1,
          path: 'apparel/womens',
          description: 'Women\'s clothing items',
          children: [
            { name: 'Dresses', level: 2, path: 'apparel/womens/dresses', description: 'Women\'s dresses' },
            { name: 'Blouses', level: 2, path: 'apparel/womens/blouses', description: 'Women\'s blouses' }
          ]
        }
      ]
    }
  ],

  // Users with different roles
  users: [
    // Admin users
    {
      email: 'admin@stockent.com',
      password: 'AdminPass123!',
      role: 'ADMIN',
      companyName: 'StockENT Administration',
      contactPerson: 'System Administrator',
      phone: '+1-555-0000',
      country: 'United States'
    },
    // Seller users
    {
      email: 'premium.fabrics@example.com',
      password: 'SellerPass123!',
      role: 'SELLER',
      companyName: 'Premium Fabrics Co',
      contactPerson: 'Ahmed Hassan',
      phone: '+90-555-0201',
      country: 'Turkey'
    },
    {
      email: 'cotton.masters@example.com',
      password: 'SellerPass123!',
      role: 'SELLER',
      companyName: 'Cotton Masters Ltd',
      contactPerson: 'Priya Sharma',
      phone: '+91-555-0202',
      country: 'India'
    },
    {
      email: 'silk.more@example.com',
      password: 'SellerPass123!',
      role: 'SELLER',
      companyName: 'Silk & More Inc',
      contactPerson: 'Marco Rossi',
      phone: '+39-555-0203',
      country: 'Italy'
    },
    {
      email: 'global.textiles@example.com',
      password: 'SellerPass123!',
      role: 'SELLER',
      companyName: 'Global Textiles',
      contactPerson: 'Anna Schmidt',
      phone: '+49-555-0204',
      country: 'Germany'
    },
    {
      email: 'fabric.excellence@example.com',
      password: 'SellerPass123!',
      role: 'SELLER',
      companyName: 'Fabric Excellence',
      contactPerson: 'James Wilson',
      phone: '+44-555-0205',
      country: 'United Kingdom'
    },
    // Buyer users
    {
      email: 'fashion.forward@example.com',
      password: 'BuyerPass123!',
      role: 'BUYER',
      companyName: 'Fashion Forward Ltd',
      contactPerson: 'Sarah Johnson',
      phone: '+1-555-0101',
      country: 'United States'
    },
    {
      email: 'style.solutions@example.com',
      password: 'BuyerPass123!',
      role: 'BUYER',
      companyName: 'Style Solutions Inc',
      contactPerson: 'Michael Chen',
      phone: '+1-555-0102',
      country: 'Canada'
    },
    {
      email: 'trendy.textiles@example.com',
      password: 'BuyerPass123!',
      role: 'BUYER',
      companyName: 'Trendy Textiles Co',
      contactPerson: 'Emily Rodriguez',
      phone: '+52-555-0103',
      country: 'Mexico'
    },
    {
      email: 'fabric.world@example.com',
      password: 'BuyerPass123!',
      role: 'BUYER',
      companyName: 'Fabric World Ltd',
      contactPerson: 'David Kim',
      phone: '+82-555-0104',
      country: 'South Korea'
    },
    {
      email: 'textile.traders@example.com',
      password: 'BuyerPass123!',
      role: 'BUYER',
      companyName: 'Textile Traders',
      contactPerson: 'Lisa Wang',
      phone: '+86-555-0105',
      country: 'China'
    }
  ],

  // Product specifications and data
  products: [
    {
      title: 'Premium Organic Cotton Fiber',
      description: 'High-quality organic cotton fiber, perfect for sustainable textile production. Grown without harmful pesticides and chemicals.',
      quantityAvailable: 5000,
      unit: 'kg',
      minOrderQuantity: 100,
      basePrice: 3.50,
      currency: 'USD',
      location: 'Mersin, Turkey',
      city: 'Mersin',
      state: 'Mersin Province',
      country: 'Turkey',
      listingType: 'FIXED_PRICE',
      tags: ['organic', 'cotton', 'sustainable', 'premium'],
      categoryPath: 'textiles/natural-fibers/cotton',
      sellerEmail: 'premium.fabrics@example.com',
      specifications: [
        { specName: 'Fiber Length', specValue: '28-32mm', unit: 'mm' },
        { specName: 'Micronaire', specValue: '3.5-4.5', unit: '' },
        { specName: 'Strength', specValue: '28-32', unit: 'g/tex' },
        { specName: 'Color Grade', specValue: 'Middling Plus', unit: '' }
      ]
    },
    {
      title: 'Mulberry Silk Yarn 20/22 Denier',
      description: 'Premium mulberry silk yarn in 20/22 denier. Perfect for luxury fabric production and high-end garments.',
      quantityAvailable: 200,
      unit: 'kg',
      minOrderQuantity: 10,
      basePrice: 45.00,
      currency: 'USD',
      location: 'Como, Italy',
      city: 'Como',
      state: 'Lombardy',
      country: 'Italy',
      listingType: 'AUCTION',
      tags: ['silk', 'luxury', 'mulberry', 'premium'],
      categoryPath: 'textiles/natural-fibers/silk',
      sellerEmail: 'silk.more@example.com',
      specifications: [
        { specName: 'Denier', specValue: '20/22', unit: 'denier' },
        { specName: 'Color', specValue: 'Natural White', unit: '' },
        { specName: 'Origin', specValue: 'Italian Mulberry', unit: '' },
        { specName: 'Grade', specValue: 'A+', unit: '' }
      ]
    },
    {
      title: 'Merino Wool Fiber',
      description: 'Fine merino wool fiber from Australian sheep. Excellent for premium knitwear and winter garments.',
      quantityAvailable: 1000,
      unit: 'kg',
      minOrderQuantity: 50,
      basePrice: 12.00,
      currency: 'USD',
      location: 'Sydney, Australia',
      city: 'Sydney',
      state: 'New South Wales',
      country: 'Australia',
      listingType: 'FIXED_PRICE',
      tags: ['wool', 'merino', 'premium', 'winter'],
      categoryPath: 'textiles/natural-fibers/wool',
      sellerEmail: 'global.textiles@example.com',
      specifications: [
        { specName: 'Micron Count', specValue: '18.5', unit: 'microns' },
        { specName: 'Staple Length', specValue: '75-85mm', unit: 'mm' },
        { specName: 'Color', specValue: 'Natural White', unit: '' },
        { specName: 'Origin', specValue: 'Australian Merino', unit: '' }
      ]
    },
    {
      title: 'Polyester DTY Yarn 150D/144F',
      description: 'High-quality polyester draw-textured yarn. Perfect for sportswear and activewear applications.',
      quantityAvailable: 3000,
      unit: 'kg',
      minOrderQuantity: 200,
      basePrice: 2.80,
      currency: 'USD',
      location: 'Mumbai, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      listingType: 'NEGOTIABLE',
      tags: ['polyester', 'DTY', 'sportswear', 'activewear'],
      categoryPath: 'textiles/synthetic-fibers/polyester',
      sellerEmail: 'cotton.masters@example.com',
      specifications: [
        { specName: 'Denier', specValue: '150D', unit: 'denier' },
        { specName: 'Filament Count', specValue: '144F', unit: 'filaments' },
        { specName: 'Color', specValue: 'Dope Dyed Black', unit: '' },
        { specName: 'Tenacity', specValue: '4.5', unit: 'g/denier' }
      ]
    },
    {
      title: 'Cotton Poplin Fabric',
      description: 'Premium cotton poplin fabric, perfect for shirts and blouses. 100% cotton with excellent drape and feel.',
      quantityAvailable: 500,
      unit: 'meters',
      minOrderQuantity: 100,
      basePrice: 8.50,
      currency: 'USD',
      location: 'Lahore, Pakistan',
      city: 'Lahore',
      state: 'Punjab',
      country: 'Pakistan',
      listingType: 'FIXED_PRICE',
      tags: ['cotton', 'poplin', 'shirt', 'premium'],
      categoryPath: 'textiles/fabrics/cotton',
      sellerEmail: 'fabric.excellence@example.com',
      specifications: [
        { specName: 'Composition', specValue: '100% Cotton', unit: '' },
        { specName: 'Weight', specValue: '140', unit: 'gsm' },
        { specName: 'Width', specValue: '150', unit: 'cm' },
        { specName: 'Finish', specValue: 'Mercerized', unit: '' }
      ]
    },
    {
      title: 'Denim Fabric 14oz',
      description: 'Heavyweight 14oz denim fabric for jeans production. Excellent quality with good stretch and recovery.',
      quantityAvailable: 800,
      unit: 'meters',
      minOrderQuantity: 200,
      basePrice: 12.00,
      currency: 'USD',
      location: 'Dhaka, Bangladesh',
      city: 'Dhaka',
      state: 'Dhaka Division',
      country: 'Bangladesh',
      listingType: 'AUCTION',
      tags: ['denim', 'jeans', 'heavyweight', 'stretch'],
      categoryPath: 'textiles/fabrics/denim',
      sellerEmail: 'premium.fabrics@example.com',
      specifications: [
        { specName: 'Weight', specValue: '14', unit: 'oz' },
        { specName: 'Composition', specValue: '98% Cotton, 2% Elastane', unit: '' },
        { specName: 'Width', specValue: '150', unit: 'cm' },
        { specName: 'Stretch', specValue: '2-way', unit: '' }
      ]
    }
  ]
};

// Helper function to create category hierarchy
async function createCategories(categories, parentId = null) {
  const createdCategories = [];
  
  for (const categoryData of categories) {
    const category = await prisma.category.create({
      data: {
        name: categoryData.name,
        parentId: parentId,
        level: categoryData.level,
        path: categoryData.path,
        description: categoryData.description,
        isActive: true
      }
    });
    
    createdCategories.push(category);
    
    // Create children if they exist
    if (categoryData.children) {
      const childCategories = await createCategories(categoryData.children, category.id);
      createdCategories.push(...childCategories);
    }
  }
  
  return createdCategories;
}

// Helper function to get category by path
async function getCategoryByPath(path) {
  return await prisma.category.findFirst({
    where: { path: path }
  });
}

// Helper function to create users
async function createUsers() {
  console.log('👥 Creating test users...');
  
  const createdUsers = [];
  const skippedUsers = [];
  
  for (const userData of testData.users) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existingUser) {
        skippedUsers.push(userData.email);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash: hashedPassword,
          role: userData.role,
          companyName: userData.companyName,
          contactPerson: userData.contactPerson,
          phone: userData.phone,
          country: userData.country,
          verificationStatus: 'VERIFIED',
          isActive: true,
          isFirstLogin: false
        }
      });
      
      createdUsers.push(user);
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
  }
  
  console.log(`✅ Created: ${createdUsers.length} users`);
  console.log(`⏭️  Skipped: ${skippedUsers.length} users (already exist)`);
  
  return createdUsers;
}

// Helper function to create products
async function createProducts() {
  console.log('🛍️ Creating test products...');
  
  const createdProducts = [];
  const skippedProducts = [];
  
  for (const productData of testData.products) {
    try {
      // Get seller user
      const seller = await prisma.user.findUnique({
        where: { email: productData.sellerEmail }
      });
      
      if (!seller) {
        console.warn(`⚠️  Seller not found: ${productData.sellerEmail}`);
        continue;
      }
      
      // Get category
      const category = await getCategoryByPath(productData.categoryPath);
      if (!category) {
        console.warn(`⚠️  Category not found: ${productData.categoryPath}`);
        continue;
      }
      
      const product = await prisma.product.create({
        data: {
          sellerId: seller.id,
          categoryId: category.id,
          title: productData.title,
          description: productData.description,
          quantityAvailable: productData.quantityAvailable,
          unit: productData.unit,
          minOrderQuantity: productData.minOrderQuantity,
          basePrice: productData.basePrice,
          currency: productData.currency,
          location: productData.location,
          city: productData.city,
          state: productData.state,
          country: productData.country,
          status: 'ACTIVE',
          listingType: productData.listingType,
          tags: productData.tags
        }
      });
      
      // Create product specifications
      if (productData.specifications) {
        for (const spec of productData.specifications) {
          await prisma.productSpecification.create({
            data: {
              productId: product.id,
              specName: spec.specName,
              specValue: spec.specValue,
              unit: spec.unit || null
            }
          });
        }
      }
      
      // Create sample product images (using placeholder)
      const imageUrl = '/uploads/products/placeholder-product.jpg';
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: imageUrl,
          alt: productData.title,
          isPrimary: true,
          orderIndex: 0
        }
      });
      
      createdProducts.push(product);
    } catch (error) {
      console.error(`❌ Error creating product ${productData.title}:`, error.message);
      skippedProducts.push(productData.title);
    }
  }
  
  console.log(`✅ Created: ${createdProducts.length} products`);
  console.log(`⏭️  Skipped: ${skippedProducts.length} products`);
  
  return createdProducts;
}

// Helper function to create auctions
async function createAuctions() {
  console.log('🎯 Creating test auctions...');
  
  const createdAuctions = [];
  
  // Get products with AUCTION listing type
  const auctionProducts = await prisma.product.findMany({
    where: { listingType: 'AUCTION' },
    include: { seller: true }
  });
  
  for (const product of auctionProducts) {
    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + Math.random() * 24 * 60 * 60 * 1000); // Random start within 24 hours
      const endTime = new Date(startTime.getTime() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000); // 2-7 days duration
      
      const auction = await prisma.auction.create({
        data: {
          productId: product.id,
          auctionType: 'ENGLISH',
          startingPrice: product.basePrice * 0.8, // Start at 80% of base price
          reservePrice: product.basePrice * 1.1,  // Reserve at 110% of base price
          bidIncrement: Math.max(0.5, product.basePrice * 0.05),
          startTime: startTime,
          endTime: endTime,
          status: startTime > now ? 'SCHEDULED' : 'ACTIVE',
          bidCount: 0
        }
      });
      
      createdAuctions.push(auction);
    } catch (error) {
      console.error(`❌ Error creating auction for product ${product.id}:`, error.message);
    }
  }
  
  console.log(`✅ Created: ${createdAuctions.length} auctions`);
  return createdAuctions;
}

// Helper function to create conversations and messages
async function createConversationsAndMessages() {
  console.log('💬 Creating test conversations and messages...');
  
  const createdConversations = [];
  const createdMessages = [];
  
  // Get buyers and sellers
  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' }
  });
  
  const sellers = await prisma.user.findMany({
    where: { role: 'SELLER' }
  });
  
  // Get some products
  const products = await prisma.product.findMany({
    take: 5,
    include: { seller: true }
  });
  
  if (buyers.length === 0 || sellers.length === 0 || products.length === 0) {
    console.log('⚠️  Not enough users or products to create conversations');
    return { createdConversations, createdMessages };
  }
  
  // Create conversations between buyers and sellers for different products
  for (let i = 0; i < Math.min(8, products.length * 2); i++) {
    try {
      const product = products[i % products.length];
      const buyer = buyers[i % buyers.length];
      const seller = product.seller;
      
      // Skip if buyer and seller are the same user
      if (buyer.id === seller.id) continue;
      
      const conversation = await prisma.conversation.create({
        data: {
          productId: product.id,
          buyerId: buyer.id,
          sellerId: seller.id,
          buyerAlias: buyer.companyName || buyer.contactPerson || 'Buyer',
          sellerAlias: seller.companyName || seller.contactPerson || 'Seller',
          status: 'ACTIVE'
        }
      });
      
      createdConversations.push(conversation);
      
      // Create some sample messages
      const messageTemplates = [
        { content: `Hi, I'm interested in your ${product.title}. Can you tell me more about the specifications?`, senderIsBuyer: true },
        { content: `Hello! Thank you for your interest. The product details are available in the specifications. Do you have any specific requirements?`, senderIsBuyer: false },
        { content: `Yes, I need a sample first. What's the minimum order quantity and can you provide samples?`, senderIsBuyer: true },
        { content: `We can provide samples for $50 including shipping. The minimum order quantity is ${product.minOrderQuantity} ${product.unit}.`, senderIsBuyer: false },
        { content: `That sounds good. What's your best price for 500 ${product.unit}?`, senderIsBuyer: true }
      ];
      
      // Create 2-4 messages per conversation
      const messageCount = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < messageCount; j++) {
        const template = messageTemplates[j % messageTemplates.length];
        
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: template.senderIsBuyer ? buyer.id : seller.id,
            receiverId: template.senderIsBuyer ? seller.id : buyer.id,
            content: template.content,
            messageType: 'TEXT',
            attachments: [],
            isEncrypted: false,
            createdAt: new Date(Date.now() - (messageCount - j) * 60 * 60 * 1000) // Messages spread over hours
          }
        });
        
        createdMessages.push({ conversationId: conversation.id, content: template.content });
      }
      
    } catch (error) {
      console.error(`❌ Error creating conversation ${i}:`, error.message);
    }
  }
  
  console.log(`✅ Created: ${createdConversations.length} conversations`);
  console.log(`✅ Created: ${createdMessages.length} messages`);
  
  return { createdConversations, createdMessages };
}

// Helper function to create sample bids for auctions
async function createBids() {
  console.log('💰 Creating test bids...');
  
  const createdBids = [];
  
  // Get active auctions
  const auctions = await prisma.auction.findMany({
    where: { status: 'ACTIVE' },
    include: { product: true }
  });
  
  // Get buyers
  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' }
  });
  
  if (auctions.length === 0 || buyers.length === 0) {
    console.log('⚠️  No active auctions or buyers to create bids');
    return createdBids;
  }
  
  for (const auction of auctions) {
    try {
      // Create 2-4 bids per auction from different buyers
      const bidCount = 2 + Math.floor(Math.random() * 3);
      let currentBidAmount = auction.startingPrice;
      
      for (let i = 0; i < bidCount; i++) {
        const bidder = buyers[i % buyers.length];
        currentBidAmount += auction.bidIncrement + (Math.random() * auction.bidIncrement);
        
        const bid = await prisma.bid.create({
          data: {
            auctionId: auction.id,
            bidderId: bidder.id,
            amount: Math.round(currentBidAmount * 100) / 100,
            isAutomatic: Math.random() > 0.7, // 30% chance of automatic bid
            maxBid: Math.random() > 0.7 ? Math.round((currentBidAmount * 1.5) * 100) / 100 : null,
            status: i === bidCount - 1 ? 'WINNING' : 'OUTBID'
          }
        });
        
        createdBids.push(bid);
      }
      
      // Update auction with current bid
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          currentBid: currentBidAmount,
          bidCount: bidCount
        }
      });
      
    } catch (error) {
      console.error(`❌ Error creating bids for auction ${auction.id}:`, error.message);
    }
  }
  
  console.log(`✅ Created: ${createdBids.length} bids`);
  return createdBids;
}

// Helper function to create watchlist items
async function createWatchlistItems() {
  console.log('👀 Creating test watchlist items...');
  
  const createdItems = [];
  
  // Get buyers and random products
  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' }
  });
  
  const products = await prisma.product.findMany({
    take: 10
  });
  
  if (buyers.length === 0 || products.length === 0) {
    console.log('⚠️  No buyers or products to create watchlist items');
    return createdItems;
  }
  
  for (const buyer of buyers) {
    try {
      // Add 2-4 random products to each buyer's watchlist
      const itemCount = 2 + Math.floor(Math.random() * 3);
      const shuffledProducts = products.sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < Math.min(itemCount, shuffledProducts.length); i++) {
        const product = shuffledProducts[i];
        
        const watchlistItem = await prisma.watchlistItem.create({
          data: {
            userId: buyer.id,
            productId: product.id
          }
        });
        
        createdItems.push(watchlistItem);
      }
      
    } catch (error) {
      console.error(`❌ Error creating watchlist items for buyer ${buyer.id}:`, error.message);
    }
  }
  
  console.log(`✅ Created: ${createdItems.length} watchlist items`);
  return createdItems;
}

// Helper function to create sample requests
async function createSampleRequests() {
  console.log('📦 Creating test sample requests...');
  
  const createdRequests = [];
  
  // Get buyers and products from sellers
  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER' }
  });
  
  const products = await prisma.product.findMany({
    where: { seller: { role: 'SELLER' } },
    include: { seller: true },
    take: 5
  });
  
  if (buyers.length === 0 || products.length === 0) {
    console.log('⚠️  No buyers or seller products to create sample requests');
    return createdRequests;
  }
  
  for (let i = 0; i < Math.min(5, products.length); i++) {
    try {
      const product = products[i];
      const buyer = buyers[i % buyers.length];
      
      const sampleRequest = await prisma.sampleRequest.create({
        data: {
          productId: product.id,
          buyerId: buyer.id,
          sellerId: product.seller.id,
          quantityRequested: Math.min(1, product.minOrderQuantity * 0.1),
          shippingAddress: {
            street: '123 Business Street',
            city: 'Business City',
            state: 'Business State',
            postalCode: '12345',
            country: buyer.country || 'United States'
          },
          status: ['PENDING', 'APPROVED', 'SHIPPED'][Math.floor(Math.random() * 3)],
          sampleCost: 25.00 + Math.random() * 25,
          shippingCost: 10.00 + Math.random() * 15,
          trackingNumber: Math.random() > 0.5 ? `TRK${Date.now()}${i}` : null
        }
      });
      
      createdRequests.push(sampleRequest);
      
    } catch (error) {
      console.error(`❌ Error creating sample request ${i}:`, error.message);
    }
  }
  
  console.log(`✅ Created: ${createdRequests.length} sample requests`);
  return createdRequests;
}

// Helper function to show comprehensive summary
async function showComprehensiveSummary() {
  console.log('\n📊 Comprehensive Database Summary:');
  
  // User counts
  const userCount = await prisma.user.count();
  const buyerCount = await prisma.user.count({ where: { role: 'BUYER' } });
  const sellerCount = await prisma.user.count({ where: { role: 'SELLER' } });
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  
  // Category counts
  const categoryCount = await prisma.category.count();
  
  // Product counts
  const productCount = await prisma.product.count();
  const activeProductCount = await prisma.product.count({ where: { status: 'ACTIVE' } });
  const auctionProductCount = await prisma.product.count({ where: { listingType: 'AUCTION' } });
  
  // Auction counts
  const auctionCount = await prisma.auction.count();
  const activeAuctionCount = await prisma.auction.count({ where: { status: 'ACTIVE' } });
  
  // Bid counts
  const bidCount = await prisma.bid.count();
  
  // Conversation and message counts
  const conversationCount = await prisma.conversation.count();
  const messageCount = await prisma.message.count();
  
  // Other counts
  const watchlistCount = await prisma.watchlistItem.count();
  const sampleRequestCount = await prisma.sampleRequest.count();
  
  console.log(`👥 Total Users: ${userCount} (${buyerCount} buyers, ${sellerCount} sellers, ${adminCount} admins)`);
  console.log(`📂 Categories: ${categoryCount}`);
  console.log(`🛍️  Products: ${productCount} (${activeProductCount} active, ${auctionProductCount} auctions)`);
  console.log(`🎯 Auctions: ${auctionCount} (${activeAuctionCount} active)`);
  console.log(`💰 Bids: ${bidCount}`);
  console.log(`💬 Conversations: ${conversationCount}`);
  console.log(`📨 Messages: ${messageCount}`);
  console.log(`👀 Watchlist Items: ${watchlistCount}`);
  console.log(`📦 Sample Requests: ${sampleRequestCount}`);
  
  // Show sample data
  console.log('\n📋 Sample Users:');
  const sampleUsers = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      companyName: true,
      contactPerson: true,
      country: true
    },
    take: 5
  });
  
  sampleUsers.forEach(user => {
    console.log(`  - ${user.email} (${user.role}): ${user.companyName} - ${user.contactPerson} (${user.country})`);
  });
  
  console.log('\n🛍️  Sample Products:');
  const sampleProducts = await prisma.product.findMany({
    select: {
      title: true,
      basePrice: true,
      currency: true,
      listingType: true,
      seller: {
        select: {
          companyName: true,
          country: true
        }
      }
    },
    take: 5
  });
  
  sampleProducts.forEach(product => {
    console.log(`  - ${product.title}: ${product.basePrice} ${product.currency} (${product.listingType}) - ${product.seller.companyName} (${product.seller.country})`);
  });
  
  console.log('\n🎯 Sample Auctions:');
  const sampleAuctions = await prisma.auction.findMany({
    select: {
      startingPrice: true,
      currentBid: true,
      status: true,
      bidCount: true,
      product: {
        select: {
          title: true
        }
      }
    },
    take: 3
  });
  
  sampleAuctions.forEach(auction => {
    console.log(`  - ${auction.product.title}: ${auction.startingPrice} → ${auction.currentBid || 'No bids'} (${auction.bidCount} bids, ${auction.status})`);
  });
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting StockENT Comprehensive Test Data Setup...\n');
    
    // Step 1: Create categories
    console.log('📂 Creating categories...');
    const categories = await createCategories(testData.categories);
    console.log(`✅ Created ${categories.length} categories\n`);
    
    // Step 2: Create users
    const users = await createUsers();
    console.log('');
    
    // Step 3: Create products
    const products = await createProducts();
    console.log('');
    
    // Step 4: Create auctions
    const auctions = await createAuctions();
    console.log('');
    
    // Step 5: Create conversations and messages
    const { createdConversations, createdMessages } = await createConversationsAndMessages();
    console.log('');
    
    // Step 6: Create bids
    const bids = await createBids();
    console.log('');
    
    // Step 7: Create watchlist items
    const watchlistItems = await createWatchlistItems();
    console.log('');
    
    // Step 8: Create sample requests
    const sampleRequests = await createSampleRequests();
    console.log('');
    
    // Step 9: Show comprehensive summary
    await showComprehensiveSummary();
    
    console.log('\n🎉 Comprehensive test data setup completed successfully!');
    console.log(`\nSummary:`);
    console.log(`- Categories: ${categories.length}`);
    console.log(`- Users: ${users.length}`);
    console.log(`- Products: ${products.length}`);
    console.log(`- Auctions: ${auctions.length}`);
    console.log(`- Conversations: ${createdConversations.length}`);
    console.log(`- Messages: ${createdMessages.length}`);
    console.log(`- Bids: ${bids.length}`);
    console.log(`- Watchlist Items: ${watchlistItems.length}`);
    console.log(`- Sample Requests: ${sampleRequests.length}`);
    
  } catch (error) {
    console.error('❌ Error during comprehensive test data setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Comprehensive test data script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Comprehensive test data script failed:', error);
    process.exit(1);
  });
