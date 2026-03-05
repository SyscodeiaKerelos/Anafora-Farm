import type { Role } from './role';

/** Matches Firestore Timestamp shape so types do not depend on firebase-admin in this file. */
export interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface CreateUserWithRoleRequest {
  email: string;
  password?: string;
  displayName?: string;
  role: Role;
}

export interface CreateUserWithRoleResponse {
  uid: string;
  email: string;
  displayName: string | null;
  role: Role;
  createdAt: FirestoreTimestamp;
}

export interface UpdateUserRoleRequest {
  uid: string;
  role: Role;
}

export interface UpdateUserRoleResponse {
  uid: string;
  role: Role;
}

export interface DeactivateUserRequest {
  uid: string;
  reason?: string;
}

export interface DeactivateUserResponse {
  uid: string;
  isActive: boolean;
}
