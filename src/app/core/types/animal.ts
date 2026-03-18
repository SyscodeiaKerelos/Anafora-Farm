import type { AnimalStatus } from './animal-status';

/** Single vaccination entry: vaccine name and date. */
export interface AnimalVaccination {
  name: string;
  date: Date;
}

export interface Animal {
  id: string;
  number: string;
  speciesId: string;
  name: string | null;
  identifier: string | null;
  status: AnimalStatus;
  birthDate: Date | null;
  eggLayingDate: Date | null;
  hatchingDate: Date | null;
  /** @deprecated Prefer vaccinations[].date; kept for backward compatibility. */
  vaccinationDate: Date | null;
  /** Vaccination records (name + date). When present, preferred over vaccinationDate. */
  vaccinations?: AnimalVaccination[];
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string | null;
}

/** For list/detail: animal with resolved species names and reproduction type. */
export interface AnimalWithSpecies extends Animal {
  speciesNameEn: string;
  speciesNameAr: string;
  reproductionType: 'gives_birth' | 'lays_egg';
  speciesType: 'animal' | 'bird';
}
