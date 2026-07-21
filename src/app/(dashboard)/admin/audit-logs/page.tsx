import { db } from "@/lib/db";
import { H1, P } from "@/components/ui/typography";
import { AuditLogsView } from "./audit-logs-view";

import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function AdminAuditLogsPage() {
  const session = await getRequiredSession();
  if (session.user.role === "platform_admin" && !session.user.canViewAuditLogs) {
    redirect("/admin");
  }
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div>
        <H1>Security Audit Logs</H1>
        <P className="mt-1">
          Review system actions, status updates, user session logins, and configuration changes
          performed across the NextDoorClinic portal.
        </P>
      </div>

      <AuditLogsView logs={logs} />
    </div>
  );
}
