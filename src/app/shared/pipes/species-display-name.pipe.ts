import { Pipe, PipeTransform } from '@angular/core';

import type { Species } from '../../core/types/species';

@Pipe({ name: 'speciesDisplayName', standalone: true, pure: true })
export class SpeciesDisplayNamePipe implements PipeTransform {
  transform(species: Species | null | undefined, lang: string): string {
    if (!species) return '';
    return lang === 'ar' ? species.nameAr : species.nameEn;
  }
}
