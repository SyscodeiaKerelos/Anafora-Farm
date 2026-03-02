import {
  Injectable,
  signal,
  computed,
  effect,
  inject,
  PLATFORM_ID,
  APP_INITIALIZER,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageKey = 'theme-mode';

  private readonly _theme = signal<Theme>('light');

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initTheme();
    }

    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        const currentTheme = this._theme();
        localStorage.setItem(this.storageKey, currentTheme);

        // Toggle dark class on html element for both Tailwind and PrimeNG
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
      }
    });
  }

  private initTheme(): void {
    const saved = localStorage.getItem(this.storageKey) as Theme | null;
    const theme = saved || this.getSystemTheme();
    this._theme.set(theme);

    // Apply class immediately on init
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }

  private getSystemTheme(): Theme {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme(): void {
    this._theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }
}
