import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

import { Animal, AnimalWithSpecies } from '../../../core/types/animal';
import type { AnimalStatus } from '../../../core/types/animal-status';
import type { ReproductionType } from '../../../core/types/species';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';

export interface CreateAnimalDto {
  speciesId: string;
  name: string | null;
  identifier: string | null;
  status: AnimalStatus;
  birthDate: Date | null;
  vaccinationDate: Date | null;
}

export interface UpdateAnimalDto {
  speciesId?: string;
  name?: string | null;
  identifier?: string | null;
  status?: AnimalStatus;
  birthDate?: Date | null;
  vaccinationDate?: Date | null;
}

interface SpeciesInfo {
  nameEn: string;
  nameAr: string;
  reproductionType: ReproductionType;
}

@Injectable()
export class AnimalsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly animalsCollectionName = 'animals';
  readonly speciesCollectionName = 'species';

  private static toDate(value: unknown): Date | null {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return null;
  }

  async loadAll(): Promise<AnimalWithSpecies[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const [speciesSnapshot, animalsSnapshot] = await Promise.all([
        getDocs(collection(this.firestore, this.speciesCollectionName)),
        getDocs(collection(this.firestore, this.animalsCollectionName)),
      ]);

      const speciesMap = new Map<string, SpeciesInfo>();
      speciesSnapshot.forEach((s) => {
        const data = s.data() as {
          name?: string;
          nameEn?: string;
          nameAr?: string;
          reproductionType?: ReproductionType;
        };
        const fallback = data.name ?? '';
        speciesMap.set(s.id, {
          nameEn: data.nameEn ?? fallback,
          nameAr: data.nameAr ?? fallback,
          reproductionType: (data.reproductionType ?? 'gives_birth') as ReproductionType,
        });
      });

      const list: AnimalWithSpecies[] = [];
      animalsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as {
          speciesId?: string;
          name?: string | null;
          identifier?: string | null;
          status?: AnimalStatus;
          birthDate?: unknown;
          vaccinationDate?: unknown;
          createdAt?: unknown;
          updatedAt?: unknown;
          createdBy?: string | null;
        };
        const info = speciesMap.get(data.speciesId ?? '') ?? {
          nameEn: '',
          nameAr: '',
          reproductionType: 'gives_birth' as ReproductionType,
        };
        list.push({
          id: docSnapshot.id,
          speciesId: data.speciesId ?? '',
          name: data.name ?? null,
          identifier: data.identifier ?? null,
          status: (data.status ?? 'alive') as AnimalStatus,
          birthDate: AnimalsService.toDate(data.birthDate),
          vaccinationDate: AnimalsService.toDate(data.vaccinationDate),
          createdAt: AnimalsService.toDate(data.createdAt),
          updatedAt: AnimalsService.toDate(data.updatedAt),
          createdBy: data.createdBy ?? null,
          speciesNameEn: info.nameEn,
          speciesNameAr: info.nameAr,
          reproductionType: info.reproductionType,
        });
      });

      return list;
    } catch {
      const msg = this.translation.instant('translate_animals-error-load');
      this._error.set(msg);
      throw msg;
    } finally {
      this._loading.set(false);
    }
  }

  async getById(id: string): Promise<AnimalWithSpecies | null> {
    const animalRef = doc(this.firestore, this.animalsCollectionName, id);
    const animalSnap = await getDoc(animalRef);
    if (!animalSnap.exists()) {
      return null;
    }

    const data = animalSnap.data() as {
      speciesId?: string;
      name?: string | null;
      identifier?: string | null;
      status?: AnimalStatus;
      birthDate?: unknown;
      vaccinationDate?: unknown;
      createdAt?: unknown;
      updatedAt?: unknown;
      createdBy?: string | null;
    };

    let speciesNameEn = '';
    let speciesNameAr = '';
    let reproductionType: ReproductionType = 'gives_birth';
    if (data.speciesId) {
      const speciesRef = doc(this.firestore, this.speciesCollectionName, data.speciesId);
      const speciesSnap = await getDoc(speciesRef);
      if (speciesSnap.exists()) {
        const s = speciesSnap.data() as {
          name?: string;
          nameEn?: string;
          nameAr?: string;
          reproductionType?: ReproductionType;
        };
        const fallback = s.name ?? '';
        speciesNameEn = s.nameEn ?? fallback;
        speciesNameAr = s.nameAr ?? fallback;
        reproductionType = (s.reproductionType ?? 'gives_birth') as ReproductionType;
      }
    }

    return {
      id: animalSnap.id,
      speciesId: data.speciesId ?? '',
      name: data.name ?? null,
      identifier: data.identifier ?? null,
      status: (data.status ?? 'alive') as AnimalStatus,
      birthDate: AnimalsService.toDate(data.birthDate),
      vaccinationDate: AnimalsService.toDate(data.vaccinationDate),
      createdAt: AnimalsService.toDate(data.createdAt),
      updatedAt: AnimalsService.toDate(data.updatedAt),
      createdBy: data.createdBy ?? null,
      speciesNameEn,
      speciesNameAr,
      reproductionType,
    };
  }

  async add(dto: CreateAnimalDto): Promise<Animal> {
    const uid = this.auth.user()?.uid ?? null;
    try {
      const ref = await addDoc(collection(this.firestore, this.animalsCollectionName), {
        speciesId: dto.speciesId,
        name: dto.name?.trim() || null,
        identifier: dto.identifier?.trim() || null,
        status: dto.status,
        birthDate: dto.birthDate ? Timestamp.fromDate(dto.birthDate) : null,
        vaccinationDate: dto.vaccinationDate ? Timestamp.fromDate(dto.vaccinationDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: uid,
      });

      return {
        id: ref.id,
        speciesId: dto.speciesId,
        name: dto.name?.trim() || null,
        identifier: dto.identifier?.trim() || null,
        status: dto.status,
        birthDate: dto.birthDate,
        vaccinationDate: dto.vaccinationDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: uid,
      };
    } catch (err) {
      const msg = this.translation.instant('translate_animals-error-create');
      this._error.set(msg);
      throw err;
    }
  }

  async update(id: string, dto: UpdateAnimalDto): Promise<void> {
    try {
      const payload: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };
      if (dto['speciesId'] !== undefined) payload['speciesId'] = dto['speciesId'];
      if (dto['name'] !== undefined) payload['name'] = dto['name']?.trim() || null;
      if (dto['identifier'] !== undefined) payload['identifier'] = dto['identifier']?.trim() || null;
      if (dto['status'] !== undefined) payload['status'] = dto['status'];
      if (dto['birthDate'] !== undefined) {
        payload['birthDate'] = dto['birthDate'] ? Timestamp.fromDate(dto['birthDate']) : null;
      }
      if (dto['vaccinationDate'] !== undefined) {
        payload['vaccinationDate'] = dto['vaccinationDate']
          ? Timestamp.fromDate(dto['vaccinationDate'])
          : null;
      }
      await updateDoc(doc(this.firestore, this.animalsCollectionName, id), payload);
    } catch {
      const msg = this.translation.instant('translate_animals-error-update');
      this._error.set(msg);
      throw msg;
    }
  }
}
