import { db } from "@/lib/db";
import { getPharmacyAnalyticsAction } from "@/actions/analytics";
import { PharmacyAnalyticsView } from "./pharmacy-analytics-view";

export const revalidate = 0;

interface PharmacyAnalyticsPageProps {
  params: {
    tenantId: string;
  };
}

function isUuid(str: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);
}

export default async function PharmacyAnalyticsPage({ params }: PharmacyAnalyticsPageProps) {
  const isParamUuid = isUuid(params.tenantId);

  const pharmacy = await db.pharmacy.findFirst({
    where: isParamUuid
      ? { OR: [{ id: params.tenantId }, { slug: params.tenantId }] }
      : { slug: params.tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!pharmacy) {
    return <div>Pharmacy not found.</div>;
  }

  const res = await getPharmacyAnalyticsAction(pharmacy.id);

  if (!res.success || !res.analytics) {
    return <div>Failed to load analytics data.</div>;
  }

  return <PharmacyAnalyticsView pharmacy={pharmacy} analytics={res.analytics} />;
}
