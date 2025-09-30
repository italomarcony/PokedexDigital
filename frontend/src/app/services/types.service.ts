import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type TypeItem = { name: string; url: string };
export type TypeList = { results: TypeItem[] };
export type BasicPokemon = { name: string; url: string };
export type TypePokemonList = { count: number; results: BasicPokemon[] };

@Injectable({ providedIn: 'root' })
export class TypesService {
  private http = inject(HttpClient);

  listTypes() {
    return this.http.get<TypeList>('/api/type');
  }

  listByType(name: string) {
    return this.http.get<TypePokemonList>(`/api/type/${name}`);
  }
}



