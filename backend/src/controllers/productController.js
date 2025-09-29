const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Get all products with filtering and pagination
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      listingType,
      status = 'ACTIVE',
      country,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {
      status,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (listingType) {
      where.listingType = listingType;
    }

    if (country) {
      where.seller = {
        country,
      };
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              companyName: true,
              country: true,
              verificationStatus: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            where: { isPrimary: true },
            select: {
              id: true,
              imageUrl: true,
              alt: true,
            },
          },
          auction: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              currentBid: true,
              bidCount: true,
            },
          },
          _count: {
            select: {
              watchlistItems: true,
              conversations: true,
            },
          },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get single product by ID
 */
const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            companyName: true,
            contactPerson: true,
            phone: true,
            country: true,
            verificationStatus: true,
            companyProfile: true,
          },
        },
        category: true,
        images: {
          orderBy: { isPrimary: 'desc' },
        },
        specifications: true,
        auction: {
          include: {
            bids: {
              include: {
                bidder: {
                  select: {
                    id: true,
                    companyName: true,
                    country: true,
                  },
                },
              },
              orderBy: { amount: 'desc' },
            },
          },
        },
        conversations: {
          where: {
            buyerId: req.user?.id,
          },
          select: {
            id: true,
            status: true,
          },
        },
        watchlistItems: {
          where: {
            userId: req.user?.id,
          },
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            watchlistItems: true,
            conversations: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Add isInWatchlist property based on whether user has this product in watchlist
    const isInWatchlist = product.watchlistItems && product.watchlistItems.length > 0;
    
    // Remove watchlistItems from response to avoid exposing internal data
    const { watchlistItems, ...productData } = product;
    
    res.json({
      success: true,
      data: {
        ...productData,
        isInWatchlist,
      },
    });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Create new product
 */
const createProduct = async (req, res) => {
  try {
    // Parse FormData fields that need type conversion
    const {
      title,
      description,
      categoryId,
      price,
      quantity,
      unit,
      listingType,
      tags,
      specifications,
      location,
      country,
      minOrderQuantity,
      auctionStartTime,
      auctionEndTime,
      minimumBid,
      reservePrice,
    } = req.body;


    // Convert string values to appropriate types for validation
    let parsedTags = [];
    let parsedSpecifications = {};

    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tags format. Must be a valid JSON array.',
      });
    }

    try {
      parsedSpecifications = specifications ? JSON.parse(specifications) : {};
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid specifications format. Must be a valid JSON object.',
      });
    }

    const processedData = {
      title,
      description,
      categoryId,
      price: parseFloat(price),
      quantity: parseFloat(quantity), // Changed from parseInt to parseFloat
      unit,
      listingType,
      tags: parsedTags,
      specifications: parsedSpecifications,
      location,
      country,
      minOrderQuantity: parseFloat(minOrderQuantity),
      auctionStartTime: auctionStartTime ? new Date(auctionStartTime) : undefined,
      auctionEndTime: auctionEndTime ? new Date(auctionEndTime) : undefined,
      minimumBid: minimumBid ? parseFloat(minimumBid) : undefined,
      reservePrice: reservePrice ? parseFloat(reservePrice) : undefined,
    };


    // Validate the processed data
    const { createProductSchema } = require('../validators/productValidators');
    const { error } = createProductSchema.validate(processedData, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const { logger } = require('../utils/logger');
      logger.warn('Product validation errors:', error.details);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        })),
      });
    }

    // Use processed data for the rest of the function
    const {
      title: validatedTitle,
      description: validatedDescription,
      categoryId: validatedCategoryId,
      price: validatedPrice,
      quantity: validatedQuantity,
      unit: validatedUnit,
      listingType: validatedListingType,
      tags: validatedTags,
      specifications: validatedSpecifications,
      location: validatedLocation,
      country: validatedCountry,
      minOrderQuantity: validatedMinOrderQuantity,
      auctionStartTime: validatedAuctionStartTime,
      auctionEndTime: validatedAuctionEndTime,
      minimumBid: validatedMinimumBid,
      reservePrice: validatedReservePrice,
    } = processedData;

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: validatedCategoryId },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'Category not found',
      });
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        title: validatedTitle,
        description: validatedDescription,
        categoryId: validatedCategoryId,
        basePrice: validatedPrice,
        quantityAvailable: validatedQuantity,
        unit: validatedUnit,
        listingType: validatedListingType,
        tags: validatedTags,
        sellerId: req.user.id,
        status: 'ACTIVE', // Products are active by default
        minOrderQuantity: validatedMinOrderQuantity,
        currency: 'USD',
        location: validatedLocation,
        country: validatedCountry,
      },
    });

    // Create specifications if provided
    if (validatedSpecifications && Object.keys(validatedSpecifications).length > 0) {
      const specificationData = Object.entries(validatedSpecifications).map(([specName, specValue]) => ({
        productId: product.id,
        specName,
        specValue,
      }));

      await prisma.productSpecification.createMany({
        data: specificationData,
      });
    }

    // Validate that images are provided
    if (!req.files || req.files.length === 0) {
      // Delete the created product if no images provided
      await prisma.product.delete({
        where: { id: product.id }
      });
      
      return res.status(400).json({
        success: false,
        error: 'At least one product image is required',
        details: {
          field: 'images',
          message: 'You must upload at least one image for your product listing',
        },
      });
    }

    // Process uploaded images
    const { processProductImages } = require('../middleware/upload');
    const processedImages = await processProductImages(req.files);

    // Validate that at least one image was successfully processed
    if (!processedImages || processedImages.length === 0) {
      // Delete the created product if no images were processed
      await prisma.product.delete({
        where: { id: product.id }
      });
      
      return res.status(400).json({
        success: false,
        error: 'Failed to process product images',
        details: {
          field: 'images',
          message: 'Please ensure your images are valid and try again',
        },
      });
    }

    // Create product images
    const imageData = processedImages.map((image, index) => ({
      productId: product.id,
      imageUrl: image.imageUrl,
      alt: image.alt,
      isPrimary: index === 0,
      orderIndex: index,
    }));

    await prisma.productImage.createMany({
      data: imageData,
    });

    // Create auction if listing type is AUCTION
    if (validatedListingType === 'AUCTION' && validatedAuctionStartTime && validatedAuctionEndTime) {
      await prisma.auction.create({
        data: {
          productId: product.id,
          auctionType: 'ENGLISH',
          startingPrice: validatedMinimumBid || 0,
          reservePrice: validatedReservePrice || 0,
          currentBid: validatedMinimumBid || 0,
          bidIncrement: (validatedMinimumBid || 0) * 0.05, // 5% increment
          startTime: validatedAuctionStartTime,
          endTime: validatedAuctionEndTime,
          status: 'SCHEDULED',
        },
      });
    }

    logger.info(`Product created: ${product.id} by user: ${req.user.id}`);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse FormData fields that need type conversion
    const {
      title,
      description,
      categoryId,
      price,
      quantity,
      unit,
      listingType,
      tags,
      specifications,
      location,
      country,
      minOrderQuantity,
      auctionStartTime,
      auctionEndTime,
      minimumBid,
      reservePrice,
    } = req.body;

    // Check if product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id,
        sellerId: req.user.id,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied',
      });
    }

    // Don't allow updating if product is sold
    if (product.status === 'SOLD') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update sold product',
      });
    }

    // Convert string values to appropriate types for validation
    let parsedTags = [];
    let parsedSpecifications = {};

    try {
      parsedTags = tags ? JSON.parse(tags) : [];
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tags format. Must be a valid JSON array.',
      });
    }

    try {
      parsedSpecifications = specifications ? JSON.parse(specifications) : {};
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid specifications format. Must be a valid JSON object.',
      });
    }

    // Build update data object with only provided fields
    const updateData = {};
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (price !== undefined) updateData.basePrice = parseFloat(price);
    if (quantity !== undefined) updateData.quantityAvailable = parseFloat(quantity);
    if (unit !== undefined) updateData.unit = unit;
    if (listingType !== undefined) updateData.listingType = listingType;
    if (tags !== undefined) updateData.tags = parsedTags;
    if (location !== undefined) updateData.location = location;
    if (country !== undefined) updateData.country = country;
    if (minOrderQuantity !== undefined) updateData.minOrderQuantity = parseFloat(minOrderQuantity);
    
    // Add status reset
    updateData.status = 'ACTIVE';

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    // Handle specifications update separately
    if (specifications !== undefined && Object.keys(parsedSpecifications).length > 0) {
      // Delete existing specifications
      await prisma.productSpecification.deleteMany({
        where: { productId: id }
      });

      // Create new specifications
      const specificationData = Object.entries(parsedSpecifications).map(([specName, specValue]) => ({
        productId: id,
        specName,
        specValue,
      }));

      if (specificationData.length > 0) {
        await prisma.productSpecification.createMany({
          data: specificationData,
        });
      }
    }

    // Handle image uploads if provided
    if (req.files && req.files.length > 0) {
      const { processProductImages } = require('../middleware/upload');
      
      try {
        // Delete existing images
        await prisma.productImage.deleteMany({
          where: { productId: id }
        });

        // Process and upload new images
        const imageData = await processProductImages(req.files, id);
        
        // Create new image records
        await prisma.productImage.createMany({
          data: imageData,
        });
      } catch (imageError) {
        logger.error('Image upload error:', imageError);
        // Don't fail the entire update if image upload fails
      }
    }

    // Handle auction updates if listing type is AUCTION
    if (listingType === 'AUCTION' && (auctionStartTime || auctionEndTime || minimumBid || reservePrice)) {
      try {
        const auctionData = {};
        
        if (auctionStartTime) auctionData.startTime = new Date(auctionStartTime);
        if (auctionEndTime) auctionData.endTime = new Date(auctionEndTime);
        if (minimumBid) auctionData.startingPrice = parseFloat(minimumBid);
        if (reservePrice) auctionData.reservePrice = parseFloat(reservePrice);
        
        // Check if auction already exists
        const existingAuction = await prisma.auction.findUnique({
          where: { productId: id }
        });
        
        if (existingAuction) {
          // Determine new status based on start time
          const now = new Date();
          const newStartTime = auctionStartTime ? new Date(auctionStartTime) : existingAuction.startTime;
          const newEndTime = auctionEndTime ? new Date(auctionEndTime) : existingAuction.endTime;
          
          let newStatus = existingAuction.status;
          
          // If start time is in the future, set to SCHEDULED
          if (newStartTime > now) {
            newStatus = 'SCHEDULED';
          }
          // If start time is in the past and end time is in the future, set to ACTIVE
          else if (newStartTime <= now && newEndTime > now) {
            newStatus = 'ACTIVE';
          }
          // If end time is in the past, set to ENDED
          else if (newEndTime <= now) {
            newStatus = 'ENDED';
          }
          
          // Update existing auction with new status
          const updatedAuction = await prisma.auction.update({
            where: { productId: id },
            data: {
              ...auctionData,
              status: newStatus,
            },
          });

          // Emit real-time notification about auction status change
          try {
            const { emitToAuction } = require('../utils/socket');
            emitToAuction(id, 'auction_status_changed', {
              auctionId: updatedAuction.id,
              status: newStatus,
              startTime: updatedAuction.startTime,
              endTime: updatedAuction.endTime,
              message: `Auction status changed to ${newStatus}`,
            });
          } catch (socketError) {
            logger.error('Failed to emit auction status change:', socketError);
          }
        } else {
          // Create new auction
          const now = new Date();
          const startTime = new Date(auctionStartTime);
          const endTime = new Date(auctionEndTime);
          
          // Determine initial status
          let initialStatus = 'SCHEDULED';
          if (startTime <= now && endTime > now) {
            initialStatus = 'ACTIVE';
          } else if (endTime <= now) {
            initialStatus = 'ENDED';
          }
          
          await prisma.auction.create({
            data: {
              productId: id,
              auctionType: 'ENGLISH',
              startingPrice: parseFloat(minimumBid || '0'),
              reservePrice: parseFloat(reservePrice || '0'),
              currentBid: parseFloat(minimumBid || '0'),
              bidIncrement: (parseFloat(minimumBid || '0')) * 0.05, // 5% increment
              startTime: startTime,
              endTime: endTime,
              status: initialStatus,
              ...auctionData,
            },
          });
        }
      } catch (auctionError) {
        logger.error('Auction update error:', auctionError);
        // Don't fail the entire update if auction update fails
        // Just log the error and continue
      }
    }

    logger.info(`Product updated: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    logger.error('Update product error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'A product with this information already exists',
      });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Delete product
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id,
        sellerId: req.user.id,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied',
      });
    }

    // Don't allow deleting if product has active conversations or bids
    const [activeConversations, activeBids, auctionStatus] = await Promise.all([
      prisma.conversation.count({
        where: {
          productId: id,
          status: { in: ['ACTIVE'] },
        },
      }),
      prisma.bid.count({
        where: {
          auction: {
            productId: id,
          },
          status: 'ACTIVE',
        },
      }),
      prisma.auction.findFirst({
        where: {
          productId: id,
        },
        select: {
          status: true,
          endTime: true,
        },
      }),
    ]);

    if (activeConversations > 0 || activeBids > 0) {
      let errorMessage = 'Cannot delete this product because it has ';
      const reasons = [];
      
      if (activeConversations > 0) {
        reasons.push(`${activeConversations} active conversation${activeConversations > 1 ? 's' : ''}`);
      }
      
      if (activeBids > 0) {
        reasons.push(`${activeBids} active bid${activeBids > 1 ? 's' : ''}`);
      }
      
      errorMessage += reasons.join(' and ') + '. ';
      
      if (auctionStatus && auctionStatus.status === 'ACTIVE') {
        errorMessage += 'Please wait for the auction to end before deleting this product.';
      } else if (activeConversations > 0) {
        errorMessage += 'Please close all conversations related to this product before deleting it.';
      } else {
        errorMessage += 'Please wait for all bids to be processed before deleting this product.';
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
        details: {
          activeConversations,
          activeBids,
          auctionStatus: auctionStatus?.status,
        },
      });
    }

    // Delete product (cascade will handle related records)
    await prisma.product.delete({
      where: { id },
    });

    logger.info(`Product deleted: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get product deletion status and constraints
 */
const getProductDeletionStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and belongs to user
    const product = await prisma.product.findFirst({
      where: {
        id,
        sellerId: req.user.id,
      },
      include: {
        auction: {
          select: {
            id: true,
            status: true,
            endTime: true,
            bidCount: true,
          },
        },
        _count: {
          select: {
            conversations: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found or access denied',
      });
    }

    // Check for active bids
    const activeBids = await prisma.bid.count({
      where: {
        auction: {
          productId: id,
        },
        status: 'ACTIVE',
      },
    });

    const canDelete = product._count.conversations === 0 && activeBids === 0;
    
    const deletionInfo = {
      canDelete,
      constraints: {
        activeConversations: product._count.conversations,
        activeBids,
        hasActiveAuction: product.auction && product.auction.status === 'ACTIVE',
      },
      recommendations: [],
    };

    if (product._count.conversations > 0) {
      deletionInfo.recommendations.push({
        action: 'Close conversations',
        description: 'Close all active conversations related to this product',
        count: product._count.conversations,
      });
    }

    if (activeBids > 0) {
      deletionInfo.recommendations.push({
        action: 'Wait for auction',
        description: 'Wait for the auction to end and all bids to be processed',
        count: activeBids,
      });
    }

    if (product.auction && product.auction.status === 'ACTIVE') {
      deletionInfo.recommendations.push({
        action: 'End auction',
        description: `Auction ends at ${new Date(product.auction.endTime).toLocaleString()}`,
        endTime: product.auction.endTime,
      });
    }

    res.json({
      success: true,
      data: deletionInfo,
    });
  } catch (error) {
    logger.error('Get product deletion status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get user's products
 */
const getUserProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, listingType } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      sellerId: req.user.id,
    };

    if (status) where.status = status;
    if (listingType) where.listingType = listingType;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          images: {
            where: { isPrimary: true },
            select: {
              id: true,
              imageUrl: true,
              alt: true,
            },
          },
          auction: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              status: true,
              currentBid: true,
              bidCount: true,
            },
          },
          _count: {
            select: {
              watchlistItems: true,
              conversations: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get user products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Add product to watchlist
 */
const addToWatchlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if already in watchlist
    const existingItem = await prisma.watchlistItem.findFirst({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        error: 'Product already in watchlist',
      });
    }

    // Add to watchlist
    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId: req.user.id,
        productId,
      },
    });

    logger.info(
      `Product added to watchlist: ${productId} by user: ${req.user.id}`
    );

    res.status(201).json({
      success: true,
      data: watchlistItem,
    });
  } catch (error) {
    logger.error('Add to watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Remove product from watchlist
 */
const removeFromWatchlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const watchlistItem = await prisma.watchlistItem.findFirst({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        error: 'Product not in watchlist',
      });
    }

    await prisma.watchlistItem.delete({
      where: { id: watchlistItem.id },
    });

    logger.info(
      `Product removed from watchlist: ${productId} by user: ${req.user.id}`
    );

    res.json({
      success: true,
      message: 'Product removed from watchlist',
    });
  } catch (error) {
    logger.error('Remove from watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Toggle product in watchlist (add if not present, remove if present)
 */
const toggleWatchlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
      });
    }

    // Check if already in watchlist
    const existingItem = await prisma.watchlistItem.findFirst({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    if (existingItem) {
      // Remove from watchlist
      await prisma.watchlistItem.delete({
        where: { id: existingItem.id },
      });

      logger.info(
        `Product removed from watchlist: ${productId} by user: ${req.user.id}`
      );

      res.json({
        success: true,
        message: 'Product removed from watchlist',
        action: 'removed',
      });
    } else {
      // Add to watchlist
      const watchlistItem = await prisma.watchlistItem.create({
        data: {
          userId: req.user.id,
          productId,
        },
      });

      logger.info(
        `Product added to watchlist: ${productId} by user: ${req.user.id}`
      );

      res.status(201).json({
        success: true,
        data: watchlistItem,
        message: 'Product added to watchlist',
        action: 'added',
      });
    }
  } catch (error) {
    logger.error('Toggle watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

/**
 * Get user's watchlist
 */
const getWatchlist = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [watchlistItems, total] = await Promise.all([
      prisma.watchlistItem.findMany({
        where: { userId: req.user.id },
        include: {
          product: {
            include: {
              seller: {
                select: {
                  id: true,
                  companyName: true,
                  country: true,
                  verificationStatus: true,
                },
              },
              category: {
                select: {
                  id: true,
                  name: true,
                },
              },
              images: {
                where: { isPrimary: true },
                select: {
                  id: true,
                  imageUrl: true,
                  alt: true,
                },
              },
              auction: {
                select: {
                  id: true,
                  startTime: true,
                  endTime: true,
                  status: true,
                  currentBid: true,
                  bidCount: true,
                },
              },
              _count: {
                select: {
                  watchlistItems: true,
                  conversations: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.watchlistItem.count({
        where: { userId: req.user.id },
      }),
    ]);

    res.json({
      success: true,
      data: {
        watchlistItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    logger.error('Get watchlist error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDeletionStatus,
  getUserProducts,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  getWatchlist,
};
