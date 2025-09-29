const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Check if an image file exists and is a valid image
 * @param {string} imagePath - Path to the image file
 * @returns {boolean} - True if the image exists and is valid
 */
async function isValidImageFile(imagePath) {
  try {
    // Convert URL path to file system path
    // Remove leading slash and join with backend directory
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, cleanPath), // Direct path
      path.join(__dirname, 'uploads', 'products', path.basename(cleanPath)), // Try in products folder
      path.join(__dirname, 'uploads', path.basename(cleanPath)), // Try in uploads folder
    ];
    
    let fullPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        fullPath = testPath;
        break;
      }
    }
    
    if (!fullPath) {
      return false;
    }
    
    // Check file size (placeholder files are typically very small)
    const stats = fs.statSync(fullPath);
    if (stats.size < 1000) { // Less than 1KB is likely a placeholder
      return false;
    }
    
    // Check if it's a valid image file by reading the first few bytes
    const buffer = fs.readFileSync(fullPath, { encoding: null });
    
    // Check for common image file signatures
    const signatures = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      gif: [0x47, 0x49, 0x46],
      webp: [0x52, 0x49, 0x46, 0x46]
    };
    
    // Check for JPEG signature
    if (buffer[0] === signatures.jpeg[0] && 
        buffer[1] === signatures.jpeg[1] && 
        buffer[2] === signatures.jpeg[2]) {
      return true;
    }
    
    // Check for PNG signature
    if (buffer[0] === signatures.png[0] && 
        buffer[1] === signatures.png[1] && 
        buffer[2] === signatures.png[2] && 
        buffer[3] === signatures.png[3]) {
      return true;
    }
    
    // Check for GIF signature
    if (buffer[0] === signatures.gif[0] && 
        buffer[1] === signatures.gif[1] && 
        buffer[2] === signatures.gif[2]) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a product has at least one valid image
 * @param {Object} product - Product object with images
 * @returns {boolean} - True if product has valid images
 */
async function hasValidImages(product) {
  if (!product.images || product.images.length === 0) {
    return false;
  }
  
  for (const image of product.images) {
    if (await isValidImageFile(image.imageUrl)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Main cleanup function
 */
async function cleanupProductsWithoutImages() {
  console.log('🧹 Starting cleanup of products without valid images...\n');
  
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
    
    const productsToDelete = [];
    const productsToKeep = [];
    const productsWithConstraints = [];
    
    // Analyze each product
    for (const product of products) {
      console.log(`🔍 Analyzing product: "${product.title}" (ID: ${product.id})`);
      
      // Check if product has valid images
      const hasValidImagesFlag = await hasValidImages(product);
      
      if (!hasValidImagesFlag) {
        console.log(`   ❌ No valid images found`);
        
        // Check for deletion constraints
        const hasActiveConversations = product.conversations.length > 0;
        const hasActiveAuction = product.auction && product.auction.status === 'ACTIVE';
        const hasBids = product.auction && product.auction.bidCount > 0;
        
        if (hasActiveConversations || hasActiveAuction || hasBids) {
          console.log(`   ⚠️  Cannot delete - has active conversations (${product.conversations.length}), auction (${hasActiveAuction}), or bids (${hasBids})`);
          productsWithConstraints.push({
            ...product,
            constraints: {
              activeConversations: product.conversations.length,
              hasActiveAuction,
              hasBids
            }
          });
        } else {
          console.log(`   ✅ Can be deleted`);
          productsToDelete.push(product);
        }
      } else {
        console.log(`   ✅ Has valid images`);
        productsToKeep.push(product);
      }
      
      console.log(''); // Empty line for readability
    }
    
    // Summary
    console.log('📋 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`✅ Products with valid images: ${productsToKeep.length}`);
    console.log(`❌ Products without valid images (can delete): ${productsToDelete.length}`);
    console.log(`⚠️  Products without valid images (cannot delete): ${productsWithConstraints.length}`);
    console.log(`📊 Total products: ${products.length}\n`);
    
    if (productsToDelete.length > 0) {
      console.log('🗑️  PRODUCTS TO BE DELETED:');
      console.log('===========================');
      productsToDelete.forEach(product => {
        console.log(`   - "${product.title}" (ID: ${product.id})`);
        console.log(`     Images: ${product.images.map(img => img.imageUrl).join(', ')}`);
      });
      console.log('');
    }
    
    if (productsWithConstraints.length > 0) {
      console.log('⚠️  PRODUCTS WITH CONSTRAINTS (cannot delete):');
      console.log('==============================================');
      productsWithConstraints.forEach(product => {
        console.log(`   - "${product.title}" (ID: ${product.id})`);
        console.log(`     Images: ${product.images.map(img => img.imageUrl).join(', ')}`);
        console.log(`     Constraints: conversations=${product.constraints.activeConversations}, auction=${product.constraints.hasActiveAuction}, bids=${product.constraints.hasBids}`);
      });
      console.log('');
    }
    
    // Ask for confirmation before deletion
    if (productsToDelete.length > 0) {
      console.log(`⚠️  WARNING: This will permanently delete ${productsToDelete.length} products and all their associated data!`);
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
    } else {
      console.log('✅ No products need to be deleted.');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupProductsWithoutImages()
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
