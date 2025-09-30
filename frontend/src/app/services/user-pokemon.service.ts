import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { EventService } from './event.service';

export type UserPokemonPayload = {
  IDTipoPokemon?: number | null;
  Codigo: string; // e.g., numeric id or name
  ImagemUrl?: string | null;
  Nome: string;
  Favorito?: boolean;
  GrupoBatalha?: boolean;
};

@Injectable({ providedIn: 'root' })
export class UserPokemonService {
  private http = inject(HttpClient);
  private eventService = inject(EventService);

  getFavorites() {
    return this.http.get<any[]>('/api/me/favorites');
  }

  addFavorite(p: UserPokemonPayload) {
    return this.http.post('/api/me/favorites', { ...p, Favorito: true }).pipe(
      tap(() => this.eventService.emitPokemonUpdated())
    );
  }

  removeFavorite(idPokemonUsuario: number) {
    return this.http.delete(`/api/me/favorites/${idPokemonUsuario}`).pipe(
      tap(() => this.eventService.emitPokemonUpdated())
    );
  }

  getTeam() {
    return this.http.get<any[]>('/api/me/team');
  }

  addToTeam(p: UserPokemonPayload) {
    return this.http.post('/api/me/team', { ...p, GrupoBatalha: true }).pipe(
      tap(() => this.eventService.emitPokemonUpdated())
    );
  }

  removeFromTeam(idPokemonUsuario: number) {
    return this.http.delete(`/api/me/team/${idPokemonUsuario}`).pipe(
      tap(() => this.eventService.emitPokemonUpdated())
    );
  }
}
