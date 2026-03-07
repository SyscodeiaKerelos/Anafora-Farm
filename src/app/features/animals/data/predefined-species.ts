import type { ReproductionType } from '../../../core/types/species';

/** Predefined species: name in English and Arabic, and whether they give birth or lay eggs. */
export interface PredefinedSpeciesEntry {
  nameEn: string;
  nameAr: string;
  reproductionType: ReproductionType;
}

export const PREDEFINED_SPECIES: PredefinedSpeciesEntry[] = [
  { nameEn: 'Cow', nameAr: 'بقرة', reproductionType: 'gives_birth' },
  { nameEn: 'Sheep', nameAr: 'خروف', reproductionType: 'gives_birth' },
  { nameEn: 'Goat', nameAr: 'ماعز', reproductionType: 'gives_birth' },
  { nameEn: 'Rabbit', nameAr: 'أرنب', reproductionType: 'gives_birth' },
  { nameEn: 'Birds', nameAr: 'طيور', reproductionType: 'lays_egg' },
  { nameEn: 'Chicken', nameAr: 'فراخ / دجاج', reproductionType: 'lays_egg' },
  { nameEn: 'Ostrich', nameAr: 'نعام', reproductionType: 'lays_egg' },
  { nameEn: 'Duck', nameAr: 'بط', reproductionType: 'lays_egg' },
  { nameEn: 'Turkey', nameAr: 'ديك رومي', reproductionType: 'lays_egg' },
];

/** Species names that always lay eggs (so we can fix wrong DB data when loading). */
const LAYS_EGG_NAMES = new Set([
  'birds', 'bird', 'طيور', 'chicken', 'ostrich', 'duck', 'turkey',
  'فراخ', 'دجاج', 'نعام', 'بط', 'ديك رومي',
]);

export function normalizeReproductionType(
  nameEn: string,
  nameAr: string,
  current: ReproductionType,
): ReproductionType {
  const keyEn = nameEn.trim().toLowerCase();
  const keyAr = nameAr.trim().toLowerCase();
  if (LAYS_EGG_NAMES.has(keyEn) || LAYS_EGG_NAMES.has(keyAr)) {
    return 'lays_egg';
  }
  return current;
}
