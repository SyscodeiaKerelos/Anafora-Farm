import type { ReproductionType, SpeciesType } from '../../../core/types/species';

/** Predefined species: name in English and Arabic, reproduction type, and species type. */
export interface PredefinedSpeciesEntry {
  nameEn: string;
  nameAr: string;
  reproductionType: ReproductionType;
  type: SpeciesType;
}

/** Animals that give birth. */
const ANIMAL_TYPES: SpeciesType = 'animal';

/** Birds that lay eggs. */
const BIRD_TYPES: SpeciesType = 'bird';

export const PREDEFINED_SPECIES: PredefinedSpeciesEntry[] = [
  { nameEn: 'Cow', nameAr: 'بقرة', reproductionType: 'gives_birth', type: ANIMAL_TYPES },
  { nameEn: 'Sheep', nameAr: 'خروف', reproductionType: 'gives_birth', type: ANIMAL_TYPES },
  { nameEn: 'Goat', nameAr: 'ماعز', reproductionType: 'gives_birth', type: ANIMAL_TYPES },
  { nameEn: 'Rabbit', nameAr: 'أرنب', reproductionType: 'gives_birth', type: ANIMAL_TYPES },
  { nameEn: 'Birds', nameAr: 'طيور', reproductionType: 'lays_egg', type: BIRD_TYPES },
  { nameEn: 'Chicken', nameAr: 'فراخ / دجاج', reproductionType: 'lays_egg', type: BIRD_TYPES },
  { nameEn: 'Ostrich', nameAr: 'نعام', reproductionType: 'lays_egg', type: BIRD_TYPES },
  { nameEn: 'Duck', nameAr: 'بط', reproductionType: 'lays_egg', type: BIRD_TYPES },
  { nameEn: 'Turkey', nameAr: 'ديك رومي', reproductionType: 'lays_egg', type: BIRD_TYPES },
];

/** Species names that always lay eggs (so we can fix wrong DB data when loading). */
const LAYS_EGG_NAMES = new Set([
  'birds', 'bird', 'طيور', 'chicken', 'ostrich', 'duck', 'turkey',
  'فراخ', 'دجاج', 'نعام', 'بط', 'ديك رومي',
]);

/** Species names that are animals (give birth). */
const ANIMAL_NAMES = new Set([
  'cow', 'sheep', 'goat', 'rabbit', 'بقرة', 'خروف', 'ماعز', 'أرنب',
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

export function normalizeSpeciesType(
  nameEn: string,
  nameAr: string,
  current: SpeciesType,
): SpeciesType {
  const keyEn = nameEn.trim().toLowerCase();
  const keyAr = nameAr.trim().toLowerCase();
  if (LAYS_EGG_NAMES.has(keyEn) || LAYS_EGG_NAMES.has(keyAr)) {
    return 'bird';
  }
  if (ANIMAL_NAMES.has(keyEn) || ANIMAL_NAMES.has(keyAr)) {
    return 'animal';
  }
  return current;
}
