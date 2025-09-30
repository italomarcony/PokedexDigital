import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  template: `
    <div style="max-width: 400px; margin: 50px auto; padding: 20px;">
      <h2>Redefinir Senha</h2>
      <p style="color: #666; margin-bottom: 20px;">
        Digite seu login ou email e sua nova senha.
      </p>

      <form (ngSubmit)="submit()" #f="ngForm" style="display:flex; flex-direction:column; gap:12px;">
        <div>
          <label for="loginOrEmail">Login ou Email:</label>
          <input
            id="loginOrEmail"
            name="loginOrEmail"
            [(ngModel)]="loginOrEmail"
            placeholder="Digite seu login ou email"
            required
            style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>

        <div>
          <label for="novaSenha">Nova Senha:</label>
          <input
            id="novaSenha"
            name="novaSenha"
            [(ngModel)]="novaSenha"
            type="password"
            placeholder="Digite a nova senha"
            required
            style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>

        <div>
          <label for="confirmarSenha">Confirmar Senha:</label>
          <input
            id="confirmarSenha"
            name="confirmarSenha"
            [(ngModel)]="confirmarSenha"
            type="password"
            placeholder="Confirme a nova senha"
            required
            style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;"
          />
        </div>

        <button
          type="submit"
          [disabled]="loading()"
          style="padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; margin-top: 10px;"
        >
          {{ loading() ? 'Processando...' : 'Redefinir Senha' }}
        </button>
      </form>

      <p *ngIf="error()" style="color: #f44336; margin-top: 15px; padding: 10px; background: #ffebee; border-radius: 4px;">
        {{ error() }}
      </p>

      <p *ngIf="success()" style="color: #4caf50; margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
        {{ success() }}
      </p>

      <div style="margin-top: 20px; text-align: center;">
        <a routerLink="/login" style="color: #ff6b35; text-decoration: none;">
          Voltar para o Login
        </a>
      </div>
    </div>
  `,
})
export class ResetPasswordComponent {
  private http = inject(HttpClient);
  private router = inject(Router);

  loginOrEmail = '';
  novaSenha = '';
  confirmarSenha = '';
  error = signal<string>('');
  success = signal<string>('');
  loading = signal<boolean>(false);

  submit() {
    this.error.set('');
    this.success.set('');

    if (!this.loginOrEmail || !this.novaSenha || !this.confirmarSenha) {
      this.error.set('Preencha todos os campos');
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.error.set('As senhas não coincidem');
      return;
    }

    if (this.novaSenha.length < 4) {
      this.error.set('A senha deve ter pelo menos 4 caracteres');
      return;
    }

    this.loading.set(true);

    this.http.post('/api/auth/reset-password', {
      loginOrEmail: this.loginOrEmail,
      novaSenha: this.novaSenha
    }).subscribe({
      next: (resp: any) => {
        this.loading.set(false);
        this.success.set(resp.msg || 'Senha alterada com sucesso!');
        this.loginOrEmail = '';
        this.novaSenha = '';
        this.confirmarSenha = '';

        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 2000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.msg || 'Erro ao redefinir senha');
      }
    });
  }
}