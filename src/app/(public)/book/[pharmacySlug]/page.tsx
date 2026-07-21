import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BookingWizard } from "./booking-wizard";
import { auth } from "@/lib/auth";
import { Metadata } from "next";

export const revalidate = 0;

interface PublicBookingPageProps {
  params: {
    pharmacySlug: string;
  };
}

export async function generateMetadata({ params }: PublicBookingPageProps): Promise<Metadata> {
  let pharmacy = null;
  try {
    pharmacy = await db.pharmacy.findUnique({
      where: { slug: params.pharmacySlug },
    });
  } catch (err) {
    console.error("Booking metadata DB error:", err);
  }

  if (!pharmacy) return {};

  const name = pharmacy.displayName || pharmacy.name;
  return {
    title: `${name} — Book Healthcare Appointments`,
    description: `Book private healthcare appointments at ${name}. ${pharmacy.address}.`,
    openGraph: {
      title: `${name} | NextDoorClinic`,
      description: `Book your healthcare appointment online with ${name}.`,
      images: pharmacy.logoUrl ? [{ url: pharmacy.logoUrl }] : [],
    },
  };
}

export default async function PublicBookingPage({ params }: PublicBookingPageProps) {
  const { pharmacySlug } = params;
  const session = await auth();

  let settings = null;
  let pharmacy = null;
  let categories: any[] = [];

  try {
    // Maintenance mode guard
    settings = await db.systemSetting.findFirst();
    if (settings?.isMaintenanceMode) {
      const isAdmin =
        session?.user?.role === "super_admin" || session?.user?.role === "platform_admin";
      if (!isAdmin) {
        redirect("/maintenance");
      }
    }

    const res = await Promise.all([
      db.pharmacy.findUnique({
        where: { slug: pharmacySlug },
        include: {
          services: {
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
          },
        },
      }),
      db.category.findMany({
        where: { deleted: false, status: "ACTIVE" },
        orderBy: { displayOrder: "asc" },
      }),
    ]);
    pharmacy = res[0];
    categories = res[1];
  } catch (err) {
    console.error("PublicBookingPage DB error:", err);
  }

  if (!pharmacy) {
    redirect(`/book/${pharmacySlug}/suspended`);
  }

  if (pharmacy.status !== "APPROVED") {
    redirect(`/book/${pharmacySlug}/suspended`);
  }

  const sanitizedServices = pharmacy.services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    duration: s.duration,
    price: Number(s.price),
    isActive: s.isActive,
    category: s.category || "General",
    imageUrl: s.imageUrl,
  }));

  const sanitizedPharmacy = {
    id: pharmacy.id,
    name: pharmacy.name,
    slug: pharmacy.slug,
    logoUrl: pharmacy.logoUrl,
    brandColor: pharmacy.brandColor,
    displayName: pharmacy.displayName,
    address: pharmacy.address,
    phone: pharmacy.phone,
    description: pharmacy.description,
    welcomeMessage: pharmacy.welcomeMessage,
  };

  const sanitizedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    icon: c.icon,
    color: c.color,
  }));

  let currentUser = null;
  if (session?.user && session.user.role === "patient") {
    const customer = await db.customer.findUnique({
      where: { id: session.user.id },
    });
    if (customer) {
      currentUser = {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
      };
    }
  }

  return (
    <BookingWizard
      pharmacy={sanitizedPharmacy}
      services={sanitizedServices}
      categories={sanitizedCategories}
      currentUser={currentUser}
    />
  );
}
