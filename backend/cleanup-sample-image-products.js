const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Check if an image is a sample/placeholder image
 * @param {string} imagePath - Path to the image file
 * @returns {boolean} - True if the image is a sample/placeholder
 */
function isSampleImage(imagePath) {
  // Check if the path contains "sample" in the filename
  const filename = path.basename(imagePath);
  return filename.toLowerCase().includes('sample');
}

/**
 * Check if a product uses any sample/placeholder images
 * @param {Object} product - Product object with images
 * @returns {boolean} - True if product uses sample images
 */
function usesSampleImages(product) {
  if (!product.images || product.images.length === 0) {
    return false;
  }
  
  return product.images.some(image => isSampleImage(image.imageUrl));
}

/**
 * Main cleanup function for products using sample images
 */
async function cleanupProductsWithSampleImages() {
  console.log('🧹 Starting cleanup of products using sample/placeholder images...\n');
  
  try {
    // Get all products with their images
    const products = await prisma.product.findMany({
      include: {
        images: true,
        auction: {
          select: {
            id: true,
            status: true,
            bidCount: true,
          }
        },
        conversations: {
          where: {
            status: 'ACTIVE'
          },
          select: {
            id: true
          }
        }
      }
    });
    
    console.log(`📊 Found ${products.length} products to analyze\n`);
    
    const productsWithSampleImages = [];
    const productsWithValidImages = [];
    
    // Analyze each product
    for (const product of products) {
      console.log(`🔍 Analyzing product: "${product.title}" (ID: ${product.id})`);
      
      if (usesSampleImages(product)) {
        console.log(`   ❌ Uses sample/placeholder images`);
        console.log(`     Images: ${product.images.map(img => img.imageUrl).join(', ')}`);
        productsWithSampleImages.push(product);
      } else {
        console.log(`   ✅ Uses valid images`);
        productsWithValidImages.push(product);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📋 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`✅ Products with valid images: ${productsWithValidImages.length}`);
    console.log(`❌ Products using sample/placeholder images: ${productsWithSampleImages.length}`);
    console.log(`📊 Total products: ${products.length}\n`);
    
    if (productsWithSampleImages.length > 0) {
      console.log('🗑️  PRODUCTS USING SAMPLE/PLACEHOLDER IMAGES:');
      console.log('==============================================');
      
      const productsToDelete = [];
      const productsWithConstraints = [];
      
      for (const product of productsWithSampleImages) {
        console.log(`   - "${product.title}" (ID: ${product.id})`);
        console.log(`     Images: ${product.images.map(img => img.imageUrl).join(', ')}`);
        
        // Check for deletion constraints
        const hasActiveConversations = product.conversations.length > 0;
        const hasActiveAuction = product.auction && product.auction.status === 'ACTIVE';
        const hasBids = product.auction && product.auction.bidCount > 0;
        
        if (hasActiveConversations || hasActiveAuction || hasBids) {
          console.log(`     ⚠️  Cannot delete - has active conversations (${product.conversations.length}), auction (${hasActiveAuction}), or bids (${hasBids})`);
          productsWithConstraints.push(product);
        } else {
          console.log(`     ✅ Can be deleted`);
          productsToDelete.push(product);
        }
        console.log('');
      }
      
      console.log(`📊 BREAKDOWN:`);
      console.log(`   - Can be deleted: ${productsToDelete.length}`);
      console.log(`   - Cannot delete (constraints): ${productsWithConstraints.length}\n`);
      
      // Ask for confirmation before deletion
      if (productsToDelete.length > 0) {
        console.log(`⚠️  WARNING: This will permanently delete ${productsToDelete.length} products using sample/placeholder images!`);
        console.log('This action cannot be undone.\n');
        
        console.log('🚀 Proceeding with deletion...\n');
        
        let deletedCount = 0;
        let errorCount = 0;
        
        for (const product of productsToDelete) {
          try {
            console.log(`🗑️  Deleting product: "${product.title}" (ID: ${product.id})`);
            
            // Delete the product (cascade will handle related records)
            await prisma.product.delete({
              where: { id: product.id }
            });
            
            console.log(`   ✅ Successfully deleted`);
            deletedCount++;
          } catch (error) {
            console.log(`   ❌ Error deleting: ${error.message}`);
            errorCount++;
          }
        }
        
        console.log('\n🎉 CLEANUP COMPLETED!');
        console.log('=====================');
        console.log(`✅ Successfully deleted: ${deletedCount} products`);
        if (errorCount > 0) {
          console.log(`❌ Errors encountered: ${errorCount} products`);
        }
        
        if (productsWithConstraints.length > 0) {
          console.log(`\n⚠️  ${productsWithConstraints.length} products could not be deleted due to constraints:`);
          productsWithConstraints.forEach(product => {
            console.log(`   - "${product.title}" (ID: ${product.id})`);
          });
          console.log('\n💡 To delete these products, you need to:');
          console.log('   1. Close all active conversations');
          console.log('   2. Wait for auctions to end');
          console.log('   3. Ensure no active bids exist');
        }
      } else {
        console.log('⚠️  No products can be deleted due to constraints.');
        console.log('💡 To delete these products, you need to:');
        console.log('   1. Close all active conversations');
        console.log('   2. Wait for auctions to end');
        console.log('   3. Ensure no active bids exist');
      }
    } else {
      console.log('✅ No products are using sample/placeholder images.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupProductsWithSampleImages()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
