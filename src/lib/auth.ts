import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/crypto";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        try {
          // 1. Try SuperAdmin
          const superAdmin = await db.superAdmin.findUnique({
            where: { email },
          });
          if (superAdmin && verifyPassword(password, superAdmin.passwordHash)) {
            return {
              id: superAdmin.id,
              email: superAdmin.email,
              name: superAdmin.name || "Super Admin",
              role: "super_admin" as const,
              pharmacyId: null,
              isFirstLogin: superAdmin.isFirstLogin,
            };
          }

          // 2. Try PlatformAdmin
          const platformAdmin = await db.platformAdmin.findUnique({
            where: { email },
          });
          if (
            platformAdmin &&
            platformAdmin.isActive &&
            verifyPassword(password, platformAdmin.passwordHash)
          ) {
            return {
              id: platformAdmin.id,
              email: platformAdmin.email,
              name: platformAdmin.name || "Platform Admin",
              role: "platform_admin" as const,
              pharmacyId: null,
              isFirstLogin: platformAdmin.isFirstLogin,
            };
          }

          // 3. Try Pharmacy (Tenant acting as Login user)
          const pharmacy = await db.pharmacy.findUnique({
            where: { email },
          });
          if (
            pharmacy &&
            pharmacy.status === "APPROVED" &&
            verifyPassword(password, pharmacy.passwordHash)
          ) {
            return {
              id: pharmacy.id,
              email: pharmacy.email,
              name: pharmacy.name,
              role: "pharmacy" as const,
              pharmacyId: pharmacy.id,
              isFirstLogin: pharmacy.isFirstLogin,
            };
          }

          // 4. Try Staff member
          const staff = await db.staff.findUnique({
            where: { email },
            include: { pharmacy: true },
          });
          if (
            staff &&
            staff.isActive &&
            staff.pharmacy.status === "APPROVED" &&
            verifyPassword(password, staff.passwordHash)
          ) {
            return {
              id: staff.id,
              email: staff.email,
              name: staff.name,
              role: "staff" as const,
              pharmacyId: staff.pharmacyId,
              isFirstLogin: false,
              mustChangePassword: false,
            };
          }

          // 5. Try Patient (Customer)
          const customer = await db.customer.findFirst({
            where: { email },
          });
          if (
            customer &&
            customer.passwordHash &&
            verifyPassword(password, customer.passwordHash)
          ) {
            return {
              id: customer.id,
              email: customer.email,
              name: `${customer.firstName} ${customer.lastName}`,
              role: "patient" as const,
              pharmacyId: customer.pharmacyId,
              isFirstLogin: false,
              mustChangePassword: false,
            };
          }

          return null;
        } catch (authError) {
          console.error("Authentication DB exception:", authError);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.pharmacyId = user.pharmacyId;
        token.isFirstLogin = user.isFirstLogin;
        token.mustChangePassword = !!(user.mustChangePassword || user.isFirstLogin);
      }

      // Impersonation check: check if super_admin is currently impersonating a branch
      const adminId = (token.impersonatorId as string | undefined) || token.sub;
      if (adminId && (token.role === "super_admin" || token.impersonatorId)) {
        try {
          const superAdmin = await db.superAdmin.findUnique({
            where: { id: adminId },
          });

          if (superAdmin?.impersonatingId) {
            token.role = "pharmacy";
            token.pharmacyId = superAdmin.impersonatingId;
            token.isImpersonating = true;
            token.impersonatorId = superAdmin.id;
          } else {
            token.role = "super_admin";
            token.pharmacyId = null;
            token.isImpersonating = false;
            token.impersonatorId = undefined;
          }
        } catch (error) {
          console.error("❌ Impersonation JWT check failed:", error);
        }
      }

      // Platform Admin Permissions Check
      if (token.sub && token.role === "platform_admin") {
        try {
          const platformAdmin = await db.platformAdmin.findUnique({
            where: { id: token.sub },
          });
          if (platformAdmin) {
            token.isDeveloper = platformAdmin.isDeveloper;
            token.canManagePharmacies = platformAdmin.canManagePharmacies;
            token.canManageSettings = platformAdmin.canManageSettings;
            token.canViewAuditLogs = platformAdmin.canViewAuditLogs;
            token.canManageBookings = platformAdmin.canManageBookings;
            token.canManageIntegrations = platformAdmin.canManageIntegrations;
            token.canViewCommsLog = platformAdmin.canViewCommsLog;
            token.canManageAdmins = platformAdmin.canManageAdmins;
          }
        } catch (error) {
          console.error("❌ Platform admin permissions load failed:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as
          "super_admin" | "platform_admin" | "pharmacy" | "staff" | "patient";
        session.user.pharmacyId = token.pharmacyId as string | null;
        session.user.isFirstLogin = token.isFirstLogin as boolean;
        session.user.mustChangePassword = token.mustChangePassword as boolean;
        session.user.isImpersonating = token.isImpersonating as boolean | undefined;
        session.user.impersonatorId = token.impersonatorId as string | undefined;
        session.user.isDeveloper = token.isDeveloper as boolean | undefined;
        session.user.canManagePharmacies = token.canManagePharmacies as boolean | undefined;
        session.user.canManageSettings = token.canManageSettings as boolean | undefined;
        session.user.canViewAuditLogs = token.canViewAuditLogs as boolean | undefined;
        session.user.canManageBookings = token.canManageBookings as boolean | undefined;
        session.user.canManageIntegrations = token.canManageIntegrations as boolean | undefined;
        session.user.canViewCommsLog = token.canViewCommsLog as boolean | undefined;
        session.user.canManageAdmins = token.canManageAdmins as boolean | undefined;
      }
      return session;
    },
  },
});
