const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create categories
  console.log('📁 Creating categories...');
  
  const rawMaterials = await prisma.category.create({
    data: {
      name: 'Raw Materials',
      level: 1,
      path: '/raw-materials',
      description: 'Raw textile materials and fibers',
    },
  });

  const fibers = await prisma.category.create({
    data: {
      name: 'Fibers',
      parentId: rawMaterials.id,
      level: 2,
      path: '/raw-materials/fibers',
      description: 'Natural and synthetic fibers',
    },
  });

  const yarns = await prisma.category.create({
    data: {
      name: 'Yarns',
      parentId: rawMaterials.id,
      level: 2,
      path: '/raw-materials/yarns',
      description: 'Spun yarns and threads',
    },
  });

  const fabrics = await prisma.category.create({
    data: {
      name: 'Fabrics',
      parentId: rawMaterials.id,
      level: 2,
      path: '/raw-materials/fabrics',
      description: 'Woven and knitted fabrics',
    },
  });

  // Create subcategories
  const cottonFiber = await prisma.category.create({
    data: {
      name: 'Cotton Fiber',
      parentId: fibers.id,
      level: 3,
      path: '/raw-materials/fibers/cotton',
      description: 'Cotton fiber and cotton waste',
    },
  });

  const polyesterFiber = await prisma.category.create({
    data: {
      name: 'Polyester Fiber',
      parentId: fibers.id,
      level: 3,
      path: '/raw-materials/fibers/polyester',
      description: 'Polyester fiber and polyester waste',
    },
  });

  const cottonYarn = await prisma.category.create({
    data: {
      name: 'Cotton Yarn',
      parentId: yarns.id,
      level: 3,
      path: '/raw-materials/yarns/cotton',
      description: 'Cotton yarns of various counts',
    },
  });

  const polyesterYarn = await prisma.category.create({
    data: {
      name: 'Polyester Yarn',
      parentId: yarns.id,
      level: 3,
      path: '/raw-materials/yarns/polyester',
      description: 'Polyester yarns of various counts',
    },
  });

  const cottonFabric = await prisma.category.create({
    data: {
      name: 'Cotton Fabric',
      parentId: fabrics.id,
      level: 3,
      path: '/raw-materials/fabrics/cotton',
      description: 'Cotton woven and knitted fabrics',
    },
  });

  const polyesterFabric = await prisma.category.create({
    data: {
      name: 'Polyester Fabric',
      parentId: fabrics.id,
      level: 3,
      path: '/raw-materials/fabrics/polyester',
      description: 'Polyester woven and knitted fabrics',
    },
  });

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPasswordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123456', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@stockent.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@stockent.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      companyName: 'StockENT Admin',
      contactPerson: 'Admin User',
      phone: '+1-555-0123',
      country: 'United States',
      verificationStatus: 'VERIFIED',
    },
  });

  await prisma.companyProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      businessLicense: 'ADMIN-LICENSE-001',
      taxId: 'ADMIN-TAX-001',
      address: '123 Admin Street',
      city: 'Admin City',
      state: 'Admin State',
      postalCode: '12345',
      website: 'https://stockent.com',
      description: 'StockENT Platform Administrator',
      certifications: ['ISO-9001', 'ISO-14001'],
    },
  });

  // Create sample seller user
  console.log('🏭 Creating sample seller user...');
  const sellerPasswordHash = await bcrypt.hash('seller123456', 12);
  
  const sellerUser = await prisma.user.upsert({
    where: { email: 'seller@textilemill.com' },
    update: {},
    create: {
      email: 'seller@textilemill.com',
      passwordHash: sellerPasswordHash,
      role: 'SELLER',
      companyName: 'Global Textile Mills Ltd',
      contactPerson: 'John Smith',
      phone: '+1-555-0456',
      country: 'India',
      verificationStatus: 'VERIFIED',
    },
  });

  await prisma.companyProfile.upsert({
    where: { userId: sellerUser.id },
    update: {},
    create: {
      userId: sellerUser.id,
      businessLicense: 'GTM-LICENSE-001',
      taxId: 'GTM-TAX-001',
      address: '456 Mill Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      website: 'https://globaltextilemills.com',
      description: 'Leading textile manufacturer specializing in cotton and polyester products',
      certifications: ['ISO-9001', 'OEKO-TEX', 'GOTS'],
    },
  });

  // Create sample buyer user
  console.log('🏪 Creating sample buyer user...');
  const buyerPasswordHash = await bcrypt.hash('buyer123456', 12);
  
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@garmentfactory.com' },
    update: {},
    create: {
      email: 'buyer@garmentfactory.com',
      passwordHash: buyerPasswordHash,
      role: 'BUYER',
      companyName: 'Premium Garments Co',
      contactPerson: 'Sarah Johnson',
      phone: '+1-555-0789',
      country: 'United States',
      verificationStatus: 'VERIFIED',
    },
  });

  await prisma.companyProfile.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: {
      userId: buyerUser.id,
      businessLicense: 'PGC-LICENSE-001',
      taxId: 'PGC-TAX-001',
      address: '789 Factory Lane',
      city: 'Los Angeles',
      state: 'California',
      postalCode: '90001',
      website: 'https://premiumgarments.com',
      description: 'Premium garment manufacturer seeking quality textile materials',
      certifications: ['ISO-9001', 'WRAP', 'BSCI'],
    },
  });

  // Create sample products
  console.log('📦 Creating sample products...');
  
  const product1 = await prisma.product.create({
    data: {
      sellerId: sellerUser.id,
      categoryId: cottonFiber.id,
      title: 'Premium Cotton Fiber - Grade A',
      description: 'High-quality cotton fiber suitable for premium textile production. Clean, well-processed, and ready for spinning.',
      tags: ['cotton', 'fiber', 'premium', 'grade-a'],
      quantityAvailable: 1000,
      unit: 'kg',
      minOrderQuantity: 100,
      basePrice: 2.50,
      currency: 'USD',
      location: 'Mumbai, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      status: 'ACTIVE',
      listingType: 'FIXED_PRICE',
    },
  });

  const product2 = await prisma.product.create({
    data: {
      sellerId: sellerUser.id,
      categoryId: polyesterYarn.id,
      title: 'Polyester Yarn 150D/144F',
      description: 'High-tenacity polyester yarn perfect for industrial applications. Excellent strength and durability.',
      tags: ['polyester', 'yarn', 'industrial', '150D'],
      quantityAvailable: 500,
      unit: 'kg',
      minOrderQuantity: 50,
      basePrice: 3.20,
      currency: 'USD',
      location: 'Mumbai, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      status: 'ACTIVE',
      listingType: 'AUCTION',
    },
  });

  const product3 = await prisma.product.create({
    data: {
      sellerId: sellerUser.id,
      categoryId: cottonFabric.id,
      title: 'Cotton Poplin Fabric - White',
      description: 'Premium cotton poplin fabric, perfect for shirts and blouses. Soft, breathable, and easy to care for.',
      tags: ['cotton', 'fabric', 'poplin', 'white'],
      quantityAvailable: 2000,
      unit: 'meters',
      minOrderQuantity: 100,
      basePrice: 4.50,
      currency: 'USD',
      location: 'Mumbai, India',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      status: 'ACTIVE',
      listingType: 'NEGOTIABLE',
    },
  });

  // Create product images
  await prisma.productImage.createMany({
    data: [
      {
        productId: product1.id,
        imageUrl: '/uploads/sample-cotton-fiber-1.jpg',
        isPrimary: true,
        orderIndex: 1,
      },
      {
        productId: product1.id,
        imageUrl: '/uploads/sample-cotton-fiber-2.jpg',
        isPrimary: false,
        orderIndex: 2,
      },
      {
        productId: product2.id,
        imageUrl: '/uploads/sample-polyester-yarn-1.jpg',
        isPrimary: true,
        orderIndex: 1,
      },
      {
        productId: product3.id,
        imageUrl: '/uploads/sample-cotton-fabric-1.jpg',
        isPrimary: true,
        orderIndex: 1,
      },
    ],
  });

  // Create product specifications
  await prisma.productSpecification.createMany({
    data: [
      {
        productId: product1.id,
        specName: 'Grade',
        specValue: 'A',
      },
      {
        productId: product1.id,
        specName: 'Staple Length',
        specValue: '28-30mm',
        unit: 'mm',
      },
      {
        productId: product1.id,
        specName: 'Micronaire',
        specValue: '3.8-4.2',
      },
      {
        productId: product2.id,
        specName: 'Denier',
        specValue: '150D',
      },
      {
        productId: product2.id,
        specName: 'Filament Count',
        specValue: '144F',
      },
      {
        productId: product3.id,
        specName: 'Composition',
        specValue: '100% Cotton',
      },
      {
        productId: product3.id,
        specName: 'Weight',
        specValue: '120',
        unit: 'GSM',
      },
    ],
  });

  // Create sample auction
  console.log('🔨 Creating sample auction...');
  const auction = await prisma.auction.create({
    data: {
      productId: product2.id,
      auctionType: 'ENGLISH',
      startingPrice: 3.00,
      reservePrice: 2.80,
      currentBid: 3.00,
      bidIncrement: 0.10,
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
      status: 'ACTIVE',
    },
  });

  // Create sample bids
  await prisma.bid.createMany({
    data: [
      {
        auctionId: auction.id,
        bidderId: buyerUser.id,
        amount: 3.00,
        isAutomatic: false,
      },
      {
        auctionId: auction.id,
        bidderId: adminUser.id,
        amount: 3.10,
        isAutomatic: false,
      },
    ],
  });

  // Create sample conversation
  console.log('💬 Creating sample conversation...');
  const conversation = await prisma.conversation.create({
    data: {
      productId: product1.id,
      buyerId: buyerUser.id,
      sellerId: sellerUser.id,
      buyerAlias: 'Buyer_001',
      sellerAlias: 'Global_Textile_Mills',
      status: 'ACTIVE',
    },
  });

  // Create sample messages
  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: buyerUser.id,
        receiverId: sellerUser.id,
        content: 'Hi, I\'m interested in your cotton fiber. Can you provide more details about the quality?',
        messageType: 'TEXT',
      },
      {
        conversationId: conversation.id,
        senderId: sellerUser.id,
        receiverId: buyerUser.id,
        content: 'Hello! Yes, this is Grade A cotton fiber with excellent quality. I can provide quality certificates if needed.',
        messageType: 'TEXT',
      },
      {
        conversationId: conversation.id,
        senderId: buyerUser.id,
        receiverId: sellerUser.id,
        content: 'That sounds good. What\'s the minimum order quantity and can you arrange shipping to Los Angeles?',
        messageType: 'TEXT',
      },
    ],
  });

  // Create sample watchlist items
  await prisma.watchlistItem.createMany({
    data: [
      {
        userId: buyerUser.id,
        productId: product1.id,
      },
      {
        userId: buyerUser.id,
        productId: product3.id,
      },
    ],
  });

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: buyerUser.id,
        title: 'New Product Available',
        message: 'A new cotton fiber product has been listed that matches your search criteria.',
        type: 'SYSTEM',
      },
      {
        userId: sellerUser.id,
        title: 'New Message',
        message: 'You have received a new message about your cotton fiber listing.',
        type: 'MESSAGE_RECEIVED',
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - Categories: ${await prisma.category.count()}`);
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Products: ${await prisma.product.count()}`);
  console.log(`   - Auctions: ${await prisma.auction.count()}`);
  console.log(`   - Conversations: ${await prisma.conversation.count()}`);
  console.log(`   - Messages: ${await prisma.message.count()}`);
  console.log(`   - Notifications: ${await prisma.notification.count()}`);
  
  console.log('\n🔑 Test Accounts:');
  console.log('   Admin: admin@stockent.com / admin123456');
  console.log('   Seller: seller@textilemill.com / seller123456');
  console.log('   Buyer: buyer@garmentfactory.com / buyer123456');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
