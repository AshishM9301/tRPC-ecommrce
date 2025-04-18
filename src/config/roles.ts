import { RoleName } from "@prisma/client";

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  ADMIN: 2,
  SELLER: 3,
  CUSTOMER: 4,
} as const;

export const ROLE_NAMES = {
  [ROLE_IDS.SUPER_ADMIN]: RoleName.SUPER_ADMIN,
  [ROLE_IDS.ADMIN]: RoleName.ADMIN,
  [ROLE_IDS.SELLER]: RoleName.SELLER,
  [ROLE_IDS.CUSTOMER]: RoleName.CUSTOMER,
} as const;

export const ROLE_PERMISSIONS = {
  [ROLE_IDS.SUPER_ADMIN]: {
    canManageUsers: true,
    canManageProducts: true,
    canManageOrders: true,
    canManageRoles: true,
    canViewAnalytics: true,
    canManageSettings: true,
  },
  [ROLE_IDS.ADMIN]: {
    canManageUsers: true,
    canManageProducts: true,
    canManageOrders: true,
    canManageRoles: false,
    canViewAnalytics: true,
    canManageSettings: true,
  },
  [ROLE_IDS.SELLER]: {
    canManageUsers: false,
    canManageProducts: true,
    canManageOrders: true,
    canManageRoles: false,
    canViewAnalytics: true,
    canManageSettings: false,
  },
  [ROLE_IDS.CUSTOMER]: {
    canManageUsers: false,
    canManageProducts: false,
    canManageOrders: false,
    canManageRoles: false,
    canViewAnalytics: false,
    canManageSettings: false,
  },
} as const;

// Helper functions
export function getRoleName(roleId: number): RoleName | undefined {
  return ROLE_NAMES[roleId as keyof typeof ROLE_NAMES];
}

export function getRoleId(roleName: RoleName): number | undefined {
  const entry = Object.entries(ROLE_NAMES).find(([_, name]) => name === roleName);
  return entry ? Number(entry[0]) : undefined;
}

export function hasPermission(roleId: number, permission: keyof typeof ROLE_PERMISSIONS[1]): boolean {
  return ROLE_PERMISSIONS[roleId as keyof typeof ROLE_PERMISSIONS]?.[permission] ?? false;
}

// Type definitions
export type RoleId = keyof typeof ROLE_IDS;
export type RolePermission = keyof typeof ROLE_PERMISSIONS[1]; 