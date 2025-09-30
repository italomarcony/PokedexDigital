import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonService, BasicPokemon } from '../../services/pokemon.service';
import { UserPokemonService } from '../../services/user-pokemon.service';
import { TypesService, TypeItem } from '../../services/types.service';
import { AuthService } from '../../services/auth.service';
import { PokemonCardComponent } from '../../components/pokemon-card/pokemon-card.component';
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
  imports: [NgFor, NgIf, NgClass, FormsModule, PokemonCardComponent],
  template: `
    <div [class.dark-mode]="darkMode()" class="page-container">
      <div *ngIf="toast()"
           [ngClass]="{'toast-success': toast()?.type === 'success', 'toast-error': toast()?.type === 'error'}"
           class="toast">
        {{ toast()?.message }}
      </div>

      <!-- Dark Mode Toggle -->
      <div class="dark-mode-toggle">
        <button (click)="toggleDarkMode()" class="toggle-btn">
          <span *ngIf="!darkMode()">🌙 Modo Escuro</span>
          <span *ngIf="darkMode()">☀️ Modo Claro</span>
        </button>
      </div>

      <div class="page-header">
        <h2 class="page-title">Pokémon Descobertos</h2>
        <p class="page-description">Explore e descubra informações sobre todos os Pokémon</p>
      </div>

    <div class="filters-section">
      <div class="filter-group">
        <label for="genSel" class="filter-label">
          <span class="label-icon">🎮</span>
          Geração
        </label>
        <select id="genSel" (change)="onGenerationChange($any($event.target).value)" class="filter-select">
          <option value="">Todas as Gerações</option>
          <option value="1">Geração 1 (Kanto)</option>
          <option value="2">Geração 2 (Johto)</option>
          <option value="3">Geração 3 (Hoenn)</option>
          <option value="4">Geração 4 (Sinnoh)</option>
          <option value="5">Geração 5 (Unova)</option>
          <option value="6">Geração 6 (Kalos)</option>
          <option value="7">Geração 7 (Alola)</option>
          <option value="8">Geração 8 (Galar)</option>
          <option value="9">Geração 9 (Paldea)</option>
          <option value="10">Formas Especiais</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="searchInput" class="filter-label">
          <span class="label-icon">🔍</span>
          Buscar
        </label>
        <input
          id="searchInput"
          type="text"
          [(ngModel)]="searchTerm"
          placeholder="Digite o nome do Pokémon..."
          class="filter-input"
        />
      </div>

      <div class="results-info">
        <span class="results-badge">
          <strong>{{ totalFilteredCount() }}</strong> Pokémon(s)
        </span>
        <span class="page-badge">
          Página <strong>{{ currentPage() }}</strong> de <strong>{{ totalPages() }}</strong>
        </span>
      </div>
    </div>

    <!-- Type Filter Buttons -->
    <div class="type-filter-container">
      <button
        (click)="onTypeChange('')"
        [class.active]="!currentType()"
        [style.background]="!currentType() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.7)'"
        [style.color]="!currentType() ? 'white' : '#333'"
        class="type-filter-btn all-types-btn">
        Todos os Tipos
      </button>
      <button
        *ngFor="let t of types()"
        (click)="onTypeChange(t.name)"
        [class.active]="currentType() === t.name"
        [style.background]="currentType() === t.name ? getTypeColor(t.name) : 'rgba(255, 255, 255, 0.7)'"
        [style.color]="currentType() === t.name ? 'white' : '#333'"
        class="type-filter-btn">
        {{ t.name }}
      </button>
    </div>
      <p *ngIf="error()" class="error-message">{{ error() }}</p>

      <!-- Loading Skeletons -->
      <div *ngIf="isLoading()" class="pokemon-grid">
        <div *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]" class="skeleton-card">
          <div class="skeleton-image"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text short"></div>
        </div>
      </div>

      <!-- Pokemon Cards -->
      <div *ngIf="!isLoading()" class="pokemon-grid">
        <app-pokemon-card
          *ngFor="let p of filteredPokemons()"
          [pokemon]="p"
          [detail]="pokemonDetailsCache.get(p.name)"
          [isFavorite]="isFavorite(p)"
          [isInTeam]="isInTeam(p)"
          [darkMode]="darkMode()"
          (onFavorite)="favorite(p)"
          (onAddToTeam)="addToTeam(p)">
        </app-pokemon-card>
      </div>
    </div>

    <!-- Paginação -->
    <div *ngIf="totalPages() > 1" class="pagination-container">
      <button
        (click)="goToPage(1)"
        [disabled]="currentPage() === 1"
        class="pagination-btn"
        [class.disabled]="currentPage() === 1">
        ⏮ Primeira
      </button>
      <button
        (click)="previousPage()"
        [disabled]="currentPage() === 1"
        class="pagination-btn"
        [class.disabled]="currentPage() === 1">
        ← Anterior
      </button>
      <span class="pagination-info">
        Página <strong>{{ currentPage() }}</strong> de <strong>{{ totalPages() }}</strong>
      </span>
      <button
        (click)="nextPage()"
        [disabled]="currentPage() === totalPages()"
        class="pagination-btn"
        [class.disabled]="currentPage() === totalPages()">
        Próxima →
      </button>
      <button
        (click)="goToPage(totalPages())"
        [disabled]="currentPage() === totalPages()"
        class="pagination-btn"
        [class.disabled]="currentPage() === totalPages()">
        Última ⏭
      </button>
    </div>
  `,
  styles: [`
    /* Page Container */
    .page-container {
      min-height: 100vh;
      transition: background-color 0.3s ease, color 0.3s ease;
    }

    /* Dark Mode Styles */
    .dark-mode {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e0e0e0;
    }

    /* Page Header */
    .page-header {
      text-align: center;
      margin-bottom: 32px;
      animation: fadeInUp 0.6s ease-out;
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #333;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .dark-mode .page-title {
      background: linear-gradient(135deg, #a0aeff 0%, #c4b5fd 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-description {
      font-size: 1.1rem;
      color: #666;
      font-weight: 400;
    }

    .dark-mode .page-description {
      color: #aaa;
    }

    /* Filters Section */
    .filters-section {
      display: flex;
      gap: 16px;
      align-items: flex-end;
      flex-wrap: wrap;
      margin-bottom: 24px;
      padding: 24px;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      border: 2px solid rgba(200, 200, 200, 0.3);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .dark-mode .filters-section {
      background: rgba(30, 30, 50, 0.7);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      min-width: 200px;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #555;
      letter-spacing: 0.02em;
    }

    .dark-mode .filter-label {
      color: #ccc;
    }

    .label-icon {
      font-size: 1.1rem;
    }

    .filter-select,
    .filter-input {
      padding: 12px 16px;
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 500;
      background: white;
      color: #333;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .filter-select:hover,
    .filter-input:hover {
      border-color: rgba(102, 126, 234, 0.4);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .filter-select:focus,
    .filter-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
    }

    .dark-mode .filter-select,
    .dark-mode .filter-input {
      background: rgba(40, 40, 60, 0.8);
      color: #e0e0e0;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .results-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .results-badge,
    .page-badge {
      padding: 8px 16px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 12px;
      font-size: 0.85rem;
      color: #667eea;
      font-weight: 500;
      white-space: nowrap;
    }

    .dark-mode .results-badge,
    .dark-mode .page-badge {
      background: rgba(160, 174, 255, 0.15);
      color: #a0aeff;
    }

    .results-badge strong,
    .page-badge strong {
      font-weight: 700;
    }

    .dark-mode-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1001;
    }

    .toggle-btn {
      padding: 10px 20px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 30px;
      color: inherit;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .toggle-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      background: rgba(255, 255, 255, 0.15);
    }

    /* Toast Notifications */
    .toast {
      position: fixed;
      top: 80px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      backdrop-filter: blur(10px);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }

    .toast-success {
      background: rgba(76, 175, 80, 0.95);
      color: white;
    }

    .toast-error {
      background: rgba(244, 67, 54, 0.95);
      color: white;
    }

    /* Error Message */
    .error-message {
      color: #f44336;
      text-align: center;
      padding: 20px;
      font-weight: 600;
    }

    .dark-mode .error-message {
      color: #ff6b6b;
    }

    /* Type Filter Buttons */
    .type-filter-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 16px 0 24px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      border: 2px solid rgba(200, 200, 200, 0.3);
    }

    .dark-mode .type-filter-container {
      background: rgba(30, 30, 50, 0.5);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .type-filter-btn {
      padding: 10px 18px;
      border: 2px solid transparent;
      border-radius: 18px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
    }

    .type-filter-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    }

    .type-filter-btn.active {
      border-color: rgba(255, 255, 255, 0.5);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    .all-types-btn.active {
      border-color: rgba(255, 255, 255, 0.5);
    }

    .dark-mode .type-filter-btn:not(.active) {
      background: rgba(255, 255, 255, 0.1);
      color: #e0e0e0;
    }

    .dark-mode .all-types-btn:not(.active) {
      background: rgba(255, 255, 255, 0.1) !important;
      color: #e0e0e0 !important;
    }

    /* Pokemon Grid - Responsive */
    .pokemon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 30px;
      row-gap: 70px;
      padding: 16px 0;
      animation: fadeIn 0.5s ease-in;
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

    /* Card styles are now in PokemonCardComponent */

    /* Pagination - Modern Design */
    .pagination-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-top: 48px;
      padding: 24px;
      flex-wrap: wrap;
    }

    .pagination-btn {
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.95rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      letter-spacing: 0.02em;
    }

    .pagination-btn:hover:not(.disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .pagination-btn:active:not(.disabled) {
      transform: translateY(0);
    }

    .pagination-btn.disabled {
      background: linear-gradient(135deg, #ccc 0%, #aaa 100%);
      cursor: not-allowed;
      opacity: 0.6;
      box-shadow: none;
    }

    .pagination-info {
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 12px;
      font-size: 0.95rem;
      color: #555;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .dark-mode .pagination-info {
      background: rgba(40, 40, 60, 0.8);
      color: #e0e0e0;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .pagination-info strong {
      color: #667eea;
      font-weight: 700;
    }

    .dark-mode .pagination-info strong {
      color: #a0aeff;
    }

    /* Loading Skeletons */
    .skeleton-card {
      aspect-ratio: 3 / 4;
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      border: 2px solid rgba(200, 200, 200, 0.3);
      border-radius: 20px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: pulse 1.5s infinite;
    }

    .dark-mode .skeleton-card {
      background: rgba(30, 30, 50, 0.5);
      border-color: rgba(255, 255, 255, 0.05);
    }

    .skeleton-image {
      width: 120px;
      height: 120px;
      background: rgba(200, 200, 200, 0.3);
      border-radius: 12px;
      margin-top: 40px;
    }

    .dark-mode .skeleton-image {
      background: rgba(255, 255, 255, 0.1);
    }

    .skeleton-text {
      width: 80%;
      height: 16px;
      background: rgba(200, 200, 200, 0.3);
      border-radius: 8px;
    }

    .dark-mode .skeleton-text {
      background: rgba(255, 255, 255, 0.1);
    }

    .skeleton-text.short {
      width: 50%;
    }

    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
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

    @keyframes bounceIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      60% {
        transform: scale(1.1);
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%);
      }
      100% {
        transform: translateX(100%);
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

  // Dark Mode
  darkMode = signal<boolean>(false);

  // Loading State
  isLoading = signal<boolean>(true);

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
    this.isLoading.set(true);
    this.pokemonService.list().subscribe({
      next: (res) => {
        this.allPokemons.set(res.results);
        this.pokemons.set(res.results);
        // Carrega detalhes das primeiras 3 páginas (150 Pokémon) para melhor experiência
        this.loadPokemonDetails(res.results.slice(0, 150));
        // Aguarda um pouco para garantir que alguns detalhes foram carregados
        setTimeout(() => this.isLoading.set(false), 1500);
      },
      error: () => {
        this.error.set('Falha ao carregar Pokémon. Tente recarregar a página.');
        this.isLoading.set(false);
      }
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
    this.currentPage.set(1);
    this.applyFilters();
  }

  onTypeChange(name: string) {
    this.currentType.set(name || '');
    this.currentPage.set(1);
    this.applyFilters();
  }

  applyFilters() {
    const generation = this.currentGeneration();
    const type = this.currentType();

    // Se não há filtros, mostra todos
    if (!generation && !type) {
      this.pokemons.set(this.allPokemons());
      this.loadPokemonDetails(this.allPokemons().slice(0, 150));
      return;
    }

    // Se apenas geração está selecionada
    if (generation && !type) {
      const range = this.generationRanges[generation];
      if (range) {
        this.pokemonService.list(range.limit, range.offset).subscribe({
          next: (res) => {
            this.pokemons.set(res.results);
            this.loadPokemonDetails(res.results.slice(0, 150));
          },
          error: () => this.error.set('Falha ao filtrar por geração.')
        });
      }
      return;
    }

    // Se apenas tipo está selecionado
    if (type && !generation) {
      this.typesService.listByType(type).subscribe({
        next: (res) => {
          this.pokemons.set(res.results);
          this.loadPokemonDetails(res.results.slice(0, 150));
        },
        error: () => this.error.set('Falha ao filtrar por tipo.')
      });
      return;
    }

    // Se ambos estão selecionados, combinar filtros
    if (generation && type) {
      const range = this.generationRanges[generation];
      if (range) {
        forkJoin({
          generationPokemon: this.pokemonService.list(range.limit, range.offset),
          typePokemon: this.typesService.listByType(type)
        }).subscribe({
          next: (result) => {
            // Filtra pokémon que estão em ambas as listas (interseção)
            const genNames = new Set(result.generationPokemon.results.map(p => p.name));
            const filtered = result.typePokemon.results.filter(p => genNames.has(p.name));
            this.pokemons.set(filtered);
            this.loadPokemonDetails(filtered.slice(0, 150));
          },
          error: () => this.error.set('Falha ao aplicar filtros combinados.')
        });
      }
    }
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

  // Novos métodos para as melhorias

  toggleDarkMode() {
    this.darkMode.set(!this.darkMode());
    // Salva preferência no localStorage
    localStorage.setItem('darkMode', String(this.darkMode()));
  }

  getPokemonGeneration(p: BasicPokemon): number {
    const match = /\/pokemon\/(\d+)\/?$/.exec(p.url);
    if (!match) return 1;
    const id = parseInt(match[1]);

    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 905) return 8;
    if (id <= 1025) return 9;
    return 10; // Formas especiais
  }

  getStatPercentage(p: BasicPokemon, statName: string): number {
    const statValue = this.getPokemonStat(p, statName);
    // Normaliza para porcentagem (stat máximo geralmente é ~255)
    return Math.min((statValue / 255) * 100, 100);
  }

  getTotalPower(p: BasicPokemon): number {
    const hp = this.getPokemonStat(p, 'hp');
    const attack = this.getPokemonStat(p, 'attack');
    const defense = this.getPokemonStat(p, 'defense');
    const spAtk = this.getPokemonStat(p, 'special-attack');
    const spDef = this.getPokemonStat(p, 'special-defense');
    const speed = this.getPokemonStat(p, 'speed');
    return hp + attack + defense + spAtk + spDef + speed;
  }

  constructor() {
    // Carrega preferência de dark mode do localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      this.darkMode.set(true);
    }

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
}


