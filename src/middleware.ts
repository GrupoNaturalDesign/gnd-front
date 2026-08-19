import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { AUTH_COOKIE_NAME } from '@/lib/auth-config';
import { AUTH_CALLBACK_PARAM, getSafeCallbackPath } from '@/lib/auth-callback-url';
import {
  getMaintenanceBlockScope,
  shouldBlockClientApiRoute,
} from '@/lib/maintenance-routes';
import { LEGACY_SEO_REDIRECTS } from '@/app/utils/sitemap-data';

function redirectLegacySeoPath(req: NextRequest, pathname: string): NextResponse | null {
  const target = LEGACY_SEO_REDIRECTS[pathname];
  if (!target) return null;

  const url = req.nextUrl.clone();
  const hashIndex = target.indexOf('#');
  if (hashIndex >= 0) {
    url.pathname = target.slice(0, hashIndex) || '/';
    url.hash = target.slice(hashIndex + 1);
  } else {
    url.pathname = target;
    url.hash = '';
  }
  url.search = '';
  return NextResponse.redirect(url, 301);
}

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/onboarding',
  '/auth/error',
  '/auth/action',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/manifest.webmanifest',
  '/manifest.json',
];
const isPublicPath = (pathname: string) =>
  publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
  pathname.startsWith('/producto') ||
  pathname.startsWith('/shoponline') ||
  pathname.startsWith('/mayorista') ||
  pathname.startsWith('/personalizados') ||
  pathname.startsWith('/politicas-cambio') ||
  pathname.startsWith('/api/');

const isAdminPath = (pathname: string) => pathname.startsWith('/admin');
const isAuthPath = (pathname: string) => pathname.startsWith('/auth');

function isAdminRole(role: unknown): boolean {
  return role === 'ADMIN' || (Array.isArray(role) && role.includes('ADMIN'));
}

function maintenanceJsonResponse(scope: 'public' | 'admin'): NextResponse {
  const isAdmin = scope === 'admin';
  return NextResponse.json(
    {
      success: false,
      error: 'Servicio en mantenimiento',
      message: isAdmin
        ? 'El panel de administración no está disponible temporalmente.'
        : 'La tienda no está disponible temporalmente.',
      code: 'MAINTENANCE',
      scope,
    },
    { status: 503 }
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const legacyRedirect = redirectLegacySeoPath(req, pathname);
  if (legacyRedirect) return legacyRedirect;

  if (pathname.startsWith('/categoria')) {
    const url = req.nextUrl.clone();
    url.pathname = '/shoponline';
    url.search = '';
    url.hash = '';
    return NextResponse.redirect(url, 301);
  }

  if (pathname.startsWith('/api/')) {
    const apiScope = shouldBlockClientApiRoute(pathname);
    if (apiScope) {
      return maintenanceJsonResponse(apiScope);
    }
    return NextResponse.next();
  }

  const maintenanceScope = getMaintenanceBlockScope(pathname);
  if (maintenanceScope) {
    const url = req.nextUrl.clone();
    url.pathname = '/maintenance';
    url.search = `?scope=${maintenanceScope}`;
    const res = NextResponse.redirect(url, 307);
    res.headers.set('Retry-After', '1800');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
  // En desarrollo, evitar HTTPS en localhost (evita ERR_SSL_PROTOCOL_ERROR)
  if (process.env.NODE_ENV === 'development' && req.nextUrl.protocol === 'https:' && req.nextUrl.hostname === 'localhost') {
    const httpUrl = new URL(req.nextUrl);
    httpUrl.protocol = 'http:';
    return NextResponse.redirect(httpUrl);
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const secret = process.env.AUTH_COOKIE_SECRET || process.env.JWT_SECRET;

  // Rutas públicas: admin autenticado → dashboard (excepto /auth/* para re-sincronizar Firebase)
  if (isPublicPath(pathname)) {
    if (token && secret && !isAuthPath(pathname)) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        const role = (payload as { role?: string | string[] }).role;
        if (isAdminRole(role)) {
          return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
        }
      } catch {
        // Token inválido, dejar pasar como usuario anónimo
      }
    }
    return NextResponse.next();
  }

  if (!token || !secret) {
    const loginUrl = new URL('/auth/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const p = payload as { needsOnboarding?: boolean; needsEmailVerification?: boolean; role?: string | string[] };
    if (pathname.startsWith('/auth/onboarding') || pathname.startsWith('/auth/verify-email')) {
      return NextResponse.next();
    }
    if (p.needsEmailVerification) {
      const target = new URL('/auth/verify-email', req.nextUrl);
      target.searchParams.set(AUTH_CALLBACK_PARAM, getSafeCallbackPath(pathname));
      return NextResponse.redirect(target);
    }
    if (p.needsOnboarding) {
      const target = new URL('/auth/onboarding', req.nextUrl);
      target.searchParams.set(AUTH_CALLBACK_PARAM, getSafeCallbackPath(pathname));
      return NextResponse.redirect(target);
    }
    // Admin autenticado solo en /admin; si intenta ir a otra ruta protegida, al dashboard
    if (isAdminRole(p.role) && !isAdminPath(pathname) && !isAuthPath(pathname)) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
  } catch {
    const loginUrl = new URL('/auth/login', req.nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
