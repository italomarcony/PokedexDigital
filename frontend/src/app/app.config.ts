import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

import { routes } from './app.routes';

function apiBaseInterceptor(req: any, next: any) {
  const isApi = req.url.startsWith('/api/');
  const url = isApi ? 'http://localhost:5000' + req.url : req.url;
  return next(req.clone({ url }));
}

function authTokenInterceptor(req: any, next: any) {
  const auth = inject(AuthService);
  const token = auth.token();
  console.log('DEBUG: authTokenInterceptor', { url: req.url, hasToken: !!token });
  if (token) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiBaseInterceptor, authTokenInterceptor]))
  ]
};
