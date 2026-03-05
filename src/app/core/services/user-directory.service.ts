import { Injectable, inject, signal } from '@angular/core';
import { httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';

import { getFirebaseDb, getFirebaseFunctions } from '../config/firebase.config';
import { AdminUser } from '../types/admin-user';
import { Role } from '../types/role';
import { TranslationService } from './translation.service';

interface CreateUserDto {
  email: string;
  password?: string;
  displayName?: string;
  role: Role;
}

interface CreateUserWithRoleResponse {
  uid: string;
  email: string;
  displayName: string | null;
  role: Role;
}

interface UpdateUserRoleRequest {
  uid: string;
  role: Role;
}

interface DeactivateUserRequest {
  uid: string;
  reason?: string;
}

@Injectable()
export class UserDirectoryService {
  private readonly db = getFirebaseDb();
  private readonly functions = getFirebaseFunctions();
  private readonly translation = inject(TranslationService);

  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  async loadAll(): Promise<AdminUser[]> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const snapshot = await getDocs(collection(this.db, 'users'));
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
    } catch {
      this._error.set(this.translation.instant('translate_admin-users-error-load'));
      throw this._error();
    } finally {
      this._loading.set(false);
    }
  }

  async createUser(input: CreateUserDto): Promise<AdminUser> {
    const callable = httpsCallable<CreateUserDto, CreateUserWithRoleResponse>(
      this.functions,
      'createUserWithRole',
    );

    try {
      const result = await callable(input);
      const data = result.data;

      return {
        id: data.uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
      };
    } catch {
      this._error.set(this.translation.instant('translate_admin-users-error-update'));
      throw this._error();
    }
  }

  async updateRole(uid: string, role: Role): Promise<void> {
    const callable = httpsCallable<UpdateUserRoleRequest, void>(
      this.functions,
      'updateUserRole',
    );

    try {
      await callable({ uid, role });
    } catch {
      this._error.set(this.translation.instant('translate_admin-users-error-update'));
      throw this._error();
    }
  }

  async deactivateUser(uid: string, reason?: string): Promise<void> {
    const callable = httpsCallable<DeactivateUserRequest, void>(
      this.functions,
      'deactivateUser',
    );

    try {
      await callable({ uid, reason });
    } catch {
      this._error.set(this.translation.instant('translate_admin-users-error-update'));
      throw this._error();
    }
  }
}

