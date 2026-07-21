import { redirect, notFound } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/shared/sidebar";
import { TopNav } from "@/components/shared/top-nav";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";

const navigationItems = (tenantId: string) => [
  { title: "Dashboard", href: `/pharmacy/${tenantId}`, iconName: "dashboard" as const },
  {
    title: "Appointments",
    href: `/pharmacy/${tenantId}/appointments`,
    iconName: "appointments" as const,
  },
  { title: "Calendar", href: `/pharmacy/${tenantId}/calendar`, iconName: "calendar" as const },
  { title: "Patients", href: `/pharmacy/${tenantId}/patients`, iconName: "patients" as const },
  { title: "Services", href: `/pharmacy/${tenantId}/services`, iconName: "services" as const },
  {
    title: "Categories",
    href: `/pharmacy/${tenantId}/categories`,
    iconName: "categories" as const,
  },
  { title: "Staff", href: `/pharmacy/${tenantId}/staff`, iconName: "staff" as const },
  { title: "Clinic Profile", href: `/pharmacy/${tenantId}/profile`, iconName: "profile" as const },
  { title: "Reviews", href: `/pharmacy/${tenantId}/reviews`, iconName: "reviews" as const },
  { title: "Marketing", href: `/pharmacy/${tenantId}/marketing`, iconName: "marketing" as const },
  { title: "Reports", href: `/pharmacy/${tenantId}/reports`, iconName: "reports" as const },
  {
    title: "Booking Settings",
    href: `/pharmacy/${tenantId}/booking-settings`,
    iconName: "booking-settings" as const,
  },
  {
    title: "Subscription",
    href: `/pharmacy/${tenantId}/subscription`,
    iconName: "subscription" as const,
  },
  { title: "Billing", href: `/pharmacy/${tenantId}/billing`, iconName: "billing" as const },
  {
    title: "Notifications",
    href: `/pharmacy/${tenantId}/notifications`,
    iconName: "notifications" as const,
  },
  { title: "Support", href: `/pharmacy/${tenantId}/support`, iconName: "support" as const },
  { title: "Settings", href: `/pharmacy/${tenantId}/settings`, iconName: "settings" as const },
];

export default async function PharmacyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantId: string };
}) {
  const session = await getRequiredSession();

  // Multi-Tenant Isolation Security Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== params.tenantId) {
    redirect("/");
  }

  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  // Load pharmacy details
  const pharmacy = await db.pharmacy.findUnique({
    where: { id: params.tenantId },
  });

  if (!pharmacy) {
    notFound();
  }

  // Format user profile
  const user = {
    name: session.user.name || "Pharmacy Staff",
    email: session.user.email || "",
    role: session.user.role as "super_admin" | "platform_admin" | "pharmacy",
  };

  // Determine dynamic subdomain booking URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicUrl = appUrl.replace("localhost", `${pharmacy.slug}.localhost`);

  // Load global system settings
  const settings = await db.systemSetting.findFirst();

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {/* Impersonation Banner */}
      {session.user.isImpersonating && <ImpersonationBanner />}

      <div className="flex w-full flex-1 overflow-hidden bg-white dark:bg-zinc-950">
        {/* Sidebar navigation */}
        <Sidebar user={user} items={navigationItems(params.tenantId)} tenantName={pharmacy.name} />

        {/* Main Panel Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Sticky Header TopNav with Booking URL Shortcut */}
          <TopNav title="Pharmacy Workspace" publicUrl={publicUrl} />

          {/* Dynamic Inner Subviews */}
          <main className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto max-w-7xl space-y-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
