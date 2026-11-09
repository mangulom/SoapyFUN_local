import { HttpInterceptorFn } from '@angular/common/http';

/** Attach the session token to authenticated API requests. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest = request.url.startsWith('/api/') || /\/api\//.test(request.url);
  if (!isApiRequest || request.url.includes('/api/auth/login')) return next(request);
  const token = localStorage.getItem('soapyfun_token');
  if (!token) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
