import { Injectable, inject, signal } from '@angular/core';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

import type { SpeciesType } from '../../../core/types/species';
import { NotificationService } from '../../../core/services/notification.service';
import { TranslationService } from '../../../core/services/translation.service';

export interface NewSpecies {
  name: string;
  type: SpeciesType;
}

@Injectable()
export class SpeciesService {
  private readonly firestore = inject(Firestore);
  private readonly notification = inject(NotificationService);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  readonly collectionName = 'species';

  async addSpecies(species: NewSpecies): Promise<{ id: string }> {
    this._loading.set(true);
    try {
      const col = collection(this.firestore, this.collectionName);
      const docRef = await addDoc(col, {
        nameEn: species.name,
        nameAr: species.name,
        type: species.type,
        reproductionType: species.type === 'bird' ? 'lays_egg' : 'gives_birth',
        createdAt: serverTimestamp(),
      });
      this.notification.showSuccess(this.translation.instant('translate_species-success-added'));
      return { id: docRef.id };
    } catch {
      this.notification.showError(this.translation.instant('translate_species-error-create'));
      throw new Error('Failed to add species');
    } finally {
      this._loading.set(false);
    }
  }
}
