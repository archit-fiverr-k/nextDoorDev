import { db } from "@/lib/db";
import { H1, P } from "@/components/ui/typography";
import { format } from "date-fns";
import { RegisterPlatformAdminForm } from "./register-form";
import { PlatformAdminActions } from "./platform-admin-actions";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminPlatformAdminsPage() {
  const session = await getRequiredSession();

  // Security guard: Only Super Admin can view/register Platform Admins
  if (session.user.role !== "super_admin") {
    redirect("/admin");
  }

  const platformAdmins = await db.platformAdmin.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Page Header */}
      <div className="dark:border-zinc-850 flex select-none flex-col gap-4 border-b border-slate-200/80 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <H1>Platform Administrators</H1>
          <P className="mt-1">
            Register and configure granular capabilities for platform operational administrator and
            developer accounts.
          </P>
        </div>

        <RegisterPlatformAdminForm />
      </div>

      {/* Flat Directory List */}
      <div className="overflow-hidden rounded border border-slate-200/80 bg-white dark:border-zinc-900 dark:bg-zinc-950">
        {platformAdmins.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
            No platform administrators registered yet.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider dark:border-zinc-900/60 dark:bg-zinc-900">
                  <th className="p-4">Name</th>
                  <th className="p-4">Account Role</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Capabilities / Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">First Login Checked</th>
                  <th className="p-4">Created At</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900/60">
                {platformAdmins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="transition-colors hover:bg-slate-50/40 dark:hover:bg-zinc-900/10"
                  >
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      {admin.name || "N/A"}
                    </td>
                    <td className="p-4 font-semibold text-slate-600 dark:text-zinc-300">
                      {admin.isDeveloper ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-700 dark:bg-zinc-900 dark:text-zinc-400">
                          Developer
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-700 dark:bg-zinc-900 dark:text-zinc-400">
                          Platform Admin
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-zinc-300">
                      {admin.email}
                    </td>
                    <td className="p-4">
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {admin.canManagePharmacies && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Clinics
                          </span>
                        )}
                        {admin.canManageBookings && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Bookings
                          </span>
                        )}
                        {admin.canViewAuditLogs && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Audit Logs
                          </span>
                        )}
                        {admin.canViewCommsLog && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Comms Logs
                          </span>
                        )}
                        {admin.canManageIntegrations && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Integrations
                          </span>
                        )}
                        {admin.canManageSettings && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Settings
                          </span>
                        )}
                        {admin.canManageAdmins && (
                          <span className="rounded border border-slate-200/65 bg-slate-50 px-1.5 py-0.5 text-[9px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                            Admins/Devs
                          </span>
                        )}
                        {!admin.canManagePharmacies &&
                          !admin.canManageBookings &&
                          !admin.canViewAuditLogs &&
                          !admin.canViewCommsLog &&
                          !admin.canManageIntegrations &&
                          !admin.canManageSettings &&
                          !admin.canManageAdmins && (
                            <span className="text-[10px] font-medium italic text-slate-400">
                              None
                            </span>
                          )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          admin.isActive
                            ? "border-slate-200 bg-slate-50 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400"
                            : "dark:text-rose-450 border-slate-200 bg-slate-50 text-rose-500 dark:border-zinc-800 dark:bg-zinc-900"
                        }`}
                      >
                        {admin.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-slate-550 p-4 font-medium dark:text-zinc-400">
                      {admin.isFirstLogin ? (
                        <span className="font-bold text-amber-600">Pending Change</span>
                      ) : (
                        <span className="font-bold text-emerald-600">Completed</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-500">
                      {format(new Date(admin.createdAt), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="p-4 text-right">
                      <PlatformAdminActions admin={admin} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
