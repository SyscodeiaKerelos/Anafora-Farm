/** كيف يتكاثر النوع: بيولد (ثدييات) أو يبيض (طيور وغيرها). */
export type ReproductionType = 'gives_birth' | 'lays_egg';

export interface Species {
  id: string;
  nameEn: string;
  nameAr: string;
  reproductionType: ReproductionType;
  createdAt: Date | null;
}
