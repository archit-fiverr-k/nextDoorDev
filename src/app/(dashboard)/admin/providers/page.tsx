import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, P } from "@/components/ui/typography";
import { Search, ArrowUpDown, Trash2, Check, AlertOctagon, Edit2 } from "lucide-react";
import Link from "next/link";
import {
  approveProviderAction,
  suspendProviderAction,
  activateProviderAction,
  softDeleteProviderAction,
} from "@/actions/super-admin";
import { ConfirmForm } from "@/components/forms/confirm-form";

export const revalidate = 0;

interface PageProps {
  searchParams: {
    q?: string;
    status?: string;
    sort?: string;
    order?: string;
  };
}

export default async function ProvidersDirectoryPage({ searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  // Parse filters
  const query = searchParams.q || "";
  const statusFilter = searchParams.status || "";
  const sort = searchParams.sort || "name";
  const order = searchParams.order || "asc";

  // Build prisma query
  const where: any = {
    deletedAt: null,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { slug: { contains: query, mode: "insensitive" } },
    ];
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  // Fetch providers
  const providers = await db.pharmacy.findMany({
    where,
    include: {
      providerCategory: true,
      subscription: true,
    },
    orderBy: {
      [sort]: order,
    },
  });

  // Inline Server Actions
  const handleApprove = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await approveProviderAction(id);
  };

  const handleSuspend = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await suspendProviderAction(id);
  };

  const handleActivate = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await activateProviderAction(id);
  };

  const handleDelete = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await softDeleteProviderAction(id);
  };

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Page Header */}
      <div className="dark:border-zinc-850 border-b border-slate-200/80 pb-6">
        <H1 className="font-black text-slate-900 dark:text-slate-50">Marketplace Providers</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Review credentials, subscriptions, status, and perform workspace administration.
        </P>
      </div>

      {/* Search and Filters Flat Bar */}
      <div className="dark:border-zinc-850 rounded border border-slate-200/80 bg-white p-4 dark:bg-zinc-950">
        <form
          method="GET"
          action="/admin/providers"
          className="flex flex-col items-center gap-4 md:flex-row"
        >
          {/* Search Input */}
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search providers by name, email, phone..."
              className="w-full rounded border border-slate-200 bg-white p-2 pl-10 text-sm focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-48">
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded border border-slate-200 bg-white p-2 text-sm font-medium focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="order" value={order} />

          <button
            type="submit"
            className="inline-flex h-9 w-full items-center justify-center rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 md:w-auto"
          >
            Filter Directory
          </button>
          <a
            href="/admin/providers"
            className="dark:hover:bg-zinc-850 flex h-9 w-full items-center justify-center rounded border border-slate-200 bg-white px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-300 md:w-auto"
          >
            Reset
          </a>
        </form>
      </div>

      {/* Flat Directory Table */}
      <div className="space-y-4">
        <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
          Providers Registry
        </h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/40">
                <th className="select-none p-4">
                  <div className="flex items-center space-x-1">
                    <span>Provider Name</span>
                    <a
                      href={`/admin/providers?q=${query}&status=${statusFilter}&sort=name&order=${sort === "name" && order === "asc" ? "desc" : "asc"}`}
                    >
                      <ArrowUpDown className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-900" />
                    </a>
                  </div>
                </th>
                <th className="p-4">Provider Type</th>
                <th className="p-4">Contact Information</th>
                <th className="p-4">Status</th>
                <th className="p-4">SaaS Plan</th>
                <th className="p-4">
                  <div className="flex items-center space-x-1">
                    <span>Created Date</span>
                    <a
                      href={`/admin/providers?q=${query}&status=${statusFilter}&sort=createdAt&order=${sort === "createdAt" && order === "asc" ? "desc" : "asc"}`}
                    >
                      <ArrowUpDown className="h-3 w-3 cursor-pointer text-slate-400 hover:text-slate-900" />
                    </a>
                  </div>
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
              {providers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-400">
                    No providers found matching filters.
                  </td>
                </tr>
              ) : (
                providers.map((p) => {
                  return (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 text-sm font-bold text-slate-700 dark:border-zinc-800 dark:bg-zinc-900/50">
                            {p.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">
                              {p.name}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              slug: {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-400">
                          {p.providerCategory?.name || "General Clinic"}
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="block font-semibold text-slate-800 dark:text-slate-200">
                          {p.email}
                        </span>
                        <span className="block text-slate-400">{p.phone}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded px-2.5 py-0.5 text-[10px] font-black ${
                            p.status === "APPROVED"
                              ? "border border-slate-100 bg-slate-50 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400"
                              : p.status === "PENDING"
                                ? "border border-slate-100 bg-slate-50 text-amber-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-amber-400"
                                : "dark:text-rose-450 border border-slate-100 bg-slate-50 text-rose-500 dark:border-zinc-800 dark:bg-zinc-900"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="dark:text-zinc-350 p-4 font-mono font-bold text-slate-700">
                        {p.subscription?.plan || "NO PLAN"}
                      </td>
                      <td className="p-4 font-mono text-slate-500">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Edit Details */}
                          <Link
                            href={`/admin/pharmacies/${p.id}/edit`}
                            className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-50 dark:hover:bg-zinc-900"
                            title="Edit Details"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Link>

                          {/* Approve Action */}
                          {p.status === "PENDING" && (
                            <form action={handleApprove}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className="rounded p-1 text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                title="Approve Provider"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </form>
                          )}

                          {/* Suspend Action */}
                          {p.status === "APPROVED" && (
                            <form action={handleSuspend}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className="rounded p-1 text-amber-500 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20"
                                title="Suspend Provider"
                              >
                                <AlertOctagon className="h-4 w-4" />
                              </button>
                            </form>
                          )}

                          {/* Reactivate Action */}
                          {p.status === "SUSPENDED" && (
                            <form action={handleActivate}>
                              <input type="hidden" name="id" value={p.id} />
                              <button
                                type="submit"
                                className="rounded p-1 text-emerald-500 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                title="Activate Provider"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            </form>
                          )}

                          {/* Delete (Soft Delete) */}
                          <ConfirmForm
                            action={handleDelete}
                            message="Are you sure you want to soft-delete this provider workspace?"
                          >
                            <input type="hidden" name="id" value={p.id} />
                            <button
                              type="submit"
                              className="rounded p-1 text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/20"
                              title="Soft Delete Provider"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </ConfirmForm>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
