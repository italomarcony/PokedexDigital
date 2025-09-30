import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  auth = inject(AuthService);
  themeService = inject(ThemeService);

  ngOnInit() {
    if (this.auth.token() && !this.auth.currentUser()) {
      this.auth.fetchCurrentUser().subscribe({
        error: () => this.auth.logout()
      });
    }
  }

  logout() {
    this.auth.logout();
  }

  toggleDarkMode() {
    this.themeService.toggleDarkMode();
  }
}
