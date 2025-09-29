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
 * Force cleanup of products using sample images by closing conversations first
 */
async function forceCleanupProductsWithSampleImages() {
  console.log('🧹 Starting FORCE cleanup of products using sample/placeholder images...\n');
  
  try {
    // Get all products with their images and related data
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
          include: {
            messages: true
          }
        }
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
        // Step 1: Close all active conversations
        if (product.conversations.length > 0) {
          console.log(`   📞 Closing ${product.conversations.length} active conversations...`);
          
          for (const conversation of product.conversations) {
            if (conversation.status === 'ACTIVE') {
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: 'CLOSED' }
              });
              console.log(`     ✅ Closed conversation ${conversation.id}`);
            }
          }
        }
        
        // Step 2: Handle auction if it exists
        if (product.auction) {
          console.log(`   🏷️  Handling auction ${product.auction.id}...`);
          
          if (product.auction.status === 'ACTIVE') {
            await prisma.auction.update({
              where: { id: product.auction.id },
              data: { status: 'CANCELLED' }
            });
            console.log(`     ✅ Cancelled active auction`);
          }
        }
        
        // Step 3: Delete the product (cascade will handle related records)
        console.log(`   🗑️  Deleting product...`);
        await prisma.product.delete({
          where: { id: product.id }
        });
        
        console.log(`   ✅ Successfully deleted product "${product.title}"`);
        totalDeleted++;
        
      } catch (error) {
        console.log(`   ❌ Error processing product: ${error.message}`);
        totalErrors++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 FORCE CLEANUP COMPLETED!');
    console.log('===========================');
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
    
  } catch (error) {
    console.error('❌ Error during force cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the force cleanup
forceCleanupProductsWithSampleImages()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
