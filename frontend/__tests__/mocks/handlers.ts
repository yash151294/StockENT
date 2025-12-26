/**
 * MSW (Mock Service Worker) API Handlers
 * Mocks backend API responses for testing
 */

import { rest } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  role: 'BUYER',
  companyName: 'Test Company',
  contactPerson: 'John Doe',
  phone: '+1234567890',
  country: 'USA',
  profileImageUrl: null,
  verificationStatus: 'VERIFIED',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  id: 'product-1',
  name: 'Test Cotton Fabric',
  description: 'High quality cotton fabric for testing',
  basePrice: 100,
  currency: 'USD',
  quantityAvailable: 1000,
  minOrderQuantity: 10,
  unit: 'meters',
  status: 'ACTIVE',
  sellerId: 'seller-1',
  categoryId: 'category-1',
  images: [],
  seller: {
    id: 'seller-1',
    companyName: 'Seller Company',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockCartItem = (overrides = {}) => ({
  id: 'cart-item-1',
  userId: 'user-1',
  productId: 'product-1',
  quantity: 50,
  priceAtAddition: 100,
  currency: 'USD',
  sourceType: 'DIRECT',
  product: createMockProduct(),
  addedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// API Handlers
export const handlers = [
  // Auth handlers
  rest.post(`${API_URL}/auth/login`, async (req, res, ctx) => {
    const { email, password } = await req.json();

    if (email === 'test@example.com' && password === 'password123') {
      return res(
        ctx.status(200),
        ctx.json({
          success: true,
          data: {
            user: createMockUser(),
          },
        })
      );
    }

    return res(
      ctx.status(401),
      ctx.json({
        success: false,
        error: 'Invalid credentials',
      })
    );
  }),

  rest.post(`${API_URL}/auth/register`, async (req, res, ctx) => {
    const body = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        message: 'User registered successfully',
        data: createMockUser({ email: body.email, role: body.role }),
      })
    );
  }),

  rest.post(`${API_URL}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully',
      })
    );
  }),

  rest.post(`${API_URL}/auth/refresh`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          accessToken: 'new-access-token',
        },
      })
    );
  }),

  rest.get(`${API_URL}/auth/profile`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: createMockUser(),
      })
    );
  }),

  // Products handlers
  rest.get(`${API_URL}/products`, (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          products: [
            createMockProduct({ id: 'product-1' }),
            createMockProduct({ id: 'product-2', name: 'Test Silk Fabric' }),
            createMockProduct({ id: 'product-3', name: 'Test Polyester Yarn' }),
          ],
          pagination: {
            page,
            limit,
            total: 3,
            totalPages: 1,
          },
        },
      })
    );
  }),

  rest.get(`${API_URL}/products/:id`, (req, res, ctx) => {
    const { id } = req.params;

    if (id === 'not-found') {
      return res(
        ctx.status(404),
        ctx.json({
          success: false,
          error: 'Product not found',
        })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: createMockProduct({ id: id as string }),
      })
    );
  }),

  // Cart handlers
  rest.get(`${API_URL}/cart`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          items: [
            createMockCartItem({ id: 'cart-item-1' }),
            createMockCartItem({
              id: 'cart-item-2',
              productId: 'product-2',
              product: createMockProduct({ id: 'product-2', name: 'Test Silk' }),
            }),
          ],
          summary: {
            itemCount: 2,
            totalQuantity: 100,
            totalValue: 10000,
            currencies: ['USD'],
          },
        },
      })
    );
  }),

  rest.post(`${API_URL}/cart`, async (req, res, ctx) => {
    const body = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: createMockCartItem({
          productId: body.productId,
          quantity: body.quantity,
        }),
      })
    );
  }),

  rest.put(`${API_URL}/cart/:id`, async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: createMockCartItem({
          id: id as string,
          quantity: body.quantity,
        }),
      })
    );
  }),

  rest.delete(`${API_URL}/cart/:id`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Item removed from cart',
      })
    );
  }),

  rest.delete(`${API_URL}/cart`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Cart cleared',
      })
    );
  }),

  // Categories handlers
  rest.get(`${API_URL}/categories`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [
          { id: 'cat-1', name: 'Fabrics', slug: 'fabrics' },
          { id: 'cat-2', name: 'Yarns', slug: 'yarns' },
          { id: 'cat-3', name: 'Fibers', slug: 'fibers' },
        ],
      })
    );
  }),

  // Search handler
  rest.get(`${API_URL}/search`, (req, res, ctx) => {
    const query = req.url.searchParams.get('q');

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          products: [
            createMockProduct({ name: `${query} Result 1` }),
            createMockProduct({ id: 'product-2', name: `${query} Result 2` }),
          ],
          total: 2,
        },
      })
    );
  }),

  // Dashboard handlers
  rest.get(`${API_URL}/dashboard/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          totalProducts: 25,
          activeAuctions: 5,
          totalOrders: 100,
          pendingNegotiations: 3,
        },
      })
    );
  }),

  // Auctions handlers
  rest.get(`${API_URL}/auctions`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          auctions: [
            {
              id: 'auction-1',
              productId: 'product-1',
              startingPrice: 50,
              currentPrice: 75,
              status: 'ACTIVE',
              product: createMockProduct(),
            },
          ],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      })
    );
  }),

  // Negotiations handlers
  rest.get(`${API_URL}/negotiations`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          negotiations: [
            {
              id: 'negotiation-1',
              productId: 'product-1',
              buyerId: 'user-1',
              sellerId: 'seller-1',
              proposedPrice: 90,
              status: 'PENDING',
              product: createMockProduct(),
            },
          ],
        },
      })
    );
  }),

  // Messages handlers
  rest.get(`${API_URL}/messages/conversations`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
      })
    );
  }),
];

export default handlers;
