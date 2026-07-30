import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const revalidate = 0;

export default async function ProviderDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const pharmacyId = session.user.pharmacyId;

  if (pharmacyId) {
    redirect(`/pharmacy/${pharmacyId}`);
  }

  redirect("/");
}
