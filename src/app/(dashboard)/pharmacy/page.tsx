import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const revalidate = 0;

export default async function PharmacyRootRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const pharmacyId = session.user.pharmacyId;

  if (pharmacyId) {
    const pharmacy = await db.pharmacy.findUnique({
      where: { id: pharmacyId },
      select: { slug: true, id: true },
    });
    if (pharmacy) {
      redirect(`/pharmacy/${pharmacy.slug || pharmacy.id}`);
    }
  }

  redirect("/");
}
