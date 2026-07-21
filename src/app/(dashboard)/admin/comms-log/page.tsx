import { db } from "@/lib/db";
import { H1, P } from "@/components/ui/typography";
import { format } from "date-fns";
import { Mail, PhoneCall } from "lucide-react";

import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminCommsLogPage() {
  const session = await getRequiredSession();
  if (session.user.role === "platform_admin" && !session.user.canViewCommsLog) {
    redirect("/admin");
  }
  const logs = await db.communicationsLog.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pharmacy: true,
      customer: true,
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <H1>Global Communications Log</H1>
        <P className="mt-1">
          Review all SMS verification dispatches and transactional emails triggered by
          NextDoorClinic branches.
        </P>
      </div>

      <div className="overflow-hidden rounded border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm font-medium text-slate-500 dark:text-zinc-400">
            No communications logs found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider dark:border-zinc-900/60 dark:bg-zinc-900/40">
                  <th className="p-4">Recipient</th>
                  <th className="p-4">Channel</th>
                  <th className="p-4">Clinic Branch</th>
                  <th className="p-4">Subject / Code</th>
                  <th className="p-4">Message Preview</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/10">
                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      <div>{log.recipient}</div>
                      {log.customer && (
                        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                          Patient: {log.customer.firstName} {log.customer.lastName}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          log.type === "EMAIL"
                            ? "border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                            : "dark:text-amber-450 border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-950/20"
                        }`}
                      >
                        {log.type === "EMAIL" ? (
                          <Mail className="h-3 w-3" />
                        ) : (
                          <PhoneCall className="h-3 w-3" />
                        )}
                        <span>{log.type}</span>
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-zinc-300">
                      {log.pharmacy.name}
                    </td>
                    <td className="p-4 font-mono text-slate-500 dark:text-zinc-400">
                      {log.subject || "Verification Code"}
                    </td>
                    <td
                      className="text-slate-550 dark:text-zinc-450 max-w-[200px] truncate p-4"
                      title={log.content}
                    >
                      {log.content}
                    </td>
                    <td className="p-4">
                      <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                        {log.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-500">
                      {format(new Date(log.createdAt), "MMM d, yyyy h:mm:ss a")}
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
