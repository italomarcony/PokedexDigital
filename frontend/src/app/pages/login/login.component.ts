import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  template: `
    <style>
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
    <div style="max-width: 400px; margin: 50px auto; padding: 20px;">
      <h2 style="margin-bottom: 32px;">Login</h2>
      <form (ngSubmit)="submit()" #f="ngForm" style="display:flex; flex-direction:column; gap:12px;">
        <input
          name="login"
          [(ngModel)]="login"
          placeholder="Login"
          required
          style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <input
          name="senha"
          [(ngModel)]="senha"
          type="password"
          placeholder="Senha"
          required
          style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <button
          type="submit"
          [disabled]="isLoading"
          style="padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;"
          [style.opacity]="isLoading ? '0.7' : '1'"
          [style.cursor]="isLoading ? 'not-allowed' : 'pointer'"
        >
          <span *ngIf="isLoading" style="display: inline-block; width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
          <span>{{ isLoading ? 'Entrando...' : 'Entrar' }}</span>
        </button>
      </form>

      <p *ngIf="error" style="color: #f44336; margin-top: 15px; padding: 10px; background: #ffebee; border-radius: 4px;">
        {{ error }}
      </p>

      <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
        <a routerLink="/reset-password" style="color: #ff6b35; text-decoration: none; font-size: 14px;">
          Esqueceu sua senha?
        </a>
        <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 5px;">
          <span style="color: #666; font-size: 14px;">Não tem uma conta? </span>
          <a routerLink="/register" style="color: #ff6b35; text-decoration: none; font-weight: 600;">
            Registrar-se
          </a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  login = '';
  senha = '';
  error = '';
  isLoading = false; // OTIMIZAÇÃO: Estado de loading

  submit() {
    this.error = '';
    this.isLoading = true; // OTIMIZAÇÃO: Ativa loading

    this.auth.login(this.login, this.senha).subscribe({
      next: (resp) => {
        this.auth.setSession(resp);
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.error = err?.error?.msg || 'Falha no login';
        this.isLoading = false; // OTIMIZAÇÃO: Desativa loading em erro
      },
      complete: () => {
        this.isLoading = false; // OTIMIZAÇÃO: Desativa loading ao completar
      }
    })
  }
}



