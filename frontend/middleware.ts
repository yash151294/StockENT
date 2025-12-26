import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/products/create',
  '/messages',
  '/profile',
  '/watchlist',
  '/cart',
  '/checkout',
  '/negotiations',
];

// Routes that require admin role
const adminRoutes = ['/admin'];

// Routes that require buyer role
const buyerRoutes = ['/cart', '/checkout'];

// Routes that require seller role
const sellerRoutes = ['/products/create'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get auth token from cookies
  const token = request.cookies.get('accessToken')?.value;
  const userRole = request.cookies.get('userRole')?.value;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route is admin-only
  const isAdminRoute = adminRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route is buyer-only
  const isBuyerRoute = buyerRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route is seller-only
  const isSellerRoute = sellerRoutes.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminRoute && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check buyer access
  if (isBuyerRoute && userRole !== 'BUYER') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check seller access
  if (isSellerRoute && userRole !== 'SELLER' && userRole !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check edit product route - user must be authenticated
  if (pathname.match(/^\/products\/[^/]+\/edit$/)) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/products/create',
    '/products/:id/edit',
    '/messages/:path*',
    '/profile/:path*',
    '/watchlist/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/negotiations/:path*',
    '/admin/:path*',
  ],
};
