export type Role = 'superAdmin' | 'admin' | 'user';

export function isValidRole(value: unknown): value is Role {
  return value === 'superAdmin' || value === 'admin' || value === 'user';
}
