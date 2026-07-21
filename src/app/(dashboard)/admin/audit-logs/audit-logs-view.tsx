"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Search, FileJson, ZoomIn } from "lucide-react";
import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entityName: string;
  entityId: string;
  changes: any;
  createdAt: Date;
}

interface AuditLogsViewProps {
  logs: AuditLogItem[];
}

export function AuditLogsView({ logs }: AuditLogsViewProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  // Selected log for detailed metadata viewing
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  // Extract unique action & entity names for dynamic filter options
  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));
  const uniqueEntities = Array.from(new Set(logs.map((l) => l.entityName)));

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.userId || "").toLowerCase().includes(search.toLowerCase()) ||
      log.entityName.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity = entityFilter === "all" || log.entityName === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col items-center justify-between gap-4 rounded border border-slate-200/80 bg-white p-4 dark:border-zinc-800/80 dark:bg-zinc-950 sm:flex-row">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100 dark:focus:bg-zinc-950"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex w-full gap-2 sm:w-auto">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="flex-1 rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 sm:flex-none"
          >
            <option value="all">All Actions</option>
            {uniqueActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>

          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="flex-1 rounded border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100 sm:flex-none"
          >
            <option value="all">All Entities</option>
            {uniqueEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded border border-slate-200/80 bg-white dark:border-zinc-800/80 dark:bg-zinc-950">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-450 p-12 text-center text-sm italic">
            No audit logs found matching the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="text-slate-450 border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider dark:border-zinc-900/60 dark:bg-zinc-900/40">
                  <th className="p-4">User / Operator</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Entity type</th>
                  <th className="p-4">Entity ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-900/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/40 dark:hover:bg-zinc-900/10">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {log.userEmail || "System/Anonymous"}
                      </div>
                      {log.userId && (
                        <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                          {log.userId}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                          log.action === "CREATE"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-500"
                            : log.action === "DELETE"
                              ? "border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-500"
                              : log.action === "LOGIN" || log.action === "LOGOUT"
                                ? "border-amber-250 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-500"
                                : "border-blue-250 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-500"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-zinc-300">
                      {log.entityName}
                    </td>
                    <td
                      className="max-w-[120px] truncate p-4 font-mono text-[10px] text-slate-500"
                      title={log.entityId}
                    >
                      {log.entityId}
                    </td>
                    <td className="p-4 font-medium text-slate-500">
                      {format(new Date(log.createdAt), "MMM d, yyyy h:mm:ss a")}
                    </td>
                    <td className="p-4 text-right">
                      {log.changes ? (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex cursor-pointer items-center space-x-1.5 font-bold text-blue-600 hover:text-blue-700"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                          <span>Inspect</span>
                        </button>
                      ) : (
                        <span className="font-normal italic text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Metadata Dialog */}
      {selectedLog && (
        <Dialog isOpen={!!selectedLog} onClose={() => setSelectedLog(null)}>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-slate-900 dark:text-slate-100">
              <FileJson className="h-5 w-5 text-blue-600 dark:text-blue-500" />
              <span>Audit Log Metadata Details</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            {/* Event Context Header */}
            <div className="border-slate-150 grid grid-cols-2 gap-4 rounded-xl border bg-slate-50 p-4 text-xs dark:border-zinc-900 dark:bg-zinc-900/30">
              <div>
                <span className="mb-0.5 block font-semibold text-slate-400">Operator Email</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedLog.userEmail || "System"}
                </span>
              </div>
              <div>
                <span className="mb-0.5 block font-semibold text-slate-400">Action Entity</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {selectedLog.entityName}
                </span>
              </div>
              <div>
                <span className="text-slate-450 mb-0.5 block font-semibold">Operation Type</span>
                <span className="font-bold uppercase text-slate-900 dark:text-slate-100">
                  {selectedLog.action}
                </span>
              </div>
              <div>
                <span className="text-slate-450 mb-0.5 block font-semibold">Timestamp</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {format(new Date(selectedLog.createdAt), "yyyy-MM-dd HH:mm:ss")}
                </span>
              </div>
            </div>

            {/* JSON tree details */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700 dark:text-zinc-300">
                Metadata Changes Map (`changes`)
              </label>
              <div className="max-h-[300px] overflow-x-auto rounded-xl border border-zinc-900 bg-slate-950 p-4">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-emerald-400">
                  {JSON.stringify(selectedLog.changes, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
