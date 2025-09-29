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
 * Complete cleanup of products using sample images by handling all related data
 */
async function completeCleanupProductsWithSampleImages() {
  console.log('🧹 Starting COMPLETE cleanup of products using sample/placeholder images...\n');
  
  try {
    // Get all products with their images and related data
    const products = await prisma.product.findMany({
      include: {
        images: true,
        auction: {
          include: {
            bids: true
          }
        },
        conversations: {
          include: {
            messages: true,
            keyExchanges: true
          }
        },
        watchlistItems: true,
        sampleRequests: true,
        specifications: true
      }
    });
    
    console.log(`📊 Found ${products.length} products to analyze\n`);
    
    const productsWithSampleImages = products.filter(usesSampleImages);
    
    if (productsWithSampleImages.length === 0) {
      console.log('✅ No products are using sample/placeholder images.');
      return;
    }
    
    console.log(`🗑️  Found ${productsWithSampleImages.length} products using sample/placeholder images:\n`);
    
    let totalDeleted = 0;
    let totalErrors = 0;
    
    for (const product of productsWithSampleImages) {
      console.log(`🔍 Processing product: "${product.title}" (ID: ${product.id})`);
      console.log(`   Images: ${product.images.map(img => img.imageUrl).join(', ')}`);
      
      try {
        // Use a transaction to ensure all deletions happen atomically
        await prisma.$transaction(async (tx) => {
          // Step 1: Delete messages first (they reference conversations)
          if (product.conversations.length > 0) {
            console.log(`   💬 Deleting ${product.conversations.length} conversations and their messages...`);
            
            for (const conversation of product.conversations) {
              // Delete key exchanges first
              if (conversation.keyExchanges.length > 0) {
                await tx.keyExchange.deleteMany({
                  where: { conversationId: conversation.id }
                });
                console.log(`     ✅ Deleted ${conversation.keyExchanges.length} key exchanges`);
              }
              
              // Delete messages
              if (conversation.messages.length > 0) {
                await tx.message.deleteMany({
                  where: { conversationId: conversation.id }
                });
                console.log(`     ✅ Deleted ${conversation.messages.length} messages`);
              }
              
              // Delete conversation
              await tx.conversation.delete({
                where: { id: conversation.id }
              });
              console.log(`     ✅ Deleted conversation ${conversation.id}`);
            }
          }
          
          // Step 2: Delete auction-related data
          if (product.auction) {
            console.log(`   🏷️  Deleting auction and bids...`);
            
            // Delete bids first
            if (product.auction.bids.length > 0) {
              await tx.bid.deleteMany({
                where: { auctionId: product.auction.id }
              });
              console.log(`     ✅ Deleted ${product.auction.bids.length} bids`);
            }
            
            // Delete auction
            await tx.auction.delete({
              where: { id: product.auction.id }
            });
            console.log(`     ✅ Deleted auction ${product.auction.id}`);
          }
          
          // Step 3: Delete other related data
          if (product.watchlistItems.length > 0) {
            await tx.watchlistItem.deleteMany({
              where: { productId: product.id }
            });
            console.log(`     ✅ Deleted ${product.watchlistItems.length} watchlist items`);
          }
          
          if (product.sampleRequests.length > 0) {
            await tx.sampleRequest.deleteMany({
              where: { productId: product.id }
            });
            console.log(`     ✅ Deleted ${product.sampleRequests.length} sample requests`);
          }
          
          if (product.specifications.length > 0) {
            await tx.productSpecification.deleteMany({
              where: { productId: product.id }
            });
            console.log(`     ✅ Deleted ${product.specifications.length} specifications`);
          }
          
          // Step 4: Delete product images
          if (product.images.length > 0) {
            await tx.productImage.deleteMany({
              where: { productId: product.id }
            });
            console.log(`     ✅ Deleted ${product.images.length} product images`);
          }
          
          // Step 5: Finally delete the product
          console.log(`   🗑️  Deleting product...`);
          await tx.product.delete({
            where: { id: product.id }
          });
          console.log(`     ✅ Deleted product "${product.title}"`);
        });
        
        console.log(`   ✅ Successfully deleted product "${product.title}" and all related data`);
        totalDeleted++;
        
      } catch (error) {
        console.log(`   ❌ Error processing product: ${error.message}`);
        totalErrors++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 COMPLETE CLEANUP FINISHED!');
    console.log('==============================');
    console.log(`✅ Successfully deleted: ${totalDeleted} products`);
    if (totalErrors > 0) {
      console.log(`❌ Errors encountered: ${totalErrors} products`);
    }
    
    // Verify cleanup
    const remainingProducts = await prisma.product.findMany({
      where: {
        images: {
          some: {
            imageUrl: {
              contains: 'sample'
            }
          }
        }
      }
    });
    
    if (remainingProducts.length === 0) {
      console.log('✅ All products with sample images have been successfully removed!');
    } else {
      console.log(`⚠️  ${remainingProducts.length} products with sample images still remain.`);
    }
    
    // Also clean up any orphaned sample image files
    console.log('\n🧹 Cleaning up orphaned sample image files...');
    const sampleFiles = [
      'uploads/products/sample-cotton-fiber-1.jpg',
      'uploads/products/sample-cotton-fiber-2.jpg',
      'uploads/products/sample-polyester-yarn-1.jpg',
      'uploads/products/sample-cotton-fabric-1.jpg'
    ];
    
    let cleanedFiles = 0;
    for (const filePath of sampleFiles) {
      const fullPath = path.join(__dirname, filePath);
      if (fs.existsSync(fullPath)) {
        try {
          fs.unlinkSync(fullPath);
          console.log(`   ✅ Deleted ${filePath}`);
          cleanedFiles++;
        } catch (error) {
          console.log(`   ❌ Error deleting ${filePath}: ${error.message}`);
        }
      }
    }
    
    if (cleanedFiles > 0) {
      console.log(`✅ Cleaned up ${cleanedFiles} orphaned sample image files`);
    } else {
      console.log('✅ No orphaned sample image files found');
    }
    
  } catch (error) {
    console.error('❌ Error during complete cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the complete cleanup
completeCleanupProductsWithSampleImages()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
