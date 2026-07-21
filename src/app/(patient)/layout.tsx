import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import PatientSidebar from "@/components/patient/patient-sidebar";
import PatientHeader from "@/components/patient/patient-header";

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "patient") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <PatientSidebar user={session.user} />

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <PatientHeader user={session.user} />
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
