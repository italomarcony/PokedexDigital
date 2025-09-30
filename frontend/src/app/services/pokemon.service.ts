export type PagedResult<T> = { count: number; next: string | null; previous: string | null; results: T[] };
export type BasicPokemon = { name: string; url: string };

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PokemonService {
  private http = inject(HttpClient);

  list(limit = 1302, offset = 0): Observable<PagedResult<BasicPokemon>> {
    // Se pedir todos (1302), fazer duas requisições
    if (limit === 1302 && offset === 0) {
      return forkJoin([
        this.http.get<PagedResult<BasicPokemon>>(`/api/pokemon?limit=1000&offset=0`),
        this.http.get<PagedResult<BasicPokemon>>(`/api/pokemon?limit=302&offset=1000`)
      ]).pipe(
        map(([first, second]) => ({
          count: 1302,
          next: null,
          previous: null,
          results: [...first.results, ...second.results]
        }))
      );
    }
    return this.http.get<PagedResult<BasicPokemon>>(`/api/pokemon?limit=${limit}&offset=${offset}`);
  }

  detail(name: string) {
    return this.http.get(`/api/pokemon/${name}`);
  }
}
