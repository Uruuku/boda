import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['es', 'en', 'sq'];
const defaultLocale = 'es';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorar rutas de la API, archivos estáticos (imágenes) y recursos internos de Next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Comprobar si la ruta ya tiene un idioma (ej: /en/algo)
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Si no tiene idioma, intentar leer la preferencia del navegador
  const acceptLanguage = request.headers.get('accept-language');
  let preferredLocale = defaultLocale;

  if (acceptLanguage) {
    const parsedLangs = acceptLanguage
      .split(',')
      .map((l) => l.split(';')[0].trim().substring(0, 2));
    const matched = parsedLangs.find((l) => locales.includes(l));
    if (matched) preferredLocale = matched;
  }

  // Redirigir a la URL con el idioma
  request.nextUrl.pathname = `/${preferredLocale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)'],
};