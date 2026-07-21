import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, H2, P } from "@/components/ui/typography";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CalendarRange,
  Store,
  History,
  Edit3,
  UserX,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import {
  updatePatientContactAction,
  suspendPatientAction,
  activatePatientAction,
} from "@/actions/super-admin";

export const revalidate = 0;

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string; error?: string; success?: string };
}

export default async function PatientDetailsPage({ params, searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  const { id } = params;
  const activeTab = searchParams.tab || "profile";
  const errorMsg = searchParams.error || "";
  const successMsg = searchParams.success || "";

  // Fetch customer
  const patient = await db.customer.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
        include: {
          pharmacy: { select: { name: true, email: true } },
          service: { select: { name: true, duration: true } },
        },
      },
    },
  });

  if (!patient || patient.deletedAt) {
    return (
      <div className="p-8 text-center">
        <H2 className="text-red-500">Patient Not Found</H2>
        <P className="mt-2">This patient account does not exist or has been soft-deleted.</P>
        <Link
          href="/admin/patients"
          className="text-blue-650 mt-4 inline-block font-bold hover:underline"
        >
          &larr; Back to Directory
        </Link>
      </div>
    );
  }

  // Aggregate provider history
  const visitedClinicsMap: { [key: string]: { name: string; email: string; count: number } } = {};
  patient.appointments.forEach((appt) => {
    const pharmacyId = appt.pharmacyId;
    if (!visitedClinicsMap[pharmacyId]) {
      visitedClinicsMap[pharmacyId] = {
        name: appt.pharmacy.name,
        email: appt.pharmacy.email,
        count: 0,
      };
    }
    visitedClinicsMap[pharmacyId].count++;
  });
  const visitedClinics = Object.keys(visitedClinicsMap).map((key) => ({
    id: key,
    ...visitedClinicsMap[key],
  }));

  // Fetch patient-specific audit logs
  const auditLogs = await db.auditLog.findMany({
    where: {
      entityName: "Customer",
      entityId: id,
    },
    orderBy: { createdAt: "desc" },
    take: 15,
  });

  // Server Action inline handlers
  const handleUpdateContact = async (formData: FormData) => {
    "use server";
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;
    const gender = formData.get("gender") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;

    const res = await updatePatientContactAction(id, {
      firstName,
      lastName,
      email,
      phone,
      address,
      gender,
      dateOfBirth: dateOfBirth || undefined,
    });

    if (!res.success) {
      redirect(
        `/admin/patients/${id}?tab=profile&error=${encodeURIComponent(res.error || "Failed to update")}`
      );
    } else {
      redirect(`/admin/patients/${id}?tab=profile&success=Profile updated successfully!`);
    }
  };

  const handleSuspend = async () => {
    "use server";
    await suspendPatientAction(id);
    redirect(`/admin/patients/${id}`);
  };

  const handleActivate = async () => {
    "use server";
    await activatePatientAction(id);
    redirect(`/admin/patients/${id}`);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          href="/admin/patients"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-2">
            <H1 className="font-black text-slate-900 dark:text-slate-50">
              {patient.firstName} {patient.lastName}
            </H1>
            <span
              className={`select-none rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                patient.isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                  : "text-rose-750 bg-rose-50 dark:bg-rose-950/20"
              }`}
            >
              {patient.isActive ? "ACTIVE" : "SUSPENDED"}
            </span>
          </div>
          <P className="mt-0.5 text-xs text-slate-400">
            ID: {patient.id} | Joined: {new Date(patient.createdAt).toLocaleDateString()}
          </P>
        </div>
      </div>

      {/* Account controls */}
      <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Account Control
            </span>
            <span className="text-xs text-slate-500">
              Toggle whether this user can book marketplace appointments
            </span>
          </div>
          {patient.isActive ? (
            <form action={handleSuspend}>
              <Button
                type="submit"
                variant="primary"
                className="bg-rose-650 hover:bg-rose-750 h-9 font-bold text-white"
              >
                Suspend Patient Account
              </Button>
            </form>
          ) : (
            <form action={handleActivate}>
              <Button
                type="submit"
                className="h-9 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
              >
                Reactivate Patient Account
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Tab select */}
      <div className="flex w-full select-none items-center space-x-1 overflow-x-auto border-b border-slate-100 pb-2 dark:border-zinc-900">
        {[
          { id: "profile", label: "Personal Information" },
          { id: "appointments", label: "Appointment Log" },
          { id: "providers", label: "Clinic History" },
          { id: "audit", label: "Audit Logs" },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={`/admin/patients/${id}?tab=${t.id}`}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Tab Panels */}

      {/* 1. Profile Editing */}
      {activeTab === "profile" && (
        <Card className="shadow-premium max-w-2xl border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Edit Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {errorMsg && (
              <div className="border-rose-250 mb-6 rounded-lg border bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="border-emerald-250 mb-6 rounded-lg border bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                {successMsg}
              </div>
            )}

            <form action={handleUpdateContact} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    defaultValue={patient.firstName}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    defaultValue={patient.lastName}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={patient.email}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    required
                    defaultValue={patient.phone}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">Gender</label>
                  <select
                    name="gender"
                    defaultValue={patient.gender || ""}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs font-medium focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    defaultValue={
                      patient.dateOfBirth
                        ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
                        : ""
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-400">
                    Physical Address
                  </label>
                  <textarea
                    name="address"
                    rows={2}
                    defaultValue={patient.address || ""}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-zinc-900/60">
                <Button type="submit" className="font-bold">
                  Save Contact Information
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 2. Appointments Log */}
      {activeTab === "appointments" && (
        <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Appointments Booked ({patient.appointments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/50">
                    <th className="p-3">Clinic Name</th>
                    <th className="p-3">Service Name</th>
                    <th className="p-3">Scheduled Slot</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
                  {patient.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center italic text-slate-400">
                        No bookings recorded for this patient.
                      </td>
                    </tr>
                  ) : (
                    patient.appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                        <td className="p-3">
                          <span className="block font-bold text-slate-800 dark:text-slate-200">
                            {appt.pharmacy.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{appt.pharmacy.email}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-zinc-300">
                          {appt.service.name} ({appt.service.duration} mins)
                        </td>
                        <td className="p-3 font-mono text-slate-500">
                          {new Date(appt.startTime).toLocaleString()}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black ${
                              appt.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                                : appt.status === "PENDING"
                                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                                  : appt.status === "CANCELLED"
                                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20"
                                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/20"
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 3. Provider History */}
      {activeTab === "providers" && (
        <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Visited Clinics Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
              {visitedClinics.length === 0 ? (
                <div className="p-6 text-center italic text-slate-400">No clinics visited yet.</div>
              ) : (
                visitedClinics.map((clinic) => (
                  <div
                    key={clinic.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-zinc-900">
                        <Store className="h-4 w-4" />
                      </div>
                      <div>
                        <strong className="block font-bold text-slate-800 dark:text-slate-200">
                          {clinic.name}
                        </strong>
                        <span className="text-[10px] text-slate-400">{clinic.email}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs font-black text-brand-teal">
                        {clinic.count} Visits
                      </span>
                      <Link
                        href={`/admin/providers/${clinic.id}`}
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        View profile &rarr;
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4. Audit Trail */}
      {activeTab === "audit" && (
        <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Audit Logs Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center italic text-slate-400">
                  No logs logged for this patient.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-[10px] font-black uppercase text-slate-800 dark:text-slate-200">
                          {log.action}
                        </strong>
                        <span className="text-[10px] text-slate-400">entity: {log.entityName}</span>
                      </div>
                      <p className="text-slate-650 mt-1 font-mono text-[10px] dark:text-zinc-400">
                        Changes: {JSON.stringify(log.changes)}
                      </p>
                      <span className="mt-1 block text-[9px] text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-500">
                      <span>Logged by: {log.userEmail || "System"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
