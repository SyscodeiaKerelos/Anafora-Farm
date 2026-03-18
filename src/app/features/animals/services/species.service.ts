import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

import type { ReproductionType, SpeciesType } from '../../../core/types/species';
import { Species } from '../../../core/types/species';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';
import { PREDEFINED_SPECIES, normalizeReproductionType, normalizeSpeciesType } from '../data/predefined-species';

@Injectable()
export class SpeciesService {
  private readonly firestore = inject(Firestore);
  private readonly notification = inject(NotificationService);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  readonly collectionName = 'species';

  private mapDocToSpecies(docSnapshot: { id: string; data: () => Record<string, unknown> }): Species {
    const data = docSnapshot.data();
    const docData = data as {
      name?: string;
      nameEn?: string;
      nameAr?: string;
      reproductionType?: ReproductionType;
      type?: SpeciesType;
      createdAt?: unknown;
    };
    const createdAt = docData.createdAt instanceof Timestamp
      ? docData.createdAt.toDate()
      : null;
    const nameEn = docData.nameEn ?? docData.name ?? '';
    const nameAr = docData.nameAr ?? docData.name ?? '';
    const rawReproductionType = (docData.reproductionType ?? 'gives_birth') as ReproductionType;
    const reproductionType = normalizeReproductionType(nameEn, nameAr, rawReproductionType);
    const rawType = (docData.type ?? (reproductionType === 'lays_egg' ? 'bird' : 'animal')) as SpeciesType;
    const type = normalizeSpeciesType(nameEn, nameAr, rawType);

    return {
      id: docSnapshot.id,
      nameEn,
      nameAr,
      reproductionType,
      type,
      createdAt,
    };
  }

  async loadAll(): Promise<Species[]> {
    this._loading.set(true);
    try {
      const snapshot = await getDocs(collection(this.firestore, this.collectionName));
      const list: Species[] = [];

      snapshot.forEach((docSnapshot) => {
        list.push(this.mapDocToSpecies({
          id: docSnapshot.id,
          data: () => docSnapshot.data(),
        }));
      });

      if (list.length === 0) {
        await this.seedPredefined();
        const snapshot2 = await getDocs(collection(this.firestore, this.collectionName));
        snapshot2.forEach((docSnapshot) => {
          list.push(this.mapDocToSpecies({
            id: docSnapshot.id,
            data: () => docSnapshot.data(),
          }));
        });
      }

      return list;
    } catch (err) {
      const msg = this.translation.instant('translate_animals-species-error-load');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  /** Seeds Firestore with predefined species (EN/AR names + type + reproduction) when collection is empty. */
  private async seedPredefined(): Promise<void> {
    const col = collection(this.firestore, this.collectionName);
    for (const entry of PREDEFINED_SPECIES) {
      await addDoc(col, {
        nameEn: entry.nameEn,
        nameAr: entry.nameAr,
        reproductionType: entry.reproductionType,
        type: entry.type,
        createdAt: serverTimestamp(),
      });
    }
  }
}
