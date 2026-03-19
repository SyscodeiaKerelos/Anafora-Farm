import { Role } from './role';

export interface AdminUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  isActive?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
}
