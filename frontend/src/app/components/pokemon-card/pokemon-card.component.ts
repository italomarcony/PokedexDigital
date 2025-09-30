import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';

interface PokemonCardData {
  name: string;
  url?: string;
  Codigo?: string;
  ImagemUrl?: string;
}

interface PokemonDetail {
  id: number;
  name: string;
  types: Array<{type: {name: string}}>;
  stats: Array<{base_stat: number, stat: {name: string}}>;
}

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  template: `
    <div class="pokemon-card" [class.dark-mode]="darkMode">
      <div class="badges-container">
        <span *ngIf="isFavorite" class="badge badge-favorite">⭐ Fav</span>
        <span *ngIf="isInTeam" class="badge badge-team">⚔️ Equipe</span>
      </div>

      <!-- Número da Pokédex e Badge de Geração -->
      <div class="top-badges">
        <div class="pokedex-number">#{{ pokemonId }}</div>
        <div class="generation-badge">Gen {{ generation }}</div>
      </div>

      <div class="pokemon-image-container">
        <img [src]="imageUrl" [alt]="pokemonName" class="pokemon-image" />
      </div>

      <div class="pokemon-name">{{ pokemonName }}</div>

      <!-- Tipos -->
      <div class="types-container">
        <span *ngFor="let type of types"
              [style.background]="getTypeColor(type)"
              class="type-badge">
          {{ type }}
        </span>
      </div>

      <!-- Stats com barras de progresso -->
      <div class="stats-container">
        <div class="stat-item">
          <div class="stat-label">
            <strong>HP</strong>
            <span>{{ getStatValue('hp') }}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-fill stat-hp" [style.width.%]="getStatPercentage('hp')"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">
            <strong>ATK</strong>
            <span>{{ getStatValue('attack') }}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-fill stat-atk" [style.width.%]="getStatPercentage('attack')"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">
            <strong>DEF</strong>
            <span>{{ getStatValue('defense') }}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-fill stat-def" [style.width.%]="getStatPercentage('defense')"></div>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">
            <strong>SPD</strong>
            <span>{{ getStatValue('speed') }}</span>
          </div>
          <div class="stat-bar">
            <div class="stat-fill stat-spd" [style.width.%]="getStatPercentage('speed')"></div>
          </div>
        </div>

        <!-- Indicador de Poder Total -->
        <div class="total-power">
          <strong>Poder Total:</strong> {{ totalPower }}
        </div>
      </div>

      <div class="action-buttons">
        <button *ngIf="!showRemoveButton" (click)="onFavorite.emit()" class="btn btn-favorite">
          Favoritar
        </button>
        <button *ngIf="!showRemoveButton" (click)="onAddToTeam.emit()" class="btn btn-team">
          Equipe
        </button>
        <button *ngIf="showRemoveButton" (click)="onRemove.emit()" class="btn btn-remove">
          Remover
        </button>
      </div>
    </div>
  `,
  styles: [`
    /* Pokemon Card - Glassmorphism */
    .pokemon-card {
      position: relative;
      min-height: 520px;
      height: 100%;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      padding: 20px;
      text-align: center;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
    }

    .pokemon-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
      border-radius: 20px;
    }

    .pokemon-card:hover::before {
      opacity: 1;
    }

    .pokemon-card:hover {
      transform: translateY(-10px) scale(1.02);
      box-shadow: 0 20px 60px rgba(102, 126, 234, 0.4);
      border-color: rgba(102, 126, 234, 0.5);
    }

    /* Dark Mode Card */
    .pokemon-card.dark-mode {
      background: rgba(30, 30, 50, 0.7);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .pokemon-card.dark-mode:hover {
      box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
      border-color: rgba(102, 126, 234, 0.4);
    }

    /* Badges Container */
    .badges-container {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 6px;
      z-index: 2;
    }

    .badge {
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(10px);
      animation: bounceIn 0.5s ease-out;
    }

    .badge-favorite {
      background: rgba(255, 215, 0, 0.9);
      color: #000;
      box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
    }

    .badge-team {
      background: rgba(76, 175, 80, 0.9);
      color: white;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    }

    /* Top Badges */
    .top-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 2;
    }

    .pokedex-number {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .generation-badge {
      background: rgba(255, 255, 255, 0.9);
      color: #667eea;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(10px);
    }

    .pokemon-card.dark-mode .generation-badge {
      background: rgba(102, 126, 234, 0.3);
      color: #a0aeff;
    }

    /* Pokemon Image */
    .pokemon-image-container {
      margin: 40px 0 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 120px;
    }

    .pokemon-image {
      width: 120px;
      height: 120px;
      image-rendering: pixelated;
      transition: transform 0.3s ease;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    .pokemon-card:hover .pokemon-image {
      transform: scale(1.1) rotate(5deg);
    }

    /* Pokemon Name */
    .pokemon-name {
      margin: 12px 0;
      text-transform: capitalize;
      font-weight: 700;
      font-size: 18px;
      color: #333;
      letter-spacing: 0.5px;
    }

    .pokemon-card.dark-mode .pokemon-name {
      color: #e0e0e0;
    }

    /* Types Container */
    .types-container {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin: 12px 0;
      flex-wrap: wrap;
    }

    .type-badge {
      color: white;
      padding: 6px 14px;
      border-radius: 18px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s ease;
    }

    .type-badge:hover {
      transform: translateY(-2px);
    }

    /* Stats Container */
    .stats-container {
      margin: 16px 0;
      padding: 12px;
      background: rgba(249, 249, 249, 0.6);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      text-align: left;
    }

    .pokemon-card.dark-mode .stats-container {
      background: rgba(20, 20, 35, 0.6);
    }

    .stat-item {
      margin-bottom: 8px;
    }

    .stat-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
      color: #666;
    }

    .pokemon-card.dark-mode .stat-label {
      color: #aaa;
    }

    .stat-label strong {
      font-weight: 700;
      color: #333;
    }

    .pokemon-card.dark-mode .stat-label strong {
      color: #e0e0e0;
    }

    /* Stat Progress Bars */
    .stat-bar {
      height: 8px;
      background: rgba(200, 200, 200, 0.3);
      border-radius: 10px;
      overflow: hidden;
      position: relative;
    }

    .stat-fill {
      height: 100%;
      border-radius: 10px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .stat-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      animation: shimmer 2s infinite;
    }

    .stat-hp {
      background: linear-gradient(90deg, #FF6B6B, #FF5252);
    }

    .stat-atk {
      background: linear-gradient(90deg, #FFA726, #FF9800);
    }

    .stat-def {
      background: linear-gradient(90deg, #42A5F5, #2196F3);
    }

    .stat-spd {
      background: linear-gradient(90deg, #66BB6A, #4CAF50);
    }

    /* Total Power Indicator */
    .total-power {
      margin-top: 12px;
      padding: 8px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: auto;
      padding-top: 16px;
    }

    .btn {
      flex: 1;
      padding: 10px 8px;
      border: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      white-space: nowrap;
    }

    .btn-favorite {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-favorite:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .btn-team {
      background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
      color: white;
    }

    .btn-team:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }

    .btn-remove {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
    }

    .btn-remove:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
    }

    /* Animations */
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
export class PokemonCardComponent {
  @Input() pokemon!: PokemonCardData;
  @Input() detail?: PokemonDetail;
  @Input() isFavorite = false;
  @Input() isInTeam = false;
  @Input() darkMode = false;
  @Input() showRemoveButton = false;

  @Output() onFavorite = new EventEmitter<void>();
  @Output() onAddToTeam = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();

  get pokemonName(): string {
    return this.pokemon.name || this.pokemon.Codigo || '';
  }

  get imageUrl(): string {
    if (this.pokemon.ImagemUrl) {
      return this.pokemon.ImagemUrl;
    }
    if (this.pokemon.url) {
      const match = /\/pokemon\/(\d+)\/?$/.exec(this.pokemon.url);
      const id = match ? match[1] : '1';
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
    }
    return '';
  }

  get pokemonId(): string {
    if (this.detail?.id) {
      return String(this.detail.id).padStart(3, '0');
    }
    if (this.pokemon.url) {
      const match = /\/pokemon\/(\d+)\/?$/.exec(this.pokemon.url);
      return match ? match[1].padStart(3, '0') : '001';
    }
    return '001';
  }

  get generation(): number {
    const id = this.detail?.id || this.extractIdFromUrl();

    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 905) return 8;
    if (id <= 1025) return 9;
    return 10;
  }

  get types(): string[] {
    if (!this.detail?.types) return [];
    return this.detail.types.map(t => t.type.name);
  }

  get totalPower(): number {
    if (!this.detail?.stats) return 0;
    return this.detail.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  }

  private extractIdFromUrl(): number {
    if (this.pokemon.url) {
      const match = /\/pokemon\/(\d+)\/?$/.exec(this.pokemon.url);
      return match ? parseInt(match[1]) : 1;
    }
    return 1;
  }

  getStatValue(statName: string): number {
    if (!this.detail?.stats) return 0;
    const stat = this.detail.stats.find(s => s.stat.name === statName);
    return stat ? stat.base_stat : 0;
  }

  getStatPercentage(statName: string): number {
    const value = this.getStatValue(statName);
    return Math.min((value / 255) * 100, 100);
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
}