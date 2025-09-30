import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  darkMode = signal<boolean>(false);

  constructor() {
    // Carrega preferência de dark mode do localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'true') {
      this.darkMode.set(true);
      document.body.classList.add('dark-mode');
    }
  }

  toggleDarkMode() {
    this.darkMode.set(!this.darkMode());
    // Salva preferência no localStorage
    localStorage.setItem('darkMode', String(this.darkMode()));
    // Aplica/remove classe no body
    if (this.darkMode()) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
}