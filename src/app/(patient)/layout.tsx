import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PatientLayoutClient } from "@/components/patient/patient-layout-client";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "patient") {
    redirect("/");
  }

  return <PatientLayoutClient user={session.user}>{children}</PatientLayoutClient>;
}
