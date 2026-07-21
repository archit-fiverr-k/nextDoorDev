import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { ProfileForm } from "./profile-form";
import { H1, P } from "@/components/ui/typography";

interface PharmacyProfilePageProps {
  params: {
    tenantId: string;
  };
}

export default async function PharmacyProfilePage({ params }: PharmacyProfilePageProps) {
  const session = await getRequiredSession();

  // Tenant Boundary Isolation Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== params.tenantId) {
    redirect("/");
  }
  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  const pharmacy = await db.pharmacy.findUnique({
    where: { id: params.tenantId },
    include: {
      availability: {
        orderBy: { dayOfWeek: "asc" },
      },
      services: {
        where: { isActive: true },
      },
    },
  });

  if (!pharmacy) {
    notFound();
  }

  return (
    <div className="select-text space-y-6">
      <div>
        <H1>Clinic Profile & Settings</H1>
        <P className="mt-1">
          Customize your clinical directory listing, brand styling, contact cards, opening hours,
          and whitelabeled booking pages.
        </P>
      </div>

      <ProfileForm pharmacy={pharmacy} />
    </div>
  );
}
