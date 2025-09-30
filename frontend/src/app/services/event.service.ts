import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private pokemonUpdatedSubject = new Subject<void>();
  
  // Observable para componentes ouvirem
  pokemonUpdated$ = this.pokemonUpdatedSubject.asObservable();
  
  // Método para emitir evento quando Pokémon for atualizado
  emitPokemonUpdated(): void {
    this.pokemonUpdatedSubject.next();
  }
}



