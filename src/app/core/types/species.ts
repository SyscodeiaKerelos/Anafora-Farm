/** كيف يتكاثر النوع: بيولد (ثدييات) أو يبيض (طيور وغيرها). */
export type ReproductionType = 'gives_birth' | 'lays_egg';

/** نوع النوع: حيوان أو طائر. */
export type SpeciesType = 'animal' | 'bird';

export interface Species {
  id: string;
  nameEn: string;
  nameAr: string;
  reproductionType: ReproductionType;
  type: SpeciesType;
  createdAt: Date | null;
}
