import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/types/role';
import { UiBadge } from '../../shared/ui/badge/ui-badge.component';

type DashboardCardId = 'fields' | 'tasks' | 'livestock' | 'inventory' | 'reports';

interface DashboardCard {
  id: DashboardCardId;
  titleKey: string;
  subtitleKey: string;
  ctaKey: string;
  rolesAllowed: Role[];
}

interface WorkerTask {
  id: number;
  titleKey: string;
  fieldLabel: string;
  timeLabel: string;
  statusKey: string;
}

interface ManagerKpi {
  id: string;
  labelKey: string;
  value: string;
}

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe, UiBadge],
  host: {
    class: 'block space-y-6',
  },
  template: `
    <!-- Top welcome + primary dashboard cards -->
    <section class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <!-- Welcome + context -->
      <div class="card-glass flex flex-col justify-between gap-4 p-5">
        <div>
          <p class="text-xs font-medium uppercase tracking-[0.25em] text-muted">
            {{ 'translate_app-name' | translate }}
          </p>
          <h2 class="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {{ 'translate_dashboard_welcome' | translate }}
            @if (authService.user()) {
              <span>, {{ authService.user()?.displayName || authService.user()?.email }}</span>
            }
          </h2>
          <p class="mt-2 text-sm text-muted">
            {{ 'translate_dashboard_farm-context' | translate }}
          </p>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <!-- Role badge -->
          <app-ui-badge
            tone="emerald"
            [labelKey]="
              authService.role() === 'superAdmin'
                ? 'translate_role-super-admin-label'
                : authService.role() === 'admin'
                  ? 'translate_role-admin-label'
                  : 'translate_role-user-label'
            "
          />

          <!-- Theme chip -->
          <app-ui-badge tone="sky">
            {{ 'translate_current-theme' | translate }}:
            <span class="ms-1">
              {{
                themeService.isDark()
                  ? ('translate_dark' | translate)
                  : ('translate_light' | translate)
              }}
            </span>
          </app-ui-badge>

          <!-- Language chip -->
          <app-ui-badge tone="amber">
            {{ 'translate_current-language' | translate }}:
            <span class="ms-1">
              {{
                translationService.currentLang() === 'ar'
                  ? ('translate_arabic' | translate)
                  : ('translate_english' | translate)
              }}
            </span>
          </app-ui-badge>
        </div>
      </div>

      <!-- Primary farm dashboard cards -->
      <div class="grid gap-4 md:grid-cols-2">
        @for (card of visibleCards(); track card.id) {
          <article class="card-glass relative overflow-hidden p-4">
            <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-transparent"></div>

            <div class="relative space-y-1">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {{ card.titleKey | translate }}
              </h3>
              <p class="text-xs text-muted">
                {{ card.subtitleKey | translate }}
              </p>
            </div>

            <button
              type="button"
              class="relative mt-4 inline-flex items-center text-xs font-medium text-amber-300"
            >
              <span>{{ card.ctaKey | translate }}</span>
              <span class="ms-1">→</span>
            </button>
          </article>
        }
      </div>
    </section>

    <!-- Role-based content -->
    <section class="grid gap-6 lg:grid-cols-2">
      @if (authService.hasAtLeastRole('admin')) {
        <!-- Manager / owner overview -->
        <div class="card-glass p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {{ 'translate_dashboard_section-manager-overview' | translate }}
            </h3>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            @for (kpi of managerKpis; track kpi.id) {
              <div class="rounded-2xl bg-black/20 px-3 py-2">
                <p class="text-xs text-muted">
                  {{ kpi.labelKey | translate }}
                </p>
                <p class="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {{ kpi.value }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Manager tasks snapshot -->
        <div class="card-glass p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {{ 'translate_dashboard_section-today-schedule' | translate }}
            </h3>
          </div>

          @if (workerTasks.length) {
            <div class="space-y-2">
              @for (task of workerTasks; track task.id) {
                <div class="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2">
                  <div>
                    <p class="text-sm text-slate-900 dark:text-slate-50">
                      {{ task.titleKey | translate }}
                    </p>
                    <p class="text-[11px] text-muted">
                      {{ task.fieldLabel }} • {{ task.timeLabel }}
                    </p>
                  </div>
                  <app-ui-badge tone="emerald" [labelKey]="task.statusKey" />
                </div>
              }
            </div>
          } @else {
            <p class="text-xs text-muted">
              {{ 'translate_dashboard_no-tasks' | translate }}
            </p>
          }
        </div>
      } @else {
        <!-- Worker / field team schedule -->
        <div class="card-glass p-4 lg:col-span-2">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {{ 'translate_dashboard_section-today-schedule' | translate }}
            </h3>
            <button
              type="button"
              class="btn-primary px-3 py-1 text-xs"
            >
              {{ 'translate_dashboard_go-to-tasks' | translate }}
            </button>
          </div>

          @if (workerTasks.length) {
            <div class="space-y-2">
              @for (task of workerTasks; track task.id) {
                <div class="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2">
                  <div>
                    <p class="text-sm text-slate-900 dark:text-slate-50">
                      {{ task.titleKey | translate }}
                    </p>
                    <p class="text-[11px] text-muted">
                      {{ task.fieldLabel }} • {{ task.timeLabel }}
                    </p>
                  </div>
                  <app-ui-badge tone="emerald" [labelKey]="task.statusKey" />
                </div>
              }
            </div>
          } @else {
            <p class="text-xs text-muted">
              {{ 'translate_dashboard_no-tasks' | translate }}
            </p>
          }
        </div>
      }
    </section>

    <!-- Demo data note -->
    <section class="text-center">
      <p class="text-xs text-muted">
        {{ 'translate_dashboard_demo-note' | translate }}
      </p>
    </section>
  `,
})
export class HomePage {
  protected readonly themeService = inject(ThemeService);
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);

  protected readonly dashboardCards: DashboardCard[] = [
    {
      id: 'fields',
      titleKey: 'translate_dashboard_card-fields-title',
      subtitleKey: 'translate_dashboard_card-fields-subtitle',
      ctaKey: 'translate_dashboard_card-fields-cta',
      rolesAllowed: ['user', 'admin', 'superAdmin'],
    },
    {
      id: 'tasks',
      titleKey: 'translate_dashboard_card-tasks-title',
      subtitleKey: 'translate_dashboard_card-tasks-subtitle',
      ctaKey: 'translate_dashboard_card-tasks-cta',
      rolesAllowed: ['user', 'admin', 'superAdmin'],
    },
    {
      id: 'livestock',
      titleKey: 'translate_dashboard_card-livestock-title',
      subtitleKey: 'translate_dashboard_card-livestock-subtitle',
      ctaKey: 'translate_dashboard_card-livestock-cta',
      rolesAllowed: ['user', 'admin', 'superAdmin'],
    },
    {
      id: 'inventory',
      titleKey: 'translate_dashboard_card-inventory-title',
      subtitleKey: 'translate_dashboard_card-inventory-subtitle',
      ctaKey: 'translate_dashboard_card-inventory-cta',
      rolesAllowed: ['admin', 'superAdmin'],
    },
    {
      id: 'reports',
      titleKey: 'translate_dashboard_card-reports-title',
      subtitleKey: 'translate_dashboard_card-reports-subtitle',
      ctaKey: 'translate_dashboard_card-reports-cta',
      rolesAllowed: ['admin', 'superAdmin'],
    },
  ];

  protected readonly workerTasks: WorkerTask[] = [
    {
      id: 1,
      titleKey: 'translate_dashboard_task-irrigation',
      fieldLabel: 'Field A • North',
      timeLabel: '06:30',
      statusKey: 'translate_dashboard_status-pending',
    },
    {
      id: 2,
      titleKey: 'translate_dashboard_task-feeding',
      fieldLabel: 'Dairy barn',
      timeLabel: '09:00',
      statusKey: 'translate_dashboard_status-in-progress',
    },
    {
      id: 3,
      titleKey: 'translate_dashboard_task-harvest',
      fieldLabel: 'Olive grove',
      timeLabel: '16:00',
      statusKey: 'translate_dashboard_status-scheduled',
    },
  ];

  protected readonly managerKpis: ManagerKpi[] = [
    {
      id: 'fields',
      labelKey: 'translate_dashboard_kpi-active-fields',
      value: '24',
    },
    {
      id: 'livestock',
      labelKey: 'translate_dashboard_kpi-livestock-headcount',
      value: '128',
    },
    {
      id: 'tasks',
      labelKey: 'translate_dashboard_kpi-overdue-tasks',
      value: '3',
    },
    {
      id: 'inventory',
      labelKey: 'translate_dashboard_kpi-low-inventory-items',
      value: '5',
    },
  ];

  protected readonly visibleCards = computed(() => {
    const role = this.authService.role() ?? 'user';
    return this.dashboardCards.filter((card) => card.rolesAllowed.includes(role));
  });
}

