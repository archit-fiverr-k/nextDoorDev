import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "super_admin" | "platform_admin" | "pharmacy" | "staff" | "patient";
      pharmacyId?: string | null;
      isFirstLogin: boolean;
      mustChangePassword: boolean;
      isImpersonating?: boolean;
      impersonatorId?: string;
      canManagePharmacies?: boolean;
      canManageSettings?: boolean;
      canViewAuditLogs?: boolean;
      canManageBookings?: boolean;
      isDeveloper?: boolean;
      canManageIntegrations?: boolean;
      canViewCommsLog?: boolean;
      canManageAdmins?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: "super_admin" | "platform_admin" | "pharmacy" | "staff" | "patient";
    pharmacyId?: string | null;
    isFirstLogin: boolean;
    mustChangePassword?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "super_admin" | "platform_admin" | "pharmacy" | "staff" | "patient";
    pharmacyId?: string | null;
    isFirstLogin: boolean;
    mustChangePassword: boolean;
    isImpersonating?: boolean;
    impersonatorId?: string;
    canManagePharmacies?: boolean;
    canManageSettings?: boolean;
    canViewAuditLogs?: boolean;
    canManageBookings?: boolean;
    isDeveloper?: boolean;
    canManageIntegrations?: boolean;
    canViewCommsLog?: boolean;
    canManageAdmins?: boolean;
  }
}
