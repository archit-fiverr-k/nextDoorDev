import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const pharmacyId = session.user.pharmacyId;

  if (pharmacyId) {
    redirect(`/pharmacy/${pharmacyId}`);
  }

  return <>{children}</>;
}
