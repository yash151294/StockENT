const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enhanceTestData() {
  try {
    console.log('🚀 Enhancing StockENT test data...\n');
    
    // Step 1: Make some auctions active and add bids
    console.log('🎯 Activating auctions and adding bids...');
    
    const auctions = await prisma.auction.findMany({
      where: { status: 'SCHEDULED' },
      include: { product: true }
    });
    
    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER' }
    });
    
    if (auctions.length > 0 && buyers.length > 0) {
      // Make the first auction active
      const auction = auctions[0];
      const now = new Date();
      const endTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          status: 'ACTIVE',
          startTime: new Date(now.getTime() - 60 * 60 * 1000), // Started 1 hour ago
          endTime: endTime
        }
      });
      
      console.log(`✅ Activated auction: ${auction.product.title}`);
      
      // Add bids to the active auction
      let currentBid = auction.startingPrice;
      const bidIncrement = auction.bidIncrement;
      
      for (let i = 0; i < Math.min(3, buyers.length); i++) {
        const buyer = buyers[i];
        currentBid += bidIncrement + (Math.random() * bidIncrement);
        
        const bid = await prisma.bid.create({
          data: {
            auctionId: auction.id,
            bidderId: buyer.id,
            amount: Math.round(currentBid * 100) / 100,
            isAutomatic: Math.random() > 0.7,
            status: i === 2 ? 'WINNING' : 'OUTBID'
          }
        });
        
        console.log(`✅ Added bid: ${buyer.companyName} - $${bid.amount}`);
      }
      
      // Update auction with current bid
      await prisma.auction.update({
        where: { id: auction.id },
        data: {
          currentBid: currentBid,
          bidCount: 3
        }
      });
      
      console.log(`✅ Updated auction current bid: $${currentBid}`);
    }
    
    // Step 2: Add more products from different sellers
    console.log('\n🛍️ Adding more test products...');
    
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' }
    });
    
    const categories = await prisma.category.findMany({
      where: { level: 2 } // Leaf categories
    });
    
    const additionalProducts = [
      {
        title: 'High-Quality Linen Fabric',
        description: 'Premium linen fabric perfect for summer clothing and home textiles. 100% natural flax fiber.',
        quantityAvailable: 300,
        unit: 'meters',
        minOrderQuantity: 50,
        basePrice: 15.00,
        currency: 'USD',
        location: 'Florence, Italy',
        city: 'Florence',
        state: 'Tuscany',
        country: 'Italy',
        listingType: 'FIXED_PRICE',
        tags: ['linen', 'natural', 'summer', 'premium'],
        categoryPath: 'textiles/natural-fibers',
        specifications: [
          { specName: 'Composition', specValue: '100% Linen', unit: '' },
          { specName: 'Weight', specValue: '180', unit: 'gsm' },
          { specName: 'Width', specValue: '140', unit: 'cm' },
          { specName: 'Finish', specValue: 'Natural', unit: '' }
        ]
      },
      {
        title: 'Bamboo Fiber Yarn',
        description: 'Eco-friendly bamboo fiber yarn with excellent moisture-wicking properties. Perfect for activewear.',
        quantityAvailable: 800,
        unit: 'kg',
        minOrderQuantity: 25,
        basePrice: 8.50,
        currency: 'USD',
        location: 'Shanghai, China',
        city: 'Shanghai',
        state: 'Shanghai',
        country: 'China',
        listingType: 'NEGOTIABLE',
        tags: ['bamboo', 'eco-friendly', 'moisture-wicking', 'activewear'],
        categoryPath: 'textiles/natural-fibers',
        specifications: [
          { specName: 'Fiber Type', specValue: 'Bamboo Viscose', unit: '' },
          { specName: 'Denier', specValue: '150D', unit: 'denier' },
          { specName: 'Color', specValue: 'Natural White', unit: '' },
          { specName: 'Antimicrobial', specValue: 'Yes', unit: '' }
        ]
      },
      {
        title: 'Recycled Polyester Fabric',
        description: 'Sustainable recycled polyester fabric made from plastic bottles. Perfect for eco-conscious brands.',
        quantityAvailable: 1000,
        unit: 'meters',
        minOrderQuantity: 100,
        basePrice: 6.50,
        currency: 'USD',
        location: 'Hamburg, Germany',
        city: 'Hamburg',
        state: 'Hamburg',
        country: 'Germany',
        listingType: 'AUCTION',
        tags: ['recycled', 'polyester', 'sustainable', 'eco-friendly'],
        categoryPath: 'textiles/synthetic-fibers/polyester',
        specifications: [
          { specName: 'Composition', specValue: '100% Recycled Polyester', unit: '' },
          { specName: 'Weight', specValue: '120', unit: 'gsm' },
          { specName: 'Width', specValue: '150', unit: 'cm' },
          { specName: 'Recycled Content', specValue: '100%', unit: '' }
        ]
      }
    ];
    
    for (let i = 0; i < additionalProducts.length; i++) {
      const productData = additionalProducts[i];
      const seller = sellers[i % sellers.length];
      
      // Find a suitable category
      const category = categories.find(cat => 
        productData.categoryPath.includes(cat.path.split('/').pop())
      ) || categories[0];
      
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
      
      // Create specifications
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
      
      // Create product image
      await prisma.productImage.create({
        data: {
          productId: product.id,
          imageUrl: '/uploads/products/placeholder-product.jpg',
          alt: productData.title,
          isPrimary: true,
          orderIndex: 0
        }
      });
      
      // If it's an auction product, create auction
      if (productData.listingType === 'AUCTION') {
        const now = new Date();
        const startTime = new Date(now.getTime() - 30 * 60 * 1000); // Started 30 minutes ago
        const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ends in 24 hours
        
        await prisma.auction.create({
          data: {
            productId: product.id,
            auctionType: 'ENGLISH',
            startingPrice: productData.basePrice * 0.8,
            reservePrice: productData.basePrice * 1.2,
            bidIncrement: Math.max(1, productData.basePrice * 0.1),
            startTime: startTime,
            endTime: endTime,
            status: 'ACTIVE',
            bidCount: 0
          }
        });
        
        console.log(`✅ Created auction product: ${productData.title}`);
      } else {
        console.log(`✅ Created product: ${productData.title}`);
      }
    }
    
    // Step 3: Add more conversations and messages
    console.log('\n💬 Adding more conversations...');
    
    const products = await prisma.product.findMany({
      include: { seller: true },
      take: 3
    });
    
    for (const product of products) {
      // Find a buyer who hasn't conversed with this seller yet
      const existingConversations = await prisma.conversation.findMany({
        where: {
          productId: product.id
        },
        select: { buyerId: true }
      });
      
      const existingBuyerIds = existingConversations.map(c => c.buyerId);
      const availableBuyers = buyers.filter(b => !existingBuyerIds.includes(b.id));
      
      if (availableBuyers.length > 0) {
        const buyer = availableBuyers[0];
        
        const conversation = await prisma.conversation.create({
          data: {
            productId: product.id,
            buyerId: buyer.id,
            sellerId: product.seller.id,
            buyerAlias: buyer.companyName || buyer.contactPerson || 'Buyer',
            sellerAlias: product.seller.companyName || product.seller.contactPerson || 'Seller',
            status: 'ACTIVE'
          }
        });
        
        // Add some messages
        const messages = [
          `Hi, I'm very interested in your ${product.title}. Can you provide more details about the quality?`,
          `Hello! Thank you for your interest. This is a premium quality product with excellent specifications. Would you like a sample?`,
          `Yes, I would love a sample. What's the process and cost for samples?`,
          `We can send you a sample for $25 including shipping. It usually takes 3-5 business days to arrive.`,
          `Perfect! Please send me the sample. What payment methods do you accept?`
        ];
        
        for (let j = 0; j < messages.length; j++) {
          const isBuyerMessage = j % 2 === 0;
          
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: isBuyerMessage ? buyer.id : product.seller.id,
              receiverId: isBuyerMessage ? product.seller.id : buyer.id,
              content: messages[j],
              messageType: 'TEXT',
              attachments: [],
              isEncrypted: false,
              createdAt: new Date(Date.now() - (messages.length - j) * 30 * 60 * 1000) // Messages spread over time
            }
          });
        }
        
        console.log(`✅ Created conversation between ${buyer.companyName} and ${product.seller.companyName}`);
      }
    }
    
    // Step 4: Show final summary
    console.log('\n📊 Final Enhanced Database Summary:');
    
    const userCount = await prisma.user.count();
    const buyerCount = await prisma.user.count({ where: { role: 'BUYER' } });
    const sellerCount = await prisma.user.count({ where: { role: 'SELLER' } });
    const productCount = await prisma.product.count();
    const auctionCount = await prisma.auction.count();
    const activeAuctionCount = await prisma.auction.count({ where: { status: 'ACTIVE' } });
    const bidCount = await prisma.bid.count();
    const conversationCount = await prisma.conversation.count();
    const messageCount = await prisma.message.count();
    
    console.log(`👥 Total Users: ${userCount} (${buyerCount} buyers, ${sellerCount} sellers)`);
    console.log(`🛍️  Products: ${productCount}`);
    console.log(`🎯 Auctions: ${auctionCount} (${activeAuctionCount} active)`);
    console.log(`💰 Bids: ${bidCount}`);
    console.log(`💬 Conversations: ${conversationCount}`);
    console.log(`📨 Messages: ${messageCount}`);
    
    console.log('\n🎉 Test data enhancement completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during test data enhancement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
enhanceTestData()
  .then(() => {
    console.log('\n✅ Enhancement script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Enhancement script failed:', error);
    process.exit(1);
  });
