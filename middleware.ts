import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRODUCTION_HOST = 'annamaiaart.com';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') ?? '';
  const response = NextResponse.next();

  // Block indexing of all non-production deployments (vercel.app, preview URLs, etc.)
  if (!host.includes(PRODUCTION_HOST)) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  return response;
}

export const config = {
  // Run on all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
