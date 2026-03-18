import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DashboardLayoutComponent } from './core/layout/dashboard-layout.component';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, DashboardLayoutComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  /** Inject so TranslationService runs at bootstrap and loads saved/browser language. */
  private readonly translation = inject(TranslationService);
}
