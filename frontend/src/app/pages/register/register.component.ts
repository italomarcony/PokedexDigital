import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, NgIf, RouterLink],
  template: `
    <div style="max-width: 400px; margin: 50px auto; padding: 20px;">
      <h2>Criar Conta</h2>
      <form (ngSubmit)="submit()" #f="ngForm" style="display:flex; flex-direction:column; gap:12px;">
        <input
          name="nome"
          [(ngModel)]="nome"
          placeholder="Nome completo"
          required
          style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <input
          name="login"
          [(ngModel)]="login"
          placeholder="Login"
          required
          style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <input
          name="email"
          [(ngModel)]="email"
          type="email"
          placeholder="Email"
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
        <input
          name="confirmarSenha"
          [(ngModel)]="confirmarSenha"
          type="password"
          placeholder="Confirmar senha"
          required
          style="padding: 10px; border: 1px solid #ddd; border-radius: 4px;"
        />
        <button
          type="submit"
          style="padding: 12px; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
        >
          Registrar
        </button>
      </form>

      <p *ngIf="msg" style="color: #4caf50; margin-top: 15px; padding: 10px; background: #e8f5e9; border-radius: 4px;">
        {{ msg }}
      </p>

      <p *ngIf="error" style="color: #f44336; margin-top: 15px; padding: 10px; background: #ffebee; border-radius: 4px;">
        {{ error }}
      </p>

      <div style="margin-top: 20px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px;">
        <span style="color: #666; font-size: 14px;">Já tem uma conta? </span>
        <a routerLink="/login" style="color: #ff6b35; text-decoration: none; font-weight: 600;">
          Fazer Login
        </a>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  nome = '';
  login = '';
  email = '';
  senha = '';
  confirmarSenha = '';
  msg = '';
  error = '';

  submit() {
    this.msg = '';
    this.error = '';

    // Validar se as senhas coincidem
    if (this.senha !== this.confirmarSenha) {
      this.error = 'As senhas não coincidem';
      return;
    }

    // Validar comprimento mínimo da senha
    if (this.senha.length < 4) {
      this.error = 'A senha deve ter pelo menos 4 caracteres';
      return;
    }

    this.auth.register(this.nome, this.login, this.email, this.senha).subscribe({
      next: (resp: any) => {
        if (resp?.access_token) {
          this.auth.setSession(resp);
          this.router.navigateByUrl('/');
          return;
        }
        this.msg = 'Conta criada. Você já pode fazer login.';
        setTimeout(() => this.router.navigateByUrl('/login'), 800);
      },
      error: (err) => {
        if (err?.status === 409) {
          this.error = err?.error?.msg || 'Login ou e-mail já existente';
        } else if (err?.status === 400) {
          this.error = err?.error?.msg || 'Preencha todos os campos corretamente';
        } else {
          this.error = 'Falha ao registrar';
        }
      }
    });
  }
}
