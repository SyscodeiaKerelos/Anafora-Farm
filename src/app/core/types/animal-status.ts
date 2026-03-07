/** Animal status / category. Stored in Firestore as-is. */
export type AnimalStatus =
  | 'newborn'
  | 'gives_egg'
  | 'alive'
  | 'died'
  | 'sick';
