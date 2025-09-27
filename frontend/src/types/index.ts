// User types
export interface User {
  id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  country?: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Product types
export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  title: string;
  description: string;
  specifications: any;
  quantityAvailable: number;
  unit: string;
  minOrderQuantity: number;
  basePrice: number;
  currency: 'USD' | 'INR' | 'CNY' | 'TRY';
  location: string;
  city?: string;
  state?: string;
  country: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SOLD' | 'EXPIRED';
  listingType: 'FIXED_PRICE' | 'AUCTION' | 'NEGOTIABLE';
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  seller?: User;
  category?: Category;
  images?: ProductImage[];
  auction?: Auction;
  isInWatchlist?: boolean;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  path: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Auction types
export interface Auction {
  id: string;
  productId: string;
  auctionType: 'ENGLISH' | 'DUTCH' | 'SEALED_BID';
  startingPrice: number;
  reservePrice?: number;
  currentBid?: number;
  bidIncrement: number;
  startTime: string;
  endTime: string;
  startsAt: string; // Transformed field from backend
  endsAt: string; // Transformed field from backend
  minimumBid: number; // Transformed field from backend
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  winnerId?: string;
  bidCount: number;
  createdAt: string;
  updatedAt: string;
  product?: Product; // Relation from backend
  _count?: {
    bids: number;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Specific API response types
export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ProductResponse {
  product: Product;
}

export interface AuctionsResponse {
  auctions: Auction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachments: string[];
  readAt?: string;
  createdAt: string;
  isEncrypted?: boolean;
  sender?: {
    id: string;
    companyName: string;
    country: string;
    contactPerson?: string;
    email?: string;
    profileImageUrl?: string;
  };
}

export interface Conversation {
  id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  buyerAlias: string;
  sellerAlias: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  product?: Product;
  buyer?: User;
  seller?: User;
  messages?: Message[];
  _count?: {
    messages: number;
  };
}

// Conversations API Response
export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Messages API Response
export interface MessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Admin Dashboard types
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  activeProducts: number;
  totalAuctions: number;
  liveAuctions: number;
  totalConversations: number;
  totalMessages: number;
  userGrowth?: number;
  productGrowth?: number;
}

export interface AdminDashboardResponse {
  stats: AdminDashboardStats;
  recentUsers: User[];
  recentProducts: Product[];
}
