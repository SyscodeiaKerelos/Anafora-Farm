/** Comment type: general note or medicine/treatment entry. */
export type AnimalCommentType = 'general' | 'medicine';

export interface AnimalComment {
  id: string;
  text: string;
  type: AnimalCommentType;
  medicineName: string | null;
  dose: string | null;
  nextDoseDate: Date | null;
  createdAt: Date | null;
  createdBy: string | null;
}
