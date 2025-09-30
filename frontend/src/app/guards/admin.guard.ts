import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const user = auth.currentUser();

  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (!user.isAdmin) {
    alert('Acesso negado. Apenas administradores podem acessar esta área.');
    router.navigate(['/']);
    return false;
  }

  return true;
};