import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, P } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Search, Eye, Trash2, UserX, UserCheck, CalendarRange } from "lucide-react";
import Link from "next/link";
import {
  suspendPatientAction,
  activatePatientAction,
  softDeletePatientAction,
} from "@/actions/super-admin";

export const revalidate = 0;
import { ConfirmForm } from "@/components/forms/confirm-form";

interface PageProps {
  searchParams: {
    q?: string;
    status?: string;
    page?: string;
  };
}

export default async function PatientsDirectoryPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  const query = searchParams.q || "";
  const statusFilter = searchParams.status || "";
  const page = parseInt(searchParams.page || "1") || 1;
  const limit = 10;

  // Build filter
  const whereClause: any = {
    deletedAt: null,
    AND: [],
  };

  if (query) {
    whereClause.AND.push({
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
      ],
    });
  }

  if (statusFilter) {
    whereClause.AND.push({ isActive: statusFilter === "ACTIVE" });
  }

  const totalMatches = await db.customer.count({ where: whereClause });
  const totalPages = Math.ceil(totalMatches / limit) || 1;

  const patients = await db.customer.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      appointments: {
        select: { id: true },
      },
    },
  });

  // Action Handlers
  const handleSuspend = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await suspendPatientAction(id);
  };

  const handleActivate = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await activatePatientAction(id);
  };

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await softDeletePatientAction(id);
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <H1 className="font-black text-slate-900 dark:text-slate-50">Patients Directory</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Monitor consumers, view booking logs, manage account states, and handle personal contact
          information edits.
        </P>
      </div>

      {/* Filters */}
      <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
        <CardContent className="p-4">
          <form
            method="GET"
            action="/admin/patients"
            className="flex flex-col items-center gap-4 md:flex-row"
          >
            <div className="relative w-full flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Search patients by name, email, phone..."
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              />
            </div>

            <div className="w-full md:w-48">
              <select
                name="status"
                defaultValue={statusFilter}
                className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm font-medium focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
              >
                <option value="">All Accounts</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Suspended Only</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 md:w-auto"
            >
              Search
            </button>
            <a
              href="/admin/patients"
              className="dark:text-slate-350 dark:hover:bg-zinc-850 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 md:w-auto"
            >
              Reset
            </a>
          </form>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="shadow-premium overflow-hidden border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/40">
                <th className="p-4">Patient Name</th>
                <th className="p-4">Contact info</th>
                <th className="p-4">Status</th>
                <th className="p-4">Appointments Booked</th>
                <th className="p-4">Joined Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm dark:divide-zinc-900">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((pat) => (
                  <tr
                    key={pat.id}
                    className="transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                  >
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-bold text-blue-600 dark:border-zinc-800/40 dark:bg-zinc-900/60">
                          {pat.firstName[0].toUpperCase()}
                          {pat.lastName[0].toUpperCase()}
                        </div>
                        <div>
                          <strong className="block font-bold text-slate-900 dark:text-slate-50">
                            {pat.firstName} {pat.lastName}
                          </strong>
                          <span className="text-[10px] text-slate-400">ID: {pat.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs">
                      <span className="block text-slate-800 dark:text-slate-200">{pat.email}</span>
                      <span className="block text-slate-400">{pat.phone}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                          pat.isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "text-rose-750 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/20"
                        }`}
                      >
                        {pat.isActive ? "ACTIVE" : "SUSPENDED"}
                      </span>
                    </td>
                    <td className="p-4 pl-8 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                      <div className="flex items-center space-x-1.5">
                        <CalendarRange className="h-3.5 w-3.5 text-slate-400" />
                        <span>{pat.appointments.length} Bookings</span>
                      </div>
                    </td>
                    <td className="text-slate-450 p-4 text-xs">
                      {new Date(pat.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-1.5">
                        <Link
                          href={`/admin/patients/${pat.id}`}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-zinc-800"
                          title="View Profile Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>

                        {pat.isActive ? (
                          <form action={handleSuspend}>
                            <input type="hidden" name="id" value={pat.id} />
                            <button
                              type="submit"
                              className="rounded p-1 text-amber-500 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              title="Suspend Patient"
                            >
                              <UserX className="h-4 w-4" />
                            </button>
                          </form>
                        ) : (
                          <form action={handleActivate}>
                            <input type="hidden" name="id" value={pat.id} />
                            <button
                              type="submit"
                              className="rounded p-1 text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                              title="Reactivate Patient"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          </form>
                        )}

                        <ConfirmForm
                          action={handleDelete}
                          message="Are you sure you want to soft-delete this patient account?"
                        >
                          <input type="hidden" name="id" value={pat.id} />
                          <button
                            type="submit"
                            className="rounded p-1 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
                            title="Soft Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ConfirmForm>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 p-4 dark:border-zinc-900 dark:bg-zinc-900/20">
            <span className="text-xs text-slate-500">
              Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalMatches}{" "}
              results)
            </span>
            <div className="flex items-center space-x-1">
              <a
                href={
                  page > 1
                    ? `/admin/patients?q=${query}&status=${statusFilter}&page=${page - 1}`
                    : "#"
                }
                className={`rounded border px-3 py-1 text-xs font-semibold ${
                  page > 1
                    ? "dark:text-slate-350 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                    : "dark:text-zinc-650 cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                Previous
              </a>
              <a
                href={
                  page < totalPages
                    ? `/admin/patients?q=${query}&status=${statusFilter}&page=${page + 1}`
                    : "#"
                }
                className={`rounded border px-3 py-1 text-xs font-semibold ${
                  page < totalPages
                    ? "dark:text-slate-350 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900"
                    : "dark:text-zinc-650 cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-zinc-800 dark:bg-zinc-900"
                }`}
              >
                Next
              </a>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
