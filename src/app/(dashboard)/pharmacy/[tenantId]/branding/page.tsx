import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getRequiredSession } from "@/lib/session";
import { BrandingForm } from "./branding-form";
import { H1, P } from "@/components/ui/typography";

interface PharmacyBrandingPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyBrandingPage({ params }: PharmacyBrandingPageProps) {
  const session = await getRequiredSession();
  const isParamUuid = isUuid(params.tenantId);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      displayName: true,
      brandColor: true,
      logoUrl: true,
    },
  });

  if (!pharmacy) {
    notFound();
  }

  // Tenant Boundary Guard
  const isTenantUser = session.user.role === "pharmacy";
  const isPlatformAdmin =
    session.user.role === "super_admin" || session.user.role === "platform_admin";

  if (isTenantUser && session.user.pharmacyId !== pharmacy.id) {
    redirect("/");
  }
  if (!isTenantUser && !isPlatformAdmin) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div>
        <H1>Custom Branding</H1>
        <P className="mt-1">
          Customize the booking experience with your logo, display name, and accent colors.
        </P>
      </div>

      <BrandingForm pharmacy={pharmacy} />
    </div>
  );
}
