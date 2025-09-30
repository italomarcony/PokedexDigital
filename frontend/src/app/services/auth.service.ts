import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';

export type LoginResponse = { access_token: string; user: { id: number; nome: string; email: string; login: string; isAdmin: boolean } };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  token = signal<string | null>(this.readToken());
  currentUser = signal<LoginResponse['user'] | null>(null);

  private readToken() {
    return localStorage.getItem('token');
  }

  private writeToken(token: string | null) {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    this.token.set(token);
  }

  login(login: string, senha: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { login, senha });
  }

  register(nome: string, login: string, email: string, senha: string) {
    return this.http.post('/api/auth/register', { nome, login, email, senha });
  }

  setSession(resp: LoginResponse) {
    this.writeToken(resp.access_token);
    this.currentUser.set(resp.user);
  }

  fetchCurrentUser() {
    return this.loadMe().pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  private loadMe() {
    return this.http.get<LoginResponse['user']>('/api/auth/me');
  }

  logout() {
    this.writeToken(null);
    this.currentUser.set(null);
  }

  listUsers() {
    return this.http.get<Array<{
      id: number;
      nome: string;
      dtInclusao: string | null;
    }>>('/api/auth/users');
  }

  deleteUser(userId: number) {
    return this.http.delete<{ msg: string }>(`/api/auth/users/${userId}`);
  }
}
