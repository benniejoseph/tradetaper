import { SetMetadata } from '@nestjs/common';

export const ADMIN_ROLES_KEY = 'adminRoles';

export const ADMIN_ROLE_VALUES = [
  'super-admin',
  'billing-admin',
  'readonly-ops',
] as const;

export type AdminRole = (typeof ADMIN_ROLE_VALUES)[number];

export const AdminRoles = (...roles: AdminRole[]) =>
  SetMetadata(ADMIN_ROLES_KEY, roles);

export const isAdminRole = (value: unknown): value is AdminRole =>
  typeof value === 'string' &&
  (ADMIN_ROLE_VALUES as readonly string[]).includes(value);
