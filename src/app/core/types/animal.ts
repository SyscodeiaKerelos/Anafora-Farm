import type { AnimalStatus } from './animal-status';

export interface Animal {
  id: string;
  speciesId: string;
  name: string | null;
  identifier: string | null;
  status: AnimalStatus;
  birthDate: Date | null;
  vaccinationDate: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string | null;
}

/** For list/detail: animal with resolved species names and reproduction type. */
export interface AnimalWithSpecies extends Animal {
  speciesNameEn: string;
  speciesNameAr: string;
  reproductionType: 'gives_birth' | 'lays_egg';
}
