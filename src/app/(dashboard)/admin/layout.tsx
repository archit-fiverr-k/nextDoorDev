import { redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { Sidebar } from "@/components/shared/sidebar";
import { TopNav } from "@/components/shared/top-nav";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";
import { db } from "@/lib/db";

const navigationItems = [
  { title: "Dashboard", href: "/admin", iconName: "dashboard" as const },
  { title: "Platform Admins", href: "/admin/platform-admins", iconName: "pharmacies" as const },
  { title: "Pharmacies", href: "/admin/pharmacies", iconName: "pharmacies" as const },
  { title: "Bookings", href: "/admin/bookings", iconName: "bookings" as const },
  { title: "Audit Logs", href: "/admin/audit-logs", iconName: "audit-logs" as const },
  { title: "Comms Log", href: "/admin/comms-log", iconName: "audit-logs" as const },
  { title: "Integrations", href: "/admin/integrations", iconName: "widgets" as const },
];

const superAdminNavigationItems = [
  { title: "Dashboard", href: "/admin/dashboard", iconName: "dashboard" as const },
  { title: "Platform Admins", href: "/admin/platform-admins", iconName: "pharmacies" as const },
  { title: "Providers", href: "/admin/providers", iconName: "pharmacies" as const },
  { title: "Patients", href: "/admin/patients", iconName: "crm" as const },
  { title: "Bookings", href: "/admin/bookings", iconName: "bookings" as const },
  { title: "Subscriptions", href: "/admin/subscriptions", iconName: "credit-card" as const },
  { title: "Categories", href: "/admin/categories", iconName: "layers" as const },
  { title: "Reports", href: "/admin/reports", iconName: "bar-chart" as const },
  { title: "Email Templates", href: "/admin/email-templates", iconName: "mail" as const },
  { title: "Settings", href: "/admin/settings", iconName: "settings" as const },
  { title: "Integrations", href: "/admin/integrations", iconName: "widgets" as const },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getRequiredSession();

  // Route security guard
  if (session.user.role !== "super_admin" && session.user.role !== "platform_admin") {
    redirect("/");
  }

  // Format user profile
  const user = {
    name: session.user.name || "Administrator",
    email: session.user.email || "",
    role: session.user.role,
  };

  // Load global system settings
  const settings = await db.systemSetting.findFirst();

  // Filter navigation links based on role & permissions
  const itemsToFilter =
    session.user.role === "super_admin" ? superAdminNavigationItems : navigationItems;
  const visibleNavigationItems = itemsToFilter.filter((item) => {
    if (session.user.role === "super_admin") return true;
    if (item.href === "/admin") return true;
    if (item.href === "/admin/platform-admins") return !!session.user.canManageAdmins;
    if (item.href === "/admin/pharmacies") return !!session.user.canManagePharmacies;
    if (item.href === "/admin/bookings") return !!session.user.canManageBookings;
    if (item.href === "/admin/audit-logs") return !!session.user.canViewAuditLogs;
    if (item.href === "/admin/comms-log") return !!session.user.canViewCommsLog;
    if (item.href === "/admin/integrations") return !!session.user.canManageIntegrations;
    return false;
  });

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Impersonation Banner */}
      {session.user.isImpersonating && <ImpersonationBanner />}

      <div className="flex w-full flex-1 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Sidebar Layout */}
        <Sidebar user={user} items={visibleNavigationItems} />

        {/* Main Panel Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Sticky Header TopNav */}
          <TopNav title="Platform Administration" />

          {/* Dynamic Inner Subviews */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-7xl space-y-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
