## Authentication & Roles

This is the canonical copy of the authentication and roles rules for the project. A shorter version is also available at `AUTH.md` in the repo root.

### Overview

- **Auth provider**: Firebase Authentication (email/password + Google).
- **Roles**: `superAdmin` > `admin` > `user` (strict hierarchy).
- **Storage**:
  - Canonical role is stored as a Firebase **custom claim** on the user ID token.
  - Role and profile metadata are mirrored in the Firestore `users` collection.

### Firebase Initialization

- Firebase is initialized once via `src/app/core/config/firebase.config.ts`.
- Always access Firebase through the helpers:
  - `getFirebaseAuth()` for `Auth`
  - `getFirebaseDb()` for `Firestore`
  - `getFirebaseStorage()` for Storage

### AuthService

- Located at `src/app/core/services/auth.service.ts`.
- Responsibilities:
  - Wrap Firebase Auth and expose a simple, signal-based API.
  - Keep an `AuthUser` model with `{ uid, email, displayName, role }`.
  - Resolve the current role using:
    1. `user.getIdTokenResult()` and a `role` custom claim.
    2. Fallback to `users/{uid}` in Firestore.
    3. Final fallback: `user`.
- Public API (core methods):
  - `loginWithEmailPassword({ email, password })`
  - `loginWithGoogle()`
  - `logout()`
  - `user` (signal) – current `AuthUser | null`
  - `role` (signal) – current `Role | null`
  - `isAuthenticated` (signal) – boolean
  - `hasAtLeastRole(required: Role)` – hierarchy-aware role check
  - `mapAuthErrorToMessage(error)` – maps Firebase error codes to UX-friendly messages (localized via i18n).

### Role Type & Hierarchy

- Defined at `src/app/core/types/role.ts`:
  - `export type Role = 'superAdmin' | 'admin' | 'user';`
  - `RoleHierarchy` maps each role to a numeric level used by `hasAtLeastRole`.
- **Rule**: Always use the shared `Role` type and helpers instead of hard-coded strings.

### Guards

- Defined in `src/app/core/guards/`:
  - `auth.guard.ts`:
    - Ensures the user is authenticated; redirects to `/login` when not.
  - `role.guard.ts`:
    - Factory `roleGuard(required: Role)` that:
      - Redirects unauthenticated users to `/login`.
      - Redirects authenticated but unauthorized users to `/`.
- Usage in `src/app/app.routes.ts`:
  - `''` uses `authGuard` – home requires a logged-in user.
  - `'admin/users'` uses `roleGuard('superAdmin')` – only super admins may access.

### Login Page

- Implemented as `LoginPage` at `src/app/features/auth/login.page.ts`.
- Features:
  - Glassmorphism layout using shared Tailwind utilities (`app-bg`, `card-glass`, etc.).
  - Email/password login with validation via Angular Signal Forms.
  - Google sign-in via Firebase `GoogleAuthProvider`.
  - Friendly, localized error messages from `AuthService.mapAuthErrorToMessage` and i18n.
  - On success, redirects to `/` (the main home page).

### Admin User Management

- Implemented as `AdminUsersPage` at `src/app/features/admin/admin-users.page.ts`.
- Visible only to `superAdmin` via `roleGuard('superAdmin')`.
- Reads from `users` collection in Firestore and displays:
  - Email, display name, and current role for each user document.
- Allows updating the `role` field for users:
  - Writes the `role` into the Firestore document.
  - **Important**: Applying roles as Firebase custom claims must be handled via secure backend
    or Cloud Functions – never from untrusted client code.

### Local Testing

1. Configure Firebase project credentials in `firebase.config.ts`.
2. Run `bun install` (or `npm install`) and then `ng serve`.
3. Create users in Firebase Authentication (email/password or Google).
4. In Firestore:
   - Create a `users` document for each user with fields:
     - `email`
     - `displayName`
     - `role` (`'superAdmin' | 'admin' | 'user'`)
5. Manually assign the `role` custom claim via backend tooling or the Firebase Admin SDK
   (outside of this frontend app) to keep Auth and Firestore in sync.

