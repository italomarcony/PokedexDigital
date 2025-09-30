import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { UserPokemonService } from '../../services/user-pokemon.service';
import { EventService } from '../../services/event.service';
import { PokemonService } from '../../services/pokemon.service';
import { AuthService } from '../../services/auth.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
import { Subscription, filter, forkJoin } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';

interface PokemonDetail {
  id: number;
  name: string;
  types: Array<{type: {name: string}}>;
  stats: Array<{base_stat: number, stat: {name: string}}>;
}

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, PokemonCardComponent],
  template: `
    <div *ngIf="toast()"
         [ngClass]="{'toast-success': toast()?.type === 'success', 'toast-error': toast()?.type === 'error'}"
         class="toast">
      {{ toast()?.message }}
    </div>

    <h2>Favoritos</h2>
    <p *ngIf="error()" style="color:red;">{{ error() }}</p>
    <div *ngIf="items().length === 0" style="text-align:center; padding:40px; color:#666;">
      <div style="font-size:48px; margin-bottom:16px;">⭐</div>
      <div style="font-size:18px; font-weight:600;">Nenhum favorito ainda.</div>
      <div style="margin-top:8px;">Adicione Pokémon aos seus favoritos para vê-los aqui!</div>
    </div>
    <div class="pokemon-grid">
      <app-pokemon-card
        *ngFor="let p of items()"
        [pokemon]="p"
        [detail]="pokemonDetailsCache.get(p.Codigo.toLowerCase())"
        [isFavorite]="true"
        [isInTeam]="false"
        [darkMode]="darkMode()"
        [showRemoveButton]="true"
        (onRemove)="remove(p)">
      </app-pokemon-card>
    </div>
  `,
  styles: [`
    .pokemon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 24px;
      padding: 16px 0;
    }

    @media (max-width: 768px) {
      .pokemon-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (min-width: 769px) and (max-width: 1024px) {
      .pokemon-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1025px) and (max-width: 1440px) {
      .pokemon-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (min-width: 1441px) {
      .pokemon-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .toast {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      background: #4caf50;
      color: white;
    }

    .toast-error {
      background: #f44336;
      color: white;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class FavoritesComponent implements OnInit, OnDestroy {
  private userService = inject(UserPokemonService);
  private eventService = inject(EventService);
  private router = inject(Router);
  private pokemonService = inject(PokemonService);
  private authService = inject(AuthService);
  private subscription?: Subscription;
  private navSub?: Subscription;
  items = signal<any[]>([]);
  error = signal<string>('');
  toast = signal<{message: string, type: 'success' | 'error'} | null>(null);
  pokemonDetailsCache = new Map<string, PokemonDetail>();
  darkMode = signal<boolean>(false);

  constructor() {
    // Carrega preferência de dark mode do localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      this.darkMode.set(true);
    }
  }

  ngOnInit() {
    this.reload();
    // Ouvir eventos de atualização
    this.subscription = this.eventService.pokemonUpdated$.subscribe(() => {
      this.reload();
    });
    // Recarregar quando a navegação retornar para /favorites
    this.navSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (this.router.url.startsWith('/favorites')) {
          this.reload();
        }
      });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
    this.navSub?.unsubscribe();
  }

  reload() {
    this.userService.getFavorites().subscribe({
      next: (list) => {
        this.items.set(list);
        this.loadPokemonDetails(list);
      },
      error: () => this.error.set('Falha ao carregar favoritos (necessário login).')
    });
  }

  loadPokemonDetails(pokemons: any[]) {
    const requests = pokemons
      .filter(p => !this.pokemonDetailsCache.has(p.Codigo.toLowerCase()))
      .map(p => this.pokemonService.detail(p.Codigo.toLowerCase()));

    if (requests.length === 0) return;

    forkJoin(requests).subscribe({
      next: (details) => {
        details.forEach((detail: any) => {
          this.pokemonDetailsCache.set(detail.name, detail);
        });
      },
      error: () => {}
    });
  }

  getPokemonId(p: any): string {
    const detail = this.pokemonDetailsCache.get(p.Codigo.toLowerCase());
    return detail ? String(detail.id).padStart(3, '0') : '001';
  }

  getPokemonTypes(p: any): string[] {
    const detail = this.pokemonDetailsCache.get(p.Codigo.toLowerCase());
    if (!detail || !detail.types) return [];
    return detail.types.map(t => t.type.name);
  }

  getPokemonStat(p: any, statName: string): number {
    const detail = this.pokemonDetailsCache.get(p.Codigo.toLowerCase());
    if (!detail || !detail.stats) return 0;
    const stat = detail.stats.find(s => s.stat.name === statName);
    return stat ? stat.base_stat : 0;
  }

  getTypeColor(type: string): string {
    const colors: {[key: string]: string} = {
      'normal': '#A8A878',
      'fire': '#F08030',
      'water': '#6890F0',
      'electric': '#F8D030',
      'grass': '#78C850',
      'ice': '#98D8D8',
      'fighting': '#C03028',
      'poison': '#A040A0',
      'ground': '#E0C068',
      'flying': '#A890F0',
      'psychic': '#F85888',
      'bug': '#A8B820',
      'rock': '#B8A038',
      'ghost': '#705898',
      'dragon': '#7038F8',
      'dark': '#705848',
      'steel': '#B8B8D0',
      'fairy': '#EE99AC'
    };
    return colors[type] || '#777';
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast.set({message, type});
    setTimeout(() => this.toast.set(null), 3000);
  }

  remove(pokemon: any) {
    this.userService.removeFavorite(pokemon.IDPokemonUsuario).subscribe({
      next: () => {
        this.items.set(this.items().filter(x => x.IDPokemonUsuario !== pokemon.IDPokemonUsuario));
        this.showToast(`${pokemon.Nome} removido dos favoritos!`, 'success');
      },
      error: () => {
        this.showToast('Falha ao remover favorito', 'error');
      }
    });
  }
}



