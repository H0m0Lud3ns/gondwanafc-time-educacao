import { defineMiddleware } from 'astro:middleware';

const protectedAdminPaths = ['/admin', '/admin/'];

function isAdminPath(pathname: string) {
  return protectedAdminPaths.some((path) => pathname === path || pathname.startsWith('/admin/'));
}

function unauthorized(message = 'Area protegida.') {
  return new Response(message, {
    status: 401,
    headers: {
      'www-authenticate': 'Basic realm="Gondwana FC CMS", charset="UTF-8"',
      'cache-control': 'no-store',
    },
  });
}

export const onRequest = defineMiddleware((context, next) => {
  if (!isAdminPath(context.url.pathname)) return next();

  const password = import.meta.env.CMS_ADMIN_PASSWORD || import.meta.env.CMS_PRODUCTION_PASSWORD;
  if (!password) {
    return new Response('CMS_ADMIN_PASSWORD ausente no ambiente.', {
      status: 503,
      headers: { 'cache-control': 'no-store' },
    });
  }

  const header = context.request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return unauthorized();

  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(':');
    const user = separator >= 0 ? decoded.slice(0, separator) : '';
    const pass = separator >= 0 ? decoded.slice(separator + 1) : decoded;

    if (user === 'gondwana' && pass === password) return next();
  } catch {
    return unauthorized();
  }

  return unauthorized('Credenciais invalidas.');
});
