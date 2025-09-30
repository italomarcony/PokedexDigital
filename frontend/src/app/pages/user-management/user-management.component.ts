import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface User {
  id: number;
  nome: string;
  dtInclusao: string | null;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="max-width: 1200px; margin: 30px auto; padding: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
        <h2 style="margin: 0; color: #333;">Gestão de Usuários</h2>
        <button
          routerLink="/"
          style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
        >
          Voltar
        </button>
      </div>

      <p *ngIf="msg" style="color: #4caf50; padding: 12px; background: #e8f5e9; border-radius: 4px; margin-bottom: 20px;">
        {{ msg }}
      </p>

      <p *ngIf="error" style="color: #f44336; padding: 12px; background: #ffebee; border-radius: 4px; margin-bottom: 20px;">
        {{ error }}
      </p>

      <div *ngIf="loading" style="text-align: center; padding: 40px; color: #666;">
        Carregando usuários...
      </div>

      <div *ngIf="!loading && users.length === 0" style="text-align: center; padding: 40px; color: #666;">
        Nenhum usuário cadastrado.
      </div>

      <div *ngIf="!loading && users.length > 0" style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white;">
              <th style="padding: 15px; text-align: left; font-weight: 600;">ID</th>
              <th style="padding: 15px; text-align: left; font-weight: 600;">Nome</th>
              <th style="padding: 15px; text-align: left; font-weight: 600;">Data Cadastro</th>
              <th style="padding: 15px; text-align: center; font-weight: 600;">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users; let i = index"
                [style.background]="i % 2 === 0 ? '#f9f9f9' : 'white'"
                style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px;">{{ user.id }}</td>
              <td style="padding: 12px;">
                <span>{{ user.nome }}</span>
                <span *ngIf="isCurrentUser(user.id)"
                      style="margin-left: 8px; padding: 2px 8px; background: #667eea; color: white; border-radius: 12px; font-size: 11px; font-weight: 600;">
                  VOCÊ
                </span>
              </td>
              <td style="padding: 12px;">{{ formatDate(user.dtInclusao) }}</td>
              <td style="padding: 12px; text-align: center;">
                <button
                  *ngIf="!isCurrentUser(user.id)"
                  (click)="confirmDelete(user)"
                  style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; transition: background 0.2s;"
                  onmouseover="this.style.background='#d32f2f'"
                  onmouseout="this.style.background='#f44336'"
                >
                  Deletar
                </button>
                <span *ngIf="isCurrentUser(user.id)" style="color: #999; font-size: 14px;">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Modal de confirmação -->
      <div *ngIf="userToDelete"
           style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;"
           (click)="cancelDelete()">
        <div style="background: white; padding: 30px; border-radius: 8px; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"
             (click)="$event.stopPropagation()">
          <h3 style="margin: 0 0 15px 0; color: #333;">Confirmar Deleção</h3>
          <p style="color: #666; margin-bottom: 20px;">
            Tem certeza que deseja deletar o usuário <strong>{{ userToDelete.nome }}</strong>?
          </p>
          <p style="color: #f44336; font-size: 14px; margin-bottom: 25px;">
            Esta ação não pode ser desfeita.
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button
              (click)="cancelDelete()"
              style="padding: 10px 20px; background: #ddd; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
            >
              Cancelar
            </button>
            <button
              (click)="deleteUser()"
              style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
            >
              Deletar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserManagementComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  users: User[] = [];
  loading = false;
  msg = '';
  error = '';
  userToDelete: User | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.msg = '';
    this.error = '';

    this.auth.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.msg || 'Erro ao carregar usuários';
        this.loading = false;
      }
    });
  }

  isCurrentUser(userId: number): boolean {
    const currentUser = this.auth.currentUser();
    return currentUser?.id === userId;
  }

  confirmDelete(user: User) {
    this.userToDelete = user;
  }

  cancelDelete() {
    this.userToDelete = null;
  }

  deleteUser() {
    if (!this.userToDelete) return;

    const userId = this.userToDelete.id;
    this.userToDelete = null;

    this.auth.deleteUser(userId).subscribe({
      next: (resp) => {
        this.msg = resp.msg || 'Usuário deletado com sucesso';
        this.loadUsers();
        setTimeout(() => this.msg = '', 3000);
      },
      error: (err) => {
        this.error = err?.error?.msg || 'Erro ao deletar usuário';
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }
}