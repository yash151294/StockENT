import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  ProductsResponse, 
  Product,
  AuctionsResponse,
  AdminDashboardResponse,
  ConversationsResponse,
  MessagesResponse
} from '../types';
import { logger } from '../utils/logger';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'BUYER' | 'SELLER';
  companyName: string;
  contactPerson: string;
  phone: string;
  country: string;
}

interface RefreshTokenData {
  refreshToken: string;
}

interface ForgotPasswordData {
  email: string;
}

interface ResetPasswordData {
  token: string;
  password: string;
}

// Create axios instance
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
    timeout: 10000,
    withCredentials: true, // Enable cookies for authentication
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - cookies are automatically included with withCredentials: true
  instance.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Skip token refresh for logout calls
      if (error.response?.status === 401 && !originalRequest._retry && 
          !originalRequest.url?.includes('/auth/logout')) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token - cookies will be automatically sent
          const response = await axios.post(
            `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );

          if (response.data.success) {
            // New access token is set in cookies by the server
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, don't redirect automatically
          // Let the component handle the authentication state
          logger.info('Token refresh failed, user needs to login');
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

const api = createApiInstance();

// Auth API
export const authAPI = {
  login: (data: LoginData): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/login', data),

  register: (data: RegisterData): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/register', data),

  refreshToken: (data: RefreshTokenData): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/refresh', data),

  logout: (): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/logout'),

  getCurrentUser: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/auth/me'),

  verifyEmail: (token: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/auth/verify/${token}`),

  forgotPassword: (data: ForgotPasswordData): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordData): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auth/reset-password', data),

  updateUserRole: (role: 'BUYER' | 'SELLER'): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/auth/role', { role }),
};

// Users API
export const usersAPI = {
  getProfile: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/users/profile'),

  updateProfile: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/users/profile', data),

  updateCompanyProfile: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/users/company-profile', data),

  uploadAvatar: (file: File): Promise<AxiosResponse<ApiResponse>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<ApiResponse>> =>
    api.put('/users/change-password', data),
};

// Products API
export const productsAPI = {
  getProducts: (params?: any): Promise<AxiosResponse<ApiResponse<ProductsResponse>>> =>
    api.get('/products', { params }),

  getProduct: (id: string): Promise<AxiosResponse<ApiResponse<Product>>> =>
    api.get(`/products/${id}`),

  createProduct: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/products', data),

  updateProduct: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/products/${id}`, data),

  deleteProduct: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/products/${id}`),

  uploadImages: (productId: string, files: File[]): Promise<AxiosResponse<ApiResponse>> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    return api.post(`/products/${productId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteImage: (productId: string, imageId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/products/${productId}/images/${imageId}`),

  getMyProducts: (params?: any): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/products/my-products', { params }),

  toggleWatchlist: (productId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/products/watchlist', { productId }),
};

// Categories API
export const categoriesAPI = {
  getCategories: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/categories'),

  getCategory: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/categories/${id}`),

  getCategoryTree: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/categories/tree'),
};

// Auctions API
export const auctionsAPI = {
  getAuctions: (params?: any): Promise<AxiosResponse<ApiResponse<AuctionsResponse>>> =>
    api.get('/auctions', { params }),

  getAuction: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/auctions/${id}`),

  createAuction: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/auctions', data),

  updateAuction: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/auctions/${id}`, data),

  deleteAuction: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/auctions/${id}`),

  placeBid: (auctionId: string, data: { amount: number; maxBid?: number }): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/auctions/${auctionId}/bids`, data),

  getBids: (auctionId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/auctions/${auctionId}/bids`),

  getMyBids: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/auctions/my-bids'),
};

// Messages API
export const messagesAPI = {
  getConversations: (): Promise<AxiosResponse<ApiResponse<ConversationsResponse>>> =>
    api.get('/messages/conversations'),

  getConversation: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/messages/conversations/${id}`),

  createConversation: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/messages/conversations', data),

  getMessages: (conversationId: string, params?: any): Promise<AxiosResponse<ApiResponse<MessagesResponse>>> =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),

  sendMessage: (conversationId: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/messages/conversations/${conversationId}/messages`, data),

  markAsRead: (conversationId: string, messageId: string): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/messages/conversations/${conversationId}/messages/${messageId}/read`),

  uploadAttachment: (conversationId: string, file: File): Promise<AxiosResponse<ApiResponse>> => {
    const formData = new FormData();
    formData.append('attachment', file);
    return api.post(`/messages/conversations/${conversationId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Search API
export const searchAPI = {
  search: (params: any): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/search', { params }),

  getSuggestions: (query: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/search/suggestions', { params: { q: query } }),

  saveSearch: (data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.post('/search/saved', data),

  getSavedSearches: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/search/saved'),

  deleteSavedSearch: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/search/saved/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getDashboardStats: (): Promise<AxiosResponse<ApiResponse>> => {
    // Add small delays between API calls to prevent rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    return Promise.allSettled([
      productsAPI.getMyProducts(),
      delay(100).then(() => auctionsAPI.getMyBids()),
      delay(200).then(() => messagesAPI.getConversations()),
      delay(300).then(() => api.get('/products/watchlist')),
    ]).then(([productsResult, bidsResult, conversationsResult, watchlistResult]) => {
      // Handle successful responses
      const productsRes = productsResult.status === 'fulfilled' ? productsResult.value : null;
      const bidsRes = bidsResult.status === 'fulfilled' ? bidsResult.value : null;
      const conversationsRes = conversationsResult.status === 'fulfilled' ? conversationsResult.value : null;
      const watchlistRes = watchlistResult.status === 'fulfilled' ? watchlistResult.value : null;
      
      // Log any failures for debugging
      if (productsResult.status === 'rejected') {
        console.error('Products API failed:', productsResult.reason);
      }
      if (bidsResult.status === 'rejected') {
        console.error('Bids API failed:', bidsResult.reason);
      }
      if (conversationsResult.status === 'rejected') {
        console.error('Conversations API failed:', conversationsResult.reason);
      }
      if (watchlistResult.status === 'rejected') {
        console.error('Watchlist API failed:', watchlistResult.reason);
      }
      
      const dashboardData = {
        totalProducts: productsRes?.data?.data?.products?.length || 0,
        activeAuctions: bidsRes?.data?.data?.bids?.filter((bid: any) => 
          bid.auction?.status === 'ACTIVE'
        )?.length || 0,
        totalMessages: conversationsRes?.data?.data?.conversations?.length || 0,
        watchlistItems: watchlistRes?.data?.data?.watchlistItems?.length || 0,
        recentProducts: productsRes?.data?.data?.products?.slice(0, 5) || [],
        recentBids: bidsRes?.data?.data?.bids?.slice(0, 5) || [],
        recentConversations: conversationsRes?.data?.data?.conversations?.slice(0, 5) || [],
      };
      
      return {
        data: {
          success: true,
          data: dashboardData,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      } as AxiosResponse<ApiResponse>;
    });
  },
};

// Admin API
export const adminAPI = {
  getDashboard: (): Promise<AxiosResponse<ApiResponse<AdminDashboardResponse>>> =>
    api.get('/admin/dashboard'),

  getUsers: (params?: any): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/admin/users', { params }),

  getUser: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.get(`/admin/users/${id}`),

  updateUser: (id: string, data: any): Promise<AxiosResponse<ApiResponse>> =>
    api.put(`/admin/users/${id}`, data),

  deleteUser: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.delete(`/admin/users/${id}`),

  verifyUser: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/admin/users/${id}/verify`),

  getProducts: (params?: any): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/admin/products', { params }),

  approveProduct: (id: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/admin/products/${id}/approve`),

  rejectProduct: (id: string, reason: string): Promise<AxiosResponse<ApiResponse>> =>
    api.post(`/admin/products/${id}/reject`, { reason }),

  getTransactions: (params?: any): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/admin/transactions', { params }),

  getAnalytics: (): Promise<AxiosResponse<ApiResponse>> =>
    api.get('/admin/analytics'),
};

export default api;
