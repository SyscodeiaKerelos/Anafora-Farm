import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

import { NavbarDropdownController } from '../../../core/layout/navbar-dropdown.controller';

export interface UiMenuItem {
  id: string;
  labelKey: string;
  icon?: string;
}

@Component({
  selector: 'app-ui-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TranslatePipe],
  host: {
    class: 'relative inline-block text-left',
  },
  template: `
    <button
      type="button"
      class="btn-ghost inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
      (click)="toggle()"
      [attr.aria-expanded]="open()"
    >
      @if (avatarText()) {
        <span
          class="flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-[11px] font-semibold text-slate-900"
        >
          {{ avatarText() }}
        </span>
      } @else if (icon()) {
        <i [class]="icon()" aria-hidden="true"></i>
      }

      @if (labelKey()) {
        <span>{{ labelKey() | translate }}</span>
      }

      <i
        class="pi"
        [class.pi-chevron-down]="!open()"
        [class.pi-chevron-up]="open()"
        aria-hidden="true"
      ></i>
    </button>

    @if (open()) {
      <div
        class="menu-surface menu-surface-enter absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200/70 bg-white/80 py-1 text-xs text-slate-900 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-50"
      >
        @for (item of items(); track item.id) {
          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-900 dark:text-slate-50 hover:bg-white/5 dark:hover:bg-white/10"
            (click)="onSelect(item.id)"
          >
            @if (item.icon) {
              <i [class]="item.icon" aria-hidden="true"></i>
            }
            <span>{{ item.labelKey | translate }}</span>
          </button>
        }
      </div>
    }
  `,
})
export class UiMenu {
  readonly labelKey = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly avatarText = input<string | null>(null);
  readonly items = input<readonly UiMenuItem[]>([]);
  /** When set and a NavbarDropdownController is provided, only one navbar dropdown is open at a time. */
  readonly menuId = input<string | null>(null);

  readonly itemSelected = output<string>();

  private readonly controller = inject(NavbarDropdownController, { optional: true });
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  private readonly localOpen = signal(false);

  protected readonly open = computed(() => {
    const id = this.menuId();
    if (id && this.controller) {
      return this.controller.openId() === id;
    }
    return this.localOpen();
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (!isOpen) return;
      const el = this.elementRef.nativeElement;
      const handler = (e: MouseEvent) => {
        const target = e.target as Node;
        if (el.contains(target)) return;
        this.close();
      };
      const t = setTimeout(() => {
        document.addEventListener('click', handler, true);
      }, 0);
      return () => {
        clearTimeout(t);
        document.removeEventListener('click', handler, true);
      };
    });
  }

  protected toggle(): void {
    const id = this.menuId();
    if (id && this.controller) {
      if (this.controller.openId() === id) {
        this.controller.close();
      } else {
        this.controller.open(id);
      }
    } else {
      this.localOpen.update((v) => !v);
    }
  }

  private close(): void {
    const id = this.menuId();
    if (id && this.controller) {
      this.controller.close();
    } else {
      this.localOpen.set(false);
    }
  }

  protected onSelect(id: string): void {
    this.itemSelected.emit(id);
    this.close();
  }
}

