import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Public routes (no authentication required)
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/api/auth',
];

// Routes that require business context
const businessRoutes = [
  '/dashboard',
  '/api/businesses',
  '/api/orders',
  '/api/products',
  '/api/appointments',
];

// Core middleware logic – retrieves token via getToken()
async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  const requiresBusiness = businessRoutes.some(route => pathname.startsWith(route));

  if (requiresBusiness && token) {
    const businessId = token.businessId as string | null;
    const businessSlug = token.businessSlug as string | null;
    const role = token.role as string;

    // Platform admin can access everything
    if (role === 'PLATFORM_ADMIN') {
      return NextResponse.next();
    }

    // Business users must have a businessSlug
    if (!businessSlug) {
      return NextResponse.redirect(new URL('/auth/no-business', request.url));
    }

    // For API routes – inject businessId & role into headers
    if (pathname.startsWith('/api')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-business-id', businessId || '');
      requestHeaders.set('x-user-role', role);
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }

    // For dashboard routes – ensure URL slug matches user's businessSlug
    const match = pathname.match(/\/dashboard\/([^\/]+)/);
    if (match && match[1] !== businessSlug) {
      return NextResponse.redirect(new URL(`/dashboard/${businessSlug}`, request.url));
    }
  }

  return NextResponse.next();
}

// Wrap with NextAuth's authorization helper and export as default
export default withAuth(middleware, {
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;
      // Allow public routes without a token
      if (publicRoutes.some(route => pathname.startsWith(route))) {
        return true;
      }
      // All other routes require a valid token
      return !!token;
    },
  },
});

// Match all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|uploads).*)',
  ],
};