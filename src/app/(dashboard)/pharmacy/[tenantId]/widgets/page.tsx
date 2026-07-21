import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { WidgetsView } from "./widgets-view";

interface WidgetsPageProps {
  params: {
    tenantId: string;
  };
}

export default async function WidgetsPage({ params }: WidgetsPageProps) {
  const { tenantId } = params;

  // 1. Fetch pharmacy
  const pharmacy = await db.pharmacy.findUnique({
    where: { id: tenantId },
  });

  if (!pharmacy) {
    notFound();
  }

  // 2. Fetch all active services for this pharmacy
  const services = await db.service.findMany({
    where: {
      pharmacyId: tenantId,
      status: "ACTIVE",
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  // Determine dynamic subdomain booking URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // If appUrl starts with http://localhost or https://localhost
  let bookingUrl = appUrl;
  if (appUrl.includes("localhost")) {
    bookingUrl = appUrl.replace("://", `://${pharmacy.slug}.`);
  } else {
    // Production/staging domain mapping (e.g. clinic.nextdoorclinic.com)
    // Strip protocol first
    const cleanUrl = appUrl.replace(/(^\w+:|^)\/\//, "");
    bookingUrl = `https://${pharmacy.slug}.${cleanUrl}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Booking Widgets
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Promote your clinic, share booking links, download QR codes, and embed the booking wizard
          on your own website.
        </p>
      </div>

      <WidgetsView pharmacy={pharmacy} services={services} bookingUrl={bookingUrl} />
    </div>
  );
}
