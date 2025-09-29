const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Cleanup script to remove products without actual images
 * This script identifies and removes products that:
 * 1. Have no images at all
 * 2. Have only placeholder/sample images
 * 3. Have images that don't exist on the filesystem
 */

async function cleanupProductsWithoutImages() {
  try {
    console.log('🔍 Starting cleanup of products without actual images...\n');

    // Get all products with their images
    const products = await prisma.product.findMany({
      include: {
        images: true,
        seller: {
          select: { 
            id: true,
            companyName: true, 
            email: true 
          }
        }
      }
    });

    console.log(`📊 Total products found: ${products.length}`);

    const productsToDelete = [];
    const productsWithPlaceholderImages = [];
    const productsWithMissingFiles = [];

    // Check each product
    for (const product of products) {
      let shouldDelete = false;
      let reason = '';

      // Check if product has no images
      if (product.images.length === 0) {
        shouldDelete = true;
        reason = 'No images';
        productsToDelete.push({ product, reason });
        continue;
      }

      // Check for placeholder/sample images
      const hasPlaceholderImages = product.images.some(img => 
        img.imageUrl.includes('placeholder') || 
        img.imageUrl.includes('sample') ||
        img.imageUrl.includes('default') ||
        img.imageUrl.includes('temp') ||
        img.imageUrl.includes('demo')
      );

      if (hasPlaceholderImages) {
        shouldDelete = true;
        reason = 'Contains placeholder/sample images';
        productsWithPlaceholderImages.push({ product, reason });
        productsToDelete.push({ product, reason });
        continue;
      }

      // Check if image files actually exist on filesystem
      let allImagesExist = true;
      for (const image of product.images) {
        const imagePath = path.join(__dirname, '..', image.imageUrl);
        if (!fs.existsSync(imagePath)) {
          allImagesExist = false;
          break;
        }
      }

      if (!allImagesExist) {
        shouldDelete = true;
        reason = 'Image files missing from filesystem';
        productsWithMissingFiles.push({ product, reason });
        productsToDelete.push({ product, reason });
      }
    }

    // Display summary
    console.log('\n📋 CLEANUP SUMMARY:');
    console.log(`   Products without images: ${productsToDelete.filter(p => p.reason === 'No images').length}`);
    console.log(`   Products with placeholder images: ${productsWithPlaceholderImages.length}`);
    console.log(`   Products with missing image files: ${productsWithMissingFiles.length}`);
    console.log(`   Total products to delete: ${productsToDelete.length}`);

    if (productsToDelete.length === 0) {
      console.log('\n✅ No products need to be deleted. All products have valid images!');
      return;
    }

    // Show detailed list of products to be deleted
    console.log('\n🗑️  PRODUCTS TO BE DELETED:');
    productsToDelete.forEach(({ product, reason }) => {
      console.log(`   - ID: ${product.id}`);
      console.log(`     Title: ${product.title}`);
      console.log(`     Seller: ${product.seller.companyName} (${product.seller.email})`);
      console.log(`     Reason: ${reason}`);
      console.log(`     Images: ${product.images.length}`);
      if (product.images.length > 0) {
        product.images.forEach(img => console.log(`       - ${img.imageUrl}`));
      }
      console.log('');
    });

    // Ask for confirmation
    console.log('⚠️  WARNING: This action will permanently delete the products listed above.');
    console.log('   This includes all associated data: images, specifications, conversations, etc.');
    console.log('\n   Type "DELETE" to confirm, or anything else to cancel:');

    // For automated execution, we'll add a flag
    const shouldProceed = process.argv.includes('--confirm');
    
    if (!shouldProceed) {
      console.log('\n❌ Cleanup cancelled. Use --confirm flag to proceed with deletion.');
      return;
    }

    // Proceed with deletion
    console.log('\n🗑️  Starting deletion process...');
    
    let deletedCount = 0;
    let errorCount = 0;

    for (const { product } of productsToDelete) {
      try {
        // First, delete all related records manually to avoid foreign key constraints
        await prisma.$transaction(async (tx) => {
          // Delete conversations first
          await tx.conversation.deleteMany({
            where: { productId: product.id }
          });

          // Delete watchlist items
          await tx.watchlistItem.deleteMany({
            where: { productId: product.id }
          });

          // Delete sample requests
          await tx.sampleRequest.deleteMany({
            where: { productId: product.id }
          });

          // Delete auction and related bids
          const auction = await tx.auction.findUnique({
            where: { productId: product.id }
          });
          
          if (auction) {
            await tx.bid.deleteMany({
              where: { auctionId: auction.id }
            });
            await tx.auction.delete({
              where: { id: auction.id }
            });
          }

          // Delete product specifications
          await tx.productSpecification.deleteMany({
            where: { productId: product.id }
          });

          // Delete product images
          await tx.productImage.deleteMany({
            where: { productId: product.id }
          });

          // Finally, delete the product
          await tx.product.delete({
            where: { id: product.id }
          });
        });

        // Delete associated image files from filesystem
        for (const image of product.images) {
          try {
            const imagePath = path.join(__dirname, '..', image.imageUrl);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              console.log(`   🗑️  Deleted file: ${image.imageUrl}`);
            }
          } catch (fileError) {
            console.log(`   ⚠️  Could not delete file: ${image.imageUrl} - ${fileError.message}`);
          }
        }

        deletedCount++;
        console.log(`   ✅ Deleted product: ${product.title} (${product.id})`);
        
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Failed to delete product: ${product.title} - ${error.message}`);
      }
    }

    console.log('\n📊 CLEANUP COMPLETE:');
    console.log(`   ✅ Successfully deleted: ${deletedCount} products`);
    console.log(`   ❌ Failed to delete: ${errorCount} products`);
    console.log(`   📁 Image files cleaned up`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupProductsWithoutImages();