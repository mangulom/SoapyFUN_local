import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token=typeof localStorage!=='undefined'?localStorage.getItem('soapyfun_token'):null;
  const user=typeof localStorage!=='undefined'?localStorage.getItem('soapyfun_usuario'):null;
  return token && user ? true : router.createUrlTree(['/login']);
};
