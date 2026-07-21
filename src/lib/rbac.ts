/**
 * NextDoorClinic - Role-Based Access Control (RBAC) System
 * Enforces granular permissions for Guest, Patient, Provider, Staff, Platform Admin, and Super Admin.
 */

export type UserRole =
  "guest" | "patient" | "pharmacy" | "staff" | "platform_admin" | "super_admin";

export type Permission =
  | "view:public"
  | "book:appointment"
  | "manage:own_profile"
  | "view:own_medical_records"
  | "manage:branch_services"
  | "manage:branch_availability"
  | "manage:branch_appointments"
  | "view:branch_crm"
  | "manage:branch_staff"
  | "manage:branch_billing"
  | "manage:platform_pharmacies"
  | "manage:platform_settings"
  | "view:platform_audit_logs"
  | "manage:super_admins";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  guest: ["view:public", "book:appointment"],
  patient: ["view:public", "book:appointment", "manage:own_profile", "view:own_medical_records"],
  pharmacy: [
    "view:public",
    "manage:own_profile",
    "manage:branch_services",
    "manage:branch_availability",
    "manage:branch_appointments",
    "view:branch_crm",
    "manage:branch_staff",
    "manage:branch_billing",
  ],
  staff: ["view:public", "manage:branch_appointments", "view:branch_crm", "manage:branch_services"],
  platform_admin: [
    "view:public",
    "manage:platform_pharmacies",
    "manage:platform_settings",
    "view:platform_audit_logs",
    "view:branch_crm",
  ],
  super_admin: [
    "view:public",
    "book:appointment",
    "manage:own_profile",
    "view:own_medical_records",
    "manage:branch_services",
    "manage:branch_availability",
    "manage:branch_appointments",
    "view:branch_crm",
    "manage:branch_staff",
    "manage:branch_billing",
    "manage:platform_pharmacies",
    "manage:platform_settings",
    "view:platform_audit_logs",
    "manage:super_admins",
  ],
};

/**
 * Checks if a given user role possesses a specific permission.
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  const activeRole: UserRole = role || "guest";
  const permissions = ROLE_PERMISSIONS[activeRole] || [];
  return permissions.includes(permission);
}

/**
 * Returns auto-logout threshold in minutes per role
 * Patient: 30m, Provider/Staff: 20m, Admin: 15m
 */
export function getAutoLogoutMinutes(role: UserRole | undefined | null): number {
  switch (role) {
    case "super_admin":
    case "platform_admin":
      return 15; // 15 minutes for Admins
    case "pharmacy":
    case "staff":
      return 20; // 20 minutes for Providers & Staff
    case "patient":
    default:
      return 30; // 30 minutes for Patients & Guests
  }
}
