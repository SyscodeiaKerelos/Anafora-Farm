import * as admin from 'firebase-admin';
import * as functionsV1 from 'firebase-functions/v1';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import type {
  CreateUserWithRoleRequest,
  CreateUserWithRoleResponse,
  DeactivateUserRequest,
  DeactivateUserResponse,
  UpdateUserRoleRequest,
  UpdateUserRoleResponse,
} from './types/callable';
import type { Role } from './types/role';
import { isValidRole } from './types/role';

admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();

/** CORS: allow all origins. Callable functions are protected by auth (assertIsSuperAdmin). */
function assertIsSuperAdmin(requestAuth: { uid: string; token?: Record<string, unknown> } | undefined): void {
  if (!requestAuth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const role = requestAuth.token?.role as Role | undefined;
  if (role !== 'superAdmin') {
    throw new HttpsError(
      'permission-denied',
      'Only super administrators can perform this action.',
    );
  }
}

export const createUserWithRole = onCall(
  { cors: true },
  async (request): Promise<CreateUserWithRoleResponse> => {
    assertIsSuperAdmin(request.auth);

    const data = request.data as CreateUserWithRoleRequest;
    const { email, password, displayName, role } = data;

    if (!email || typeof email !== 'string') {
      throw new HttpsError('invalid-argument', 'A valid email is required.');
    }

    if (!isValidRole(role)) {
      throw new HttpsError('invalid-argument', 'Invalid role.');
    }

    const trimmedEmail = email.trim().toLowerCase();

    const newUser = await auth.createUser({
      email: trimmedEmail,
      password: password && password.length >= 8 ? password : undefined,
      displayName,
      disabled: false,
    });

    await auth.setCustomUserClaims(newUser.uid, { role });

    const createdAt = admin.firestore.Timestamp.now();

    await db
      .collection('users')
      .doc(newUser.uid)
      .set({
        email: trimmedEmail,
        displayName: displayName ?? null,
        role,
        isActive: true,
        createdAt,
        createdBy: request.auth?.uid ?? null,
        updatedAt: createdAt,
      });

    return {
      uid: newUser.uid,
      email: trimmedEmail,
      displayName: displayName ?? null,
      role,
      createdAt,
    };
  },
);

export const updateUserRole = onCall(
  { cors: true },
  async (request): Promise<UpdateUserRoleResponse> => {
    assertIsSuperAdmin(request.auth);

    const data = request.data as UpdateUserRoleRequest;
    const { uid, role } = data;

    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'A valid uid is required.');
    }

    if (!isValidRole(role)) {
      throw new HttpsError('invalid-argument', 'Invalid role.');
    }

    if (role !== 'superAdmin') {
      const superAdmins = await auth.listUsers();
      const superAdminCount = superAdmins.users.filter(
        (user) => (user.customClaims?.role as Role | undefined) === 'superAdmin',
      ).length;

      if (superAdminCount <= 1) {
        const target = await auth.getUser(uid);
        const targetRole = target.customClaims?.role as Role | undefined;
        if (targetRole === 'superAdmin') {
          throw new HttpsError(
            'failed-precondition',
            'Cannot demote the last super administrator.',
          );
        }
      }
    }

    await auth.setCustomUserClaims(uid, { role });

    const updatedAt = admin.firestore.Timestamp.now();

    await db
      .collection('users')
      .doc(uid)
      .set({ role, updatedAt }, { merge: true });

    return { uid, role };
  },
);

export const deactivateUser = onCall(
  { cors: true },
  async (request): Promise<DeactivateUserResponse> => {
    assertIsSuperAdmin(request.auth);

    const data = request.data as DeactivateUserRequest;
    const { uid, reason } = data;

    if (!uid || typeof uid !== 'string') {
      throw new HttpsError('invalid-argument', 'A valid uid is required.');
    }

    await auth.updateUser(uid, { disabled: true });

    const disabledAt = admin.firestore.Timestamp.now();

    await db
      .collection('users')
      .doc(uid)
      .set(
        {
          isActive: false,
          disabledAt,
          disabledBy: request.auth?.uid ?? null,
          disabledReason: reason ?? null,
          updatedAt: disabledAt,
        },
        { merge: true },
      );

    return { uid, isActive: false };
  },
);

export const syncUserClaimsOnProfileChange = functionsV1.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const before = change.before.data() as { role?: Role } | undefined;
    const after = change.after.data() as { role?: Role } | undefined;

    const previousRole = before?.role;
    const newRole = after?.role;

    if (!newRole || previousRole === newRole || !isValidRole(newRole)) {
      return;
    }

    await auth.setCustomUserClaims(context.params.uid, { role: newRole });
  });
