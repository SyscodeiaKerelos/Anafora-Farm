import { Injectable, signal } from '@angular/core';

/**
 * Coordinates navbar dropdowns so only one is open at a time.
 * Provide in the component that hosts the dropdowns (e.g. AppHeader).
 */
@Injectable()
export class NavbarDropdownController {
  readonly openId = signal<string | null>(null);

  open(id: string): void {
    this.openId.set(id);
  }

  close(): void {
    this.openId.set(null);
  }
}
