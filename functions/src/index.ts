import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
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

function assertIsSuperAdmin(context: functions.https.CallableContext): void {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const role = context.auth.token.role as Role | undefined;
  if (role !== 'superAdmin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only super administrators can perform this action.',
    );
  }
}

export const createUserWithRole = functions.https.onCall(
  async (data: CreateUserWithRoleRequest, context): Promise<CreateUserWithRoleResponse> => {
    assertIsSuperAdmin(context);

    const { email, password, displayName, role } = data;

    if (!email || typeof email !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'A valid email is required.');
    }

    if (!isValidRole(role)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid role.');
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
        createdBy: context.auth?.uid ?? null,
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

export const updateUserRole = functions.https.onCall(
  async (data: UpdateUserRoleRequest, context): Promise<UpdateUserRoleResponse> => {
    assertIsSuperAdmin(context);

    const { uid, role } = data;

    if (!uid || typeof uid !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'A valid uid is required.');
    }

    if (!isValidRole(role)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid role.');
    }

    // Optional: prevent removing the last superAdmin
    if (role !== 'superAdmin') {
      const superAdmins = await auth.listUsers();
      const superAdminCount = superAdmins.users.filter(
        (user) => (user.customClaims?.role as Role | undefined) === 'superAdmin',
      ).length;

      if (superAdminCount <= 1) {
        const target = await auth.getUser(uid);
        const targetRole = target.customClaims?.role as Role | undefined;
        if (targetRole === 'superAdmin') {
          throw new functions.https.HttpsError(
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

export const deactivateUser = functions.https.onCall(
  async (data: DeactivateUserRequest, context): Promise<DeactivateUserResponse> => {
    assertIsSuperAdmin(context);

    const { uid, reason } = data;

    if (!uid || typeof uid !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'A valid uid is required.');
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
          disabledBy: context.auth?.uid ?? null,
          disabledReason: reason ?? null,
          updatedAt: disabledAt,
        },
        { merge: true },
      );

    return { uid, isActive: false };
  },
);

export const syncUserClaimsOnProfileChange = functions.firestore
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
