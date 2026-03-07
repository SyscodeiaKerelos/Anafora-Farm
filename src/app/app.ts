import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { AppHeaderComponent } from './core/layout/app-header.component';
import { NotificationToastComponent } from './core/components/notification-toast.component';
import { TranslationService } from './core/services/translation.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    NotificationToastComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = 'Anafora-Farm';

  /** Inject so TranslationService runs at bootstrap and loads saved/browser language. */
  private readonly translation = inject(TranslationService);
}
