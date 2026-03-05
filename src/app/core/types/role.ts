export type Role = 'superAdmin' | 'admin' | 'user';

export const RoleHierarchy: Record<Role, number> = {
  superAdmin: 3,
  admin: 2,
  user: 1,
};

