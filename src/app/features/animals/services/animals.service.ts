import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from '@angular/fire/firestore';

import { Animal, AnimalWithSpecies, type AnimalVaccination } from '../../../core/types/animal';
import type { AnimalStatus } from '../../../core/types/animal-status';
import type { ReproductionType } from '../../../core/types/species';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';

export interface CreateAnimalDto {
  speciesId: string;
  name: string | null;
  identifier: string | null;
  status: AnimalStatus;
  birthDate: Date | null;
  vaccinationDate: Date | null;
  vaccinations?: AnimalVaccination[];
}

export interface UpdateAnimalDto {
  speciesId?: string;
  name?: string | null;
  identifier?: string | null;
  status?: AnimalStatus;
  birthDate?: Date | null;
  vaccinationDate?: Date | null;
  vaccinations?: AnimalVaccination[];
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
  private readonly notification = inject(NotificationService);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

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

  private static parseVaccinations(arr: unknown): AnimalVaccination[] {
    if (!Array.isArray(arr)) return [];
    const out: AnimalVaccination[] = [];
    for (const item of arr) {
      if (item && typeof item === 'object' && 'name' in item && 'date' in item) {
        const date = AnimalsService.toDate((item as { date?: unknown }).date);
        if (date) {
          out.push({
            name: String((item as { name?: string }).name ?? '').trim() || '—',
            date,
          });
        }
      }
    }
    return out;
  }

  async loadAll(): Promise<AnimalWithSpecies[]> {
    this._loading.set(true);
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
          vaccinations?: { name?: string; date?: unknown }[];
          createdAt?: unknown;
          updatedAt?: unknown;
          createdBy?: string | null;
        };
        const info = speciesMap.get(data.speciesId ?? '') ?? {
          nameEn: '',
          nameAr: '',
          reproductionType: 'gives_birth' as ReproductionType,
        };
        const vaccinations = AnimalsService.parseVaccinations(data.vaccinations);
        const legacyVaccDate = AnimalsService.toDate(data.vaccinationDate);
        list.push({
          id: docSnapshot.id,
          speciesId: data.speciesId ?? '',
          name: data.name ?? null,
          identifier: data.identifier ?? null,
          status: (data.status ?? 'alive') as AnimalStatus,
          birthDate: AnimalsService.toDate(data.birthDate),
          vaccinationDate: legacyVaccDate ?? (vaccinations.length ? vaccinations[vaccinations.length - 1].date : null),
          vaccinations: vaccinations.length ? vaccinations : undefined,
          createdAt: AnimalsService.toDate(data.createdAt),
          updatedAt: AnimalsService.toDate(data.updatedAt),
          createdBy: data.createdBy ?? null,
          speciesNameEn: info.nameEn,
          speciesNameAr: info.nameAr,
          reproductionType: info.reproductionType,
        });
      });

      return list;
    } catch (err) {
      const msg = this.translation.instant('translate_animals-error-load');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Finds an existing animal with the same speciesId and identifier (empty string and null treated as same).
   * Returns the first matching document id if any.
   */
  private async findExistingBySpeciesAndIdentifier(
    speciesId: string,
    identifier: string | null,
  ): Promise<{ id: string } | null> {
    const coll = collection(this.firestore, this.animalsCollectionName);
    const ident = identifier?.trim() ?? null;
    const q = query(
      coll,
      where('speciesId', '==', speciesId),
      where('identifier', '==', ident),
    );
    const snapshot = await getDocs(q);
    const first = snapshot.docs[0];
    if (!first) return null;
    return { id: first.id };
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
      vaccinations?: { name?: string; date?: unknown }[];
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

    const vaccinations = AnimalsService.parseVaccinations(data.vaccinations);
    const legacyVaccDate = AnimalsService.toDate(data.vaccinationDate);
    return {
      id: animalSnap.id,
      speciesId: data.speciesId ?? '',
      name: data.name ?? null,
      identifier: data.identifier ?? null,
      status: (data.status ?? 'alive') as AnimalStatus,
      birthDate: AnimalsService.toDate(data.birthDate),
      vaccinationDate: legacyVaccDate ?? (vaccinations.length ? vaccinations[vaccinations.length - 1].date : null),
      vaccinations: vaccinations.length ? vaccinations : undefined,
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
      const vaccinationsPayload =
        dto.vaccinations?.length ?
          dto.vaccinations.map((v) => ({
            name: v.name?.trim() || '—',
            date: Timestamp.fromDate(v.date),
          }))
        : null;
      const legacyVaccDate: Date | null =
        dto.vaccinationDate ?? (dto.vaccinations?.length ? dto.vaccinations[dto.vaccinations.length - 1].date : null);

      const ident = dto.identifier?.trim() ?? null;
      const existing = await this.findExistingBySpeciesAndIdentifier(dto.speciesId, ident);
      if (existing) {
        await this.update(existing.id, {
          speciesId: dto.speciesId,
          name: dto.name?.trim() || null,
          identifier: ident,
          status: dto.status,
          birthDate: dto.birthDate,
          vaccinationDate: legacyVaccDate,
          vaccinations: dto.vaccinations?.length ? dto.vaccinations : undefined,
        });
        const updated = await this.getById(existing.id);
        if (updated) {
          return {
            id: updated.id,
            speciesId: updated.speciesId,
            name: updated.name,
            identifier: updated.identifier,
            status: updated.status,
            birthDate: updated.birthDate,
            vaccinationDate: updated.vaccinationDate,
            vaccinations: updated.vaccinations,
            createdAt: updated.createdAt ?? new Date(),
            updatedAt: updated.updatedAt ?? new Date(),
            createdBy: updated.createdBy,
          };
        }
      }

      const payload: Record<string, unknown> = {
        speciesId: dto.speciesId,
        name: dto.name?.trim() || null,
        identifier: ident,
        status: dto.status,
        birthDate: dto.birthDate ? Timestamp.fromDate(dto.birthDate) : null,
        vaccinationDate: legacyVaccDate ? Timestamp.fromDate(legacyVaccDate) : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: uid,
      };
      if (vaccinationsPayload !== null) {
        payload['vaccinations'] = vaccinationsPayload;
      }
      const ref = await addDoc(collection(this.firestore, this.animalsCollectionName), payload);

      return {
        id: ref.id,
        speciesId: dto.speciesId,
        name: dto.name?.trim() || null,
        identifier: ident,
        status: dto.status,
        birthDate: dto.birthDate,
        vaccinationDate: dto.vaccinationDate ?? (dto.vaccinations?.length ? dto.vaccinations[dto.vaccinations.length - 1].date : null),
        vaccinations: dto.vaccinations,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: uid,
      };
    } catch (err: unknown) {
      const msg = this.translation.instant('translate_animals-error-create');
      this.notification.showError(msg);
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
      if (dto['vaccinations'] !== undefined) {
        payload['vaccinations'] =
          dto['vaccinations']?.length ?
            dto['vaccinations'].map((v) => ({
              name: v.name?.trim() || '—',
              date: Timestamp.fromDate(v.date),
            }))
          : null;
      }
      await updateDoc(doc(this.firestore, this.animalsCollectionName, id), payload);
    } catch (err) {
      const msg = this.translation.instant('translate_animals-error-update');
      this.notification.showError(msg);
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.firestore, this.animalsCollectionName, id));
    } catch (err) {
      const msg = this.translation.instant('translate_animals-error-delete');
      this.notification.showError(msg);
      throw err;
    }
  }
}
