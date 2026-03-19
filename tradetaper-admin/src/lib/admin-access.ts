import type { AdminRole } from './api';

export interface AdminCapabilities {
  canViewBilling: boolean;
  canViewDatabase: boolean;
  canRunSql: boolean;
}

export const getAdminCapabilities = (
  role: AdminRole | null | undefined,
): AdminCapabilities => {
  switch (role) {
    case 'super-admin':
      return {
        canViewBilling: true,
        canViewDatabase: true,
        canRunSql: true,
      };
    case 'billing-admin':
      return {
        canViewBilling: true,
        canViewDatabase: false,
        canRunSql: false,
      };
    case 'readonly-ops':
      return {
        canViewBilling: false,
        canViewDatabase: true,
        canRunSql: false,
      };
    default:
      return {
        canViewBilling: false,
        canViewDatabase: false,
        canRunSql: false,
      };
  }
};
