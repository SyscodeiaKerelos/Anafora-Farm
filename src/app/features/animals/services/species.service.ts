import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  addDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

import type { ReproductionType } from '../../../core/types/species';
import { Species } from '../../../core/types/species';
import { TranslationService } from '../../../core/services/translation.service';
import { PREDEFINED_SPECIES, normalizeReproductionType } from '../data/predefined-species';

@Injectable()
export class SpeciesService {
  private readonly firestore = inject(Firestore);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly collectionName = 'species';

  async loadAll(): Promise<Species[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const snapshot = await getDocs(collection(this.firestore, this.collectionName));
      const list: Species[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as {
          name?: string;
          nameEn?: string;
          nameAr?: string;
          reproductionType?: ReproductionType;
          createdAt?: unknown;
        };
        const createdAt = data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : null;
        const nameEn = data.nameEn ?? data.name ?? '';
        const nameAr = data.nameAr ?? data.name ?? '';
        const rawType = (data.reproductionType ?? 'gives_birth') as ReproductionType;
        const reproductionType = normalizeReproductionType(nameEn, nameAr, rawType);
        list.push({
          id: docSnapshot.id,
          nameEn,
          nameAr,
          reproductionType,
          createdAt,
        });
      });

      if (list.length === 0) {
        await this.seedPredefined();
        const snapshot2 = await getDocs(collection(this.firestore, this.collectionName));
        snapshot2.forEach((docSnapshot) => {
          const data = docSnapshot.data() as {
            name?: string;
            nameEn?: string;
            nameAr?: string;
            reproductionType?: ReproductionType;
            createdAt?: unknown;
          };
          const createdAt = data.createdAt instanceof Timestamp
            ? data.createdAt.toDate()
            : null;
          const nameEn = data.nameEn ?? data.name ?? '';
          const nameAr = data.nameAr ?? data.name ?? '';
          const rawType = (data.reproductionType ?? 'gives_birth') as ReproductionType;
          const reproductionType = normalizeReproductionType(nameEn, nameAr, rawType);
          list.push({
            id: docSnapshot.id,
            nameEn,
            nameAr,
            reproductionType,
            createdAt,
          });
        });
      }

      return list;
    } catch {
      const msg = this.translation.instant('translate_animals-species-error-load');
      this._error.set(msg);
      throw msg;
    } finally {
      this._loading.set(false);
    }
  }

  /** Seeds Firestore with predefined species (EN/AR names + بيولد/يبيض) when collection is empty. */
  private async seedPredefined(): Promise<void> {
    const col = collection(this.firestore, this.collectionName);
    for (const entry of PREDEFINED_SPECIES) {
      await addDoc(col, {
        nameEn: entry.nameEn,
        nameAr: entry.nameAr,
        reproductionType: entry.reproductionType,
        createdAt: serverTimestamp(),
      });
    }
  }
}
