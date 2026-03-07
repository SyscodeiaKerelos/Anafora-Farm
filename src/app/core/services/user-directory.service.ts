import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore'; // ✅ ONLY from @angular/fire

import { AdminUser } from '../types/admin-user';
import { Role } from '../types/role';
import { NotificationService } from './notification.service';
import { TranslationService } from './translation.service';

export interface CreateUserDto {
  email: string;
  password?: string;
  displayName?: string;
  role: Role;
}

@Injectable()
export class UserDirectoryService {
  // ✅ Inject via Angular DI — never call getFirebaseDb() manually
  private readonly firestore = inject(Firestore);
  private readonly notification = inject(NotificationService);
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  readonly loading = this._loading.asReadonly();

  async loadAll(): Promise<AdminUser[]> {
    this._loading.set(true);
    try {
      const snapshot = await getDocs(collection(this.firestore, 'users'));
      const users: AdminUser[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data() as {
          email?: string | null;
          displayName?: string | null;
          role?: Role;
        };
        users.push({
          id: docSnapshot.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          role: data.role ?? 'user',
        });
      });

      return users;
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-load');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async createUser(input: CreateUserDto): Promise<AdminUser> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const ref = await addDoc(usersRef, {
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName?.trim() ?? null,
        role: input.role,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return {
        id: ref.id,
        email: input.email.trim().toLowerCase(),
        displayName: input.displayName?.trim() ?? null,
        role: input.role,
      };
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-create');
      this.notification.showError(msg);
      throw err;
    }
  }

  async updateRole(uid: string, role: Role): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'users', uid), {
        role,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-update');
      this.notification.showError(msg);
      throw err;
    }
  }

  async deactivateUser(uid: string, reason?: string): Promise<void> {
    try {
      await updateDoc(doc(this.firestore, 'users', uid), {
        isActive: false,
        disabledAt: serverTimestamp(),
        disabledReason: reason ?? null,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-update');
      this.notification.showError(msg);
      throw err;
    }
  }
}