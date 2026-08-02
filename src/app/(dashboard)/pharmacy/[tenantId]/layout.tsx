import { redirect, notFound } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { db } from "@/lib/db";
import { PharmacyHeader } from "@/components/pharmacy/pharmacy-header";
import { ImpersonationBanner } from "@/components/shared/impersonation-banner";

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantId: string };
}) {
  const session = await getRequiredSession();
  const isParamUuid = isUuid(params.tenantId);

  // Load pharmacy details safely by ID or Slug without PostgreSQL UUID type errors
  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
  });

  if (!pharmacy) {
    notFound();
  }

  // Multi-Tenant Isolation Security Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacy.id) {
    redirect("/");
  }

  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  // Format user profile
  const user = {
    name: session.user.name || "Pharmacy Staff",
    email: session.user.email || "",
    role: session.user.role as string,
  };

  // Public Booking URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const publicBookingUrl = `${appUrl}/book/${pharmacy.slug || pharmacy.id}`;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white font-sans text-slate-900 antialiased dark:bg-zinc-950 dark:text-slate-100">
      {/* Impersonation Banner */}
      {session.user.isImpersonating && <ImpersonationBanner />}

      {/* Left Sidebar + Topbar Navigation Header */}
      <PharmacyHeader
        tenantId={pharmacy.slug || pharmacy.id}
        pharmacyName={pharmacy.name}
        publicBookingUrl={publicBookingUrl}
        user={user}
      />

      {/* Main Workspace Body (Offset by Sidebar Width on Desktop) */}
      <main className="w-full flex-1 space-y-8 p-4 sm:p-6 lg:py-8 lg:pl-72 lg:pr-8">
        <div className="mx-auto w-full max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
