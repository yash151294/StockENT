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

    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      const { processProductImages } = require('../middleware/upload');
      const processedImages = await processProductImages(req.files);

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
    }

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
    const updateData = req.body;

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

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...updateData,
        status: 'ACTIVE', // Reset to active for admin review
      },
    });

    logger.info(`Product updated: ${id} by user: ${req.user.id}`);

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
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
    const [activeConversations, activeBids] = await Promise.all([
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
    ]);

    if (activeConversations > 0 || activeBids > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete product with active conversations or bids',
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
  getUserProducts,
  addToWatchlist,
  removeFromWatchlist,
  toggleWatchlist,
  getWatchlist,
};
