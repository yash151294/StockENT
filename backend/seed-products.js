const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding sample products...');
  
  // Get the seller user
  const sellerUser = await prisma.user.findUnique({
    where: { email: 'seller@textilemill.com' }
  });
  
  if (!sellerUser) {
    console.log('❌ Seller user not found. Please run the main seed first.');
    return;
  }
  
  // Get categories
  const cottonFiber = await prisma.category.findFirst({
    where: { name: 'Cotton Fiber' }
  });
  
  const polyesterYarn = await prisma.category.findFirst({
    where: { name: 'Polyester Yarn' }
  });
  
  const cottonFabric = await prisma.category.findFirst({
    where: { name: 'Cotton Fabric' }
  });
  
  if (!cottonFiber || !polyesterYarn || !cottonFabric) {
    console.log('❌ Categories not found. Please run the main seed first.');
    return;
  }
  
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
      listingType: 'FIXED_PRICE',
    },
  });

  console.log('✅ Sample products created successfully!');
  console.log(`📦 Created ${product1.title}`);
  console.log(`📦 Created ${product2.title}`);
  console.log(`📦 Created ${product3.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
