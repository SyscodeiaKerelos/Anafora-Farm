import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { TranslateService as NgxTranslateService } from '@ngx-translate/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'en' | 'ar';

@Injectable()
export class TranslationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translate = inject(NgxTranslateService);
  private readonly storageKey = 'app-language';

  private readonly _currentLang = signal<Language>('en');

  readonly currentLang = this._currentLang.asReadonly();
  readonly isRTL = computed(() => this._currentLang() === 'ar');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initLanguage();
    }
  }

  private initLanguage(): void {
    const saved = localStorage.getItem(this.storageKey) as Language | null;
    const lang = saved || this.getBrowserLanguage();

    this.setLanguage(lang, false);
  }

  private getBrowserLanguage(): Language {
    if (!isPlatformBrowser(this.platformId)) return 'en';
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ar' ? 'ar' : 'en';
  }

  setLanguage(lang: Language, save: boolean = true): void {
    this._currentLang.set(lang);
    this.translate.use(lang);

    if (isPlatformBrowser(this.platformId)) {
      if (save) {
        localStorage.setItem(this.storageKey, lang);
      }
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    }
  }

  toggleLanguage(): void {
    this.setLanguage(this._currentLang() === 'en' ? 'ar' : 'en');
  }

  instant(key: string): string {
    return this.translate.instant(key);
  }
}
