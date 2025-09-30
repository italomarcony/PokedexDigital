import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService, BasicPokemon } from '../../services/pokemon.service';
import { UserPokemonService } from '../../services/user-pokemon.service';
import { TypesService, TypeItem } from '../../services/types.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

interface PokemonDetail {
  id: number;
  name: string;
  url: string;
  types: Array<{type: {name: string}}>;
  stats: Array<{base_stat: number, stat: {name: string}}>;
}

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  template: `
    <div *ngIf="toast()"
         [ngClass]="{'toast-success': toast()?.type === 'success', 'toast-error': toast()?.type === 'error'}"
         class="toast">
      {{ toast()?.message }}
    </div>

    <h2>Pokémon</h2>
    <div style="margin: 8px 0; display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
      <div style="display:flex; gap:8px; align-items:center;">
        <label for="genSel">Geração:</label>
        <select id="genSel" (change)="onGenerationChange($any($event.target).value)">
          <option value="">Todas</option>
          <option value="1">Geração 1</option>
          <option value="2">Geração 2</option>
          <option value="3">Geração 3</option>
          <option value="4">Geração 4</option>
          <option value="5">Geração 5</option>
          <option value="6">Geração 6</option>
          <option value="7">Geração 7</option>
          <option value="8">Geração 8</option>
          <option value="9">Geração 9</option>
          <option value="10">Formas Especiais</option>
        </select>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <label for="typeSel">Tipo:</label>
        <select id="typeSel" (change)="onTypeChange($any($event.target).value)">
          <option value="">Todos</option>
          <option *ngFor="let t of types()" [value]="t.name">{{ t.name }}</option>
        </select>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <label for="searchInput">Buscar:</label>
        <input
          id="searchInput"
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Nome do Pokémon..."
          style="padding:6px 12px; border:1px solid #ddd; border-radius:4px; min-width:200px;"
        />
      </div>
      <span style="color:#666; font-size:14px;">{{ totalFilteredCount() }} Pokémon(s) | Página {{ currentPage() }} de {{ totalPages() }}</span>
    </div>
    <p *ngIf="error()" style="color:red;">{{ error() }}</p>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:16px;">
      <div *ngFor="let p of filteredPokemons()"
           style="border:2px solid #ddd; border-radius:12px; padding:12px; text-align:center; position:relative; background:white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="position:absolute; top:8px; right:8px; display:flex; gap:4px; z-index:1;">
          <span *ngIf="isFavorite(p)"
                style="background:#ffd700; color:#000; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:600;">
            ⭐ Fav
          </span>
          <span *ngIf="isInTeam(p)"
                style="background:#4caf50; color:#fff; padding:4px 8px; border-radius:12px; font-size:11px; font-weight:600;">
            ⚔️ Equipe
          </span>
        </div>

        <!-- Número da Pokédex -->
        <div style="position:absolute; top:8px; left:8px; background:#667eea; color:white; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:700;">
          #{{ getPokemonId(p) }}
        </div>

        <div style="margin-top:24px;">
          <img [src]="getImageUrl(p)" alt="{{ p.name }}" width="96" height="96" style="image-rendering: pixelated;" />
        </div>

        <div style="margin:8px 0; text-transform:capitalize; font-weight:600; font-size:15px;">{{ p.name }}</div>

        <!-- Tipos -->
        <div style="display:flex; gap:6px; justify-content:center; margin:8px 0; flex-wrap:wrap;">
          <span *ngFor="let type of getPokemonTypes(p)"
                [style.background]="getTypeColor(type)"
                style="color:white; padding:4px 12px; border-radius:14px; font-size:11px; font-weight:600; text-transform:uppercase;">
            {{ type }}
          </span>
        </div>

        <!-- Stats -->
        <div style="margin:10px 0; text-align:left; background:#f9f9f9; padding:8px; border-radius:6px; font-size:11px;">
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:4px;">
            <div><strong>HP:</strong> {{ getPokemonStat(p, 'hp') }}</div>
            <div><strong>ATK:</strong> {{ getPokemonStat(p, 'attack') }}</div>
            <div><strong>DEF:</strong> {{ getPokemonStat(p, 'defense') }}</div>
            <div><strong>SPD:</strong> {{ getPokemonStat(p, 'speed') }}</div>
          </div>
        </div>

        <div style="display:flex; gap:8px; justify-content:center; margin-top:10px;">
          <button (click)="favorite(p)" style="flex:1; padding:8px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px;">
            Favoritar
          </button>
          <button (click)="addToTeam(p)" style="flex:1; padding:8px; background:#4caf50; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px;">
            Equipe
          </button>
        </div>
      </div>
    </div>

    <!-- Paginação -->
    <div *ngIf="totalPages() > 1" style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top:24px; padding:20px;">
      <button
        (click)="goToPage(1)"
        [disabled]="currentPage() === 1"
        style="padding:8px 16px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;"
        [style.opacity]="currentPage() === 1 ? '0.5' : '1'"
        [style.cursor]="currentPage() === 1 ? 'not-allowed' : 'pointer'">
        Primeira
      </button>
      <button
        (click)="previousPage()"
        [disabled]="currentPage() === 1"
        style="padding:8px 16px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;"
        [style.opacity]="currentPage() === 1 ? '0.5' : '1'"
        [style.cursor]="currentPage() === 1 ? 'not-allowed' : 'pointer'">
        ← Anterior
      </button>
      <span style="padding:8px 16px; background:#f0f0f0; border-radius:6px; font-weight:600;">
        Página {{ currentPage() }} de {{ totalPages() }}
      </span>
      <button
        (click)="nextPage()"
        [disabled]="currentPage() === totalPages()"
        style="padding:8px 16px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;"
        [style.opacity]="currentPage() === totalPages() ? '0.5' : '1'"
        [style.cursor]="currentPage() === totalPages() ? 'not-allowed' : 'pointer'">
        Próxima →
      </button>
      <button
        (click)="goToPage(totalPages())"
        [disabled]="currentPage() === totalPages()"
        style="padding:8px 16px; background:#667eea; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:600;"
        [style.opacity]="currentPage() === totalPages() ? '0.5' : '1'"
        [style.cursor]="currentPage() === totalPages() ? 'not-allowed' : 'pointer'">
        Última
      </button>
    </div>
  `,
  styles: [`
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
export class PokemonListComponent implements OnInit {
  private pokemonService = inject(PokemonService);
  private userPokemonService = inject(UserPokemonService);
  private typesService = inject(TypesService);
  private authService = inject(AuthService);

  pokemons = signal<BasicPokemon[]>([]);
  allPokemons = signal<BasicPokemon[]>([]);
  error = signal<string>('');
  types = signal<TypeItem[]>([]);
  currentType = signal<string>('');
  currentGeneration = signal<string>('');
  searchTerm = signal<string>('');

  userFavorites = signal<any[]>([]);
  userTeam = signal<any[]>([]);
  toast = signal<{message: string, type: 'success' | 'error'} | null>(null);

  // Cache de detalhes dos Pokémon
  pokemonDetailsCache = new Map<string, PokemonDetail>();

  // Paginação
  currentPage = signal<number>(1);
  itemsPerPage = 50;

  generationRanges: { [key: string]: { offset: number; limit: number } } = {
    '1': { offset: 0, limit: 151 },      // Pokémon 1-151
    '2': { offset: 151, limit: 100 },    // Pokémon 152-251
    '3': { offset: 251, limit: 135 },    // Pokémon 252-386
    '4': { offset: 386, limit: 107 },    // Pokémon 387-493
    '5': { offset: 493, limit: 156 },    // Pokémon 494-649
    '6': { offset: 649, limit: 72 },     // Pokémon 650-721
    '7': { offset: 721, limit: 88 },     // Pokémon 722-809
    '8': { offset: 809, limit: 96 },     // Pokémon 810-905
    '9': { offset: 905, limit: 120 },    // Pokémon 906-1025
    '10': { offset: 1025, limit: 277 }   // Pokémon 1026-1302 (Formas especiais, variantes regionais, etc)
  };

  filteredPokemons = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const filtered = search
      ? this.pokemons().filter(p => p.name.toLowerCase().includes(search))
      : this.pokemons();

    // Aplicar paginação
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return filtered.slice(start, end);
  });

  totalPages = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const filtered = search
      ? this.pokemons().filter(p => p.name.toLowerCase().includes(search))
      : this.pokemons();
    return Math.ceil(filtered.length / this.itemsPerPage);
  });

  totalFilteredCount = computed(() => {
    const search = this.searchTerm().toLowerCase().trim();
    const filtered = search
      ? this.pokemons().filter(p => p.name.toLowerCase().includes(search))
      : this.pokemons();
    return filtered.length;
  });

  ngOnInit() {
    this.loadUserData();
  }

  constructor() {
    this.loadDefault();
    this.typesService.listTypes().subscribe({
      next: (res) => {
        // Filtrar tipos "unknown" e "shadow"
        const filteredTypes = (res.results || []).filter(t =>
          t.name !== 'unknown' && t.name !== 'shadow'
        );
        this.types.set(filteredTypes);
      },
      error: () => {}
    });
  }

  loadUserData() {
    if (!this.authService.token()) return;

    this.userPokemonService.getFavorites().subscribe({
      next: (favs) => this.userFavorites.set(favs),
      error: () => {}
    });

    this.userPokemonService.getTeam().subscribe({
      next: (team) => this.userTeam.set(team),
      error: () => {}
    });
  }

  isFavorite(p: BasicPokemon): boolean {
    return this.userFavorites().some(f => f.Codigo.toLowerCase() === p.name.toLowerCase());
  }

  isInTeam(p: BasicPokemon): boolean {
    return this.userTeam().some(t => t.Codigo.toLowerCase() === p.name.toLowerCase());
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toast.set({message, type});
    setTimeout(() => this.toast.set(null), 3000);
  }

  loadDefault() {
    this.pokemonService.list().subscribe({
      next: (res) => {
        this.allPokemons.set(res.results);
        this.pokemons.set(res.results);
        // Carrega detalhes das primeiras 3 páginas (150 Pokémon) para melhor experiência
        this.loadPokemonDetails(res.results.slice(0, 150));
      },
      error: () => this.error.set('Falha ao carregar Pokémon. Tente recarregar a página.')
    });
  }

  loadPokemonDetails(pokemons: BasicPokemon[]) {
    const toLoad = pokemons.filter(p => !this.pokemonDetailsCache.has(p.name));

    if (toLoad.length === 0) return;

    // Carregar em batches de 25 para não sobrecarregar
    const batchSize = 25;
    const batches: BasicPokemon[][] = [];

    for (let i = 0; i < toLoad.length; i += batchSize) {
      batches.push(toLoad.slice(i, i + batchSize));
    }

    // Carrega os batches sequencialmente
    batches.forEach((batch, index) => {
      setTimeout(() => {
        const requests = batch.map(p => this.pokemonService.detail(p.name));
        forkJoin(requests).subscribe({
          next: (details) => {
            details.forEach((detail: any) => {
              this.pokemonDetailsCache.set(detail.name, detail);
            });
          },
          error: () => {}
        });
      }, index * 200); // 200ms de delay entre batches
    });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Carrega detalhes da página atual e próximas 2 páginas
    const start = (page - 1) * this.itemsPerPage;
    const allPokemons = this.searchTerm().toLowerCase().trim()
      ? this.pokemons().filter(p => p.name.toLowerCase().includes(this.searchTerm().toLowerCase()))
      : this.pokemons();
    this.loadPokemonDetails(allPokemons.slice(start, start + 150));
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.goToPage(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.goToPage(this.currentPage() - 1);
    }
  }

  onGenerationChange(generation: string) {
    this.currentGeneration.set(generation || '');
    this.currentType.set('');
    this.currentPage.set(1); // Reset para primeira página

    if (!generation) {
      this.pokemons.set(this.allPokemons());
      this.loadPokemonDetails(this.allPokemons().slice(0, 150));
      return;
    }

    const range = this.generationRanges[generation];
    if (range) {
      this.pokemonService.list(range.limit, range.offset).subscribe({
        next: (res) => {
          this.pokemons.set(res.results);
          // Carrega os primeiros 150 da geração selecionada
          this.loadPokemonDetails(res.results.slice(0, 150));
        },
        error: () => this.error.set('Falha ao filtrar por geração.')
      });
    }
  }

  onTypeChange(name: string) {
    this.currentType.set(name || '');
    this.currentGeneration.set('');
    this.currentPage.set(1); // Reset para primeira página

    if (!name) {
      this.pokemons.set(this.allPokemons());
      this.loadPokemonDetails(this.allPokemons().slice(0, 150));
      return;
    }
    this.typesService.listByType(name).subscribe({
      next: (res) => {
        this.pokemons.set(res.results);
        // Carrega os primeiros 150 do tipo selecionado
        this.loadPokemonDetails(res.results.slice(0, 150));
      },
      error: () => this.error.set('Falha ao filtrar por tipo.')
    });
  }

  getImageUrl(p: BasicPokemon) {
    // URL padrão de sprites oficial: precisa do id; extrair do "url" da PokéAPI
    const match = /\/pokemon\/(\d+)\/?$/.exec(p.url);
    const id = match ? match[1] : '1';
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  getPokemonId(p: BasicPokemon): string {
    const match = /\/pokemon\/(\d+)\/?$/.exec(p.url);
    return match ? match[1].padStart(3, '0') : '001';
  }

  getPokemonTypes(p: BasicPokemon): string[] {
    const detail = this.pokemonDetailsCache.get(p.name);
    if (!detail || !detail.types) return [];
    return detail.types.map(t => t.type.name);
  }

  getPokemonStat(p: BasicPokemon, statName: string): number {
    const detail = this.pokemonDetailsCache.get(p.name);
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

  favorite(p: BasicPokemon) {
    const name = p.name;
    const image = this.getImageUrl(p);
    this.userPokemonService.addFavorite({ Codigo: name, Nome: name, ImagemUrl: image, Favorito: true }).subscribe({
      next: () => {
        this.loadUserData();
        this.showToast(`${name} adicionado aos favoritos! ⭐`, 'success');
      },
      error: () => {
        this.showToast('Falha ao favoritar (precisa estar logado)', 'error');
      }
    });
  }

  addToTeam(p: BasicPokemon) {
    const name = p.name;
    const image = this.getImageUrl(p);
    this.userPokemonService.addToTeam({ Codigo: name, Nome: name, ImagemUrl: image, GrupoBatalha: true }).subscribe({
      next: () => {
        this.loadUserData();
        this.showToast(`${name} adicionado à equipe! ⚔️`, 'success');
      },
      error: (err) => {
        const msg = err?.error?.msg || 'Falha ao adicionar na equipe';
        this.showToast(msg, 'error');
      }
    });
  }
}


