import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/jwt';

const protectedRoutes = ['/dashboard', '/profile', '/capture', '/documents', '/items', '/study', '/dictation'];

export async function middleware(req: NextRequest) {
  const session = await getSession();
  const { pathname } = req.nextUrl;

  if (protectedRoutes.includes(pathname) && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};