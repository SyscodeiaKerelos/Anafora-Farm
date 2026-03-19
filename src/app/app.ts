import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { DashboardLayoutComponent } from './core/layout/dashboard-layout.component';
import { TranslationService } from './core/services/translation.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showDashboard()) {
      <app-dashboard-layout>
        <router-outlet />
      </app-dashboard-layout>
    } @else {
      <router-outlet />
    }
  `,
})
export class App {
  private readonly translation = inject(TranslationService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly currentUrl = signal(this.router.url);

  protected readonly showDashboard = computed(() => {
    const url = this.currentUrl();
    const authPages = ['/login', '/forgot-password'];
    return !authPages.some((page) => url === page || url.startsWith(page + '/'));
  });

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }
}
