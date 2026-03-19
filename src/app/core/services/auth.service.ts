import { Injectable, computed, signal, inject } from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  ActionCodeSettings,
} from 'firebase/auth';
import { collection, doc, getDoc } from 'firebase/firestore';

import { getFirebaseAuth, getFirebaseDb } from '../../core/config/firebase.config';
import { Role, RoleHierarchy } from '../types/role';
import { TranslationService } from '../services/translation.service';
import { NotificationService } from './notification.service';

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly auth: Auth = getFirebaseAuth();
  private readonly db = getFirebaseDb();
  private readonly translation = inject(TranslationService);
  private readonly notification = inject(NotificationService);

  private readonly _user = signal<AuthUser | null>(null);

  readonly user = computed(() => this._user());
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);
  readonly isAuthenticated = computed(() => this._user() !== null);

  /**
   * Waits for the current Firebase auth user to be resolved.
   * Uses the cached user when available to avoid extra listeners.
   */
  async waitForCurrentUser(): Promise<User | null> {
    if (this.auth.currentUser) {
      return this.auth.currentUser;
    }

    return new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
        unsubscribe();
        resolve(firebaseUser);
      });
    });
  }

  constructor() {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (!firebaseUser) {
        this._user.set(null);
        return;
      }

      const role = await this.resolveUserRole(firebaseUser);

      this._user.set({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role,
      });
    });
  }

  async refreshUser(): Promise<void> {
    const current = this.auth.currentUser;

    if (!current) {
      this._user.set(null);
      return;
    }

    await current.getIdToken(true);
    const role = await this.resolveUserRole(current);

    this._user.set({
      uid: current.uid,
      email: current.email,
      displayName: current.displayName,
      role,
    });
  }

  async loginWithEmailPassword(credentials: Credentials): Promise<void> {
    await signInWithEmailAndPassword(this.auth, credentials.email, credentials.password);
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  async resetPassword(email: string): Promise<void> {
    const actionCodeSettings: ActionCodeSettings = {
      url: `${window.location.origin}/login`,
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(this.auth, email, actionCodeSettings);
  }

  async resetPasswordWithCustomUrl(email: string, continueUrl: string): Promise<void> {
    const actionCodeSettings: ActionCodeSettings = {
      url: continueUrl,
      handleCodeInApp: true,
    };
    await sendPasswordResetEmail(this.auth, email, actionCodeSettings);
  }

  mapResetPasswordErrorToMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const code = (error as { code?: string }).code ?? '';

    if (code.includes('auth/user-not-found')) {
      return this.translation.instant('translate_reset-password-error-user-not-found');
    }

    if (code.includes('auth/invalid-email')) {
      return this.translation.instant('translate_reset-password-error-invalid-email');
    }

    if (code.includes('auth/too-many-requests')) {
      return this.translation.instant('translate_reset-password-error-too-many-requests');
    }

    return null;
  }

  hasAtLeastRole(required: Role): boolean {
    const current = this._user()?.role;
    if (!current) {
      return false;
    }

    return RoleHierarchy[current] >= RoleHierarchy[required];
  }

  mapAuthErrorToMessage(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
      return null;
    }

    const code = (error as { code?: string }).code ?? '';

    if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password')) {
      return this.translation.instant('translate_auth-error-invalid-credential');
    }

    if (code.includes('auth/user-not-found')) {
      return this.translation.instant('translate_auth-error-user-not-found');
    }

    if (code.includes('auth/too-many-requests')) {
      return this.translation.instant('translate_auth-error-too-many-requests');
    }

    if (code.includes('auth/popup-closed-by-user')) {
      return this.translation.instant('translate_auth-error-popup-closed');
    }

    return null;
  }

  private async resolveUserRole(user: User): Promise<Role> {
    try {
      const idTokenResult = await user.getIdTokenResult();
      const claimRole = idTokenResult.claims['role'];

      if (claimRole === 'superAdmin' || claimRole === 'admin' || claimRole === 'user') {
        return claimRole;
      }
    } catch {
      // Ignore and fall back to Firestore
    }

    try {
      const ref = doc(collection(this.db, 'users'), user.uid);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data() as { role?: string };
        if (data.role === 'superAdmin' || data.role === 'admin' || data.role === 'user') {
          return data.role;
        }
      }
    } catch {
      // Ignore and fall back to default
    }

    return 'user';
  }
}
