/**
 * NextDoorClinic — Centralized Tenant Isolation & Role Assertion Engine
 * Enforces strict multi-tenant boundary isolation and role-based access control (RBAC).
 */

import { TenantAccessError } from "./errors";

export interface TenantUserSession {
  user?: {
    id: string;
    role?: string;
    pharmacyId?: string | null;
    isImpersonating?: boolean;
  };
}

export function assertTenantAccess(
  session: TenantUserSession | null | undefined,
  targetPharmacyId: string,
  allowedRoles?: string[]
): boolean {
  if (!session || !session.user) {
    throw new TenantAccessError("Authentication session required.");
  }

  const { role, pharmacyId } = session.user;

  // 1. Super Admins & Platform Admins bypass tenant boundary checks
  if (role === "super_admin" || role === "platform_admin") {
    return true;
  }

  // 2. Enforce Strict Tenant Isolation Boundary
  if (!pharmacyId || pharmacyId !== targetPharmacyId) {
    throw new TenantAccessError(
      "Cross-tenant access denied. Cannot access requested pharmacy workspace."
    );
  }

  // 3. Enforce Staff Role Matrix (if specified)
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      throw new TenantAccessError(
        `Insufficient role permissions. Action requires one of: ${allowedRoles.join(", ")}`
      );
    }
  }

  return true;
}
