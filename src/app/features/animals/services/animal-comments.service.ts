import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';

import { AnimalComment } from '../../../core/types/animal-comment';
import type { AnimalCommentType } from '../../../core/types/animal-comment';
import { AuthService } from '../../../core/services/auth.service';
import { TranslationService } from '../../../core/services/translation.service';

export interface CreateAnimalCommentDto {
  text: string;
  type: AnimalCommentType;
  medicineName?: string | null;
  dose?: string | null;
  nextDoseDate?: Date | null;
}

@Injectable()
export class AnimalCommentsService {
  private readonly firestore = inject(Firestore);
  private readonly auth = inject(AuthService);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  private static toDate(value: unknown): Date | null {
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    if (value instanceof Date) {
      return value;
    }
    return null;
  }

  async loadComments(animalId: string): Promise<AnimalComment[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const commentsRef = collection(
        this.firestore,
        'animals',
        animalId,
        'comments',
      );
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: AnimalComment[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as {
          text?: string;
          type?: AnimalCommentType;
          medicineName?: string | null;
          dose?: string | null;
          nextDoseDate?: unknown;
          createdAt?: unknown;
          createdBy?: string | null;
        };
        list.push({
          id: docSnapshot.id,
          text: data.text ?? '',
          type: (data.type ?? 'general') as AnimalCommentType,
          medicineName: data.medicineName ?? null,
          dose: data.dose ?? null,
          nextDoseDate: AnimalCommentsService.toDate(data.nextDoseDate),
          createdAt: AnimalCommentsService.toDate(data.createdAt),
          createdBy: data.createdBy ?? null,
        });
      });

      return list;
    } catch {
      const msg = this.translation.instant('translate_animals-comments-error-load');
      this._error.set(msg);
      throw msg;
    } finally {
      this._loading.set(false);
    }
  }

  async addComment(animalId: string, dto: CreateAnimalCommentDto): Promise<AnimalComment> {
    const uid = this.auth.user()?.uid ?? null;
    const text = dto.text.trim();
    if (!text) {
      const msg = this.translation.instant('translate_animals-comments-error-text-required');
      this._error.set(msg);
      throw msg;
    }

    try {
      const commentsRef = collection(
        this.firestore,
        'animals',
        animalId,
        'comments',
      );
      const ref = await addDoc(commentsRef, {
        text,
        type: dto.type,
        medicineName: dto.type === 'medicine' ? (dto.medicineName?.trim() || null) : null,
        dose: dto.type === 'medicine' ? (dto.dose?.trim() || null) : null,
        nextDoseDate:
          dto.type === 'medicine' && dto.nextDoseDate
            ? Timestamp.fromDate(dto.nextDoseDate)
            : null,
        createdAt: serverTimestamp(),
        createdBy: uid,
      });

      return {
        id: ref.id,
        text,
        type: dto.type,
        medicineName: dto.type === 'medicine' ? (dto.medicineName?.trim() || null) : null,
        dose: dto.type === 'medicine' ? (dto.dose?.trim() || null) : null,
        nextDoseDate: dto.type === 'medicine' ? dto.nextDoseDate ?? null : null,
        createdAt: new Date(),
        createdBy: uid,
      };
    } catch (err) {
      const msg = this.translation.instant('translate_animals-comments-error-create');
      this._error.set(msg);
      throw err;
    }
  }
}
