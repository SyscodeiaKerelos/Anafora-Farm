import { Injectable, inject, signal } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';

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

export interface CreateUserResponse {
  uid: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt?: Date;
}

export interface UpdateUserRoleResponse {
  uid: string;
  role: Role;
}

export interface DeactivateUserResponse {
  uid: string;
  isActive: boolean;
}

@Injectable()
export class UserDirectoryService {
  private readonly firestore = inject(Firestore);
  private readonly functions = inject(Functions);
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
          isActive?: boolean;
        };
        users.push({
          id: docSnapshot.id,
          email: data.email ?? null,
          displayName: data.displayName ?? null,
          role: data.role ?? 'user',
          isActive: data.isActive ?? true,
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
    this._loading.set(true);
    try {
      const createUserWithRole = httpsCallable<CreateUserDto, CreateUserResponse>(
        this.functions,
        'createUserWithRole',
      );

      const result = await createUserWithRole({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        displayName: input.displayName?.trim() || undefined,
        role: input.role,
      });

      const userData = result.data;

      return {
        id: userData.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
      };
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-create');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async updateRole(uid: string, role: Role): Promise<void> {
    this._loading.set(true);
    try {
      const updateUserRole = httpsCallable<{ uid: string; role: Role }, UpdateUserRoleResponse>(
        this.functions,
        'updateUserRole',
      );

      await updateUserRole({ uid, role });
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-update');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async deactivateUser(uid: string, reason?: string): Promise<void> {
    this._loading.set(true);
    try {
      const deactivateUserFn = httpsCallable<
        { uid: string; reason?: string },
        DeactivateUserResponse
      >(this.functions, 'deactivateUser');

      await deactivateUserFn({ uid, reason });
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-update');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteUser(uid: string): Promise<void> {
    this._loading.set(true);
    try {
      const deleteUserFn = httpsCallable<{ uid: string }, { success: boolean }>(
        this.functions,
        'deleteUser',
      );

      await deleteUserFn({ uid });
    } catch (err) {
      const msg = this.translation.instant('translate_admin-users-error-delete');
      this.notification.showError(msg);
      throw err;
    } finally {
      this._loading.set(false);
    }
  }
}
