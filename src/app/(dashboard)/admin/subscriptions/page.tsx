import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, H2, P } from "@/components/ui/typography";
import { Bell, CreditCard, Store } from "lucide-react";
import { format, subDays } from "date-fns";
import {
  renewSubscriptionAction,
  cancelSubscriptionAction,
  changeSubscriptionPlanAction,
  updateGracePeriodAction,
  suspendProviderAction,
} from "@/actions/super-admin";

export const revalidate = 0;
import { ConfirmForm } from "@/components/forms/confirm-form";
import { SubscriptionReminderTable } from "./reminder-table";

export default async function SubscriptionsManagementPage() {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin") {
    redirect("/");
  }

  // Fetch subscriptions
  const subscriptions = await db.subscription.findMany({
    include: {
      pharmacy: { select: { name: true, email: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Query unsubscribed clinics
  const allPharmacies = await db.pharmacy.findMany({
    where: { deletedAt: null },
    include: { subscription: true },
  });

  const unsubscribedPharmacies = allPharmacies
    .filter((p) => {
      if (!p.subscription) return true;
      const sub = p.subscription;
      return sub.status !== "ACTIVE" && sub.status !== "TRIAL" && sub.status !== "GRACE_PERIOD";
    })
    .map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      subStatus: p.subscription ? p.subscription.status : "NONE",
    }));

  // Calculate SaaS metrics
  const totalSubs = subscriptions.length;
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const expiredSubs = subscriptions.filter((s) => s.status === "EXPIRED").length;
  const cancelledSubs = subscriptions.filter((s) => s.status === "CANCELLED").length;
  const graceSubs = subscriptions.filter((s) => s.status === "GRACE_PERIOD").length;
  const failedSubs = subscriptions.filter((s) => s.status === "FAILED_PAYMENT").length;

  // Fetch subscription history logs
  const histories = await db.subscriptionHistory.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
    include: {
      pharmacy: { select: { name: true } },
    },
  });

  // Server Action inline handlers
  const handleRenew = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await renewSubscriptionAction(id);
  };

  const handleCancel = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    await cancelSubscriptionAction(id);
  };

  const handlePlanChange = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    const plan = formData.get("plan") as "MONTHLY" | "YEARLY" | "TRIAL";
    await changeSubscriptionPlanAction(id, plan);
  };

  const handleGrace = async (formData: FormData) => {
    "use server";
    const id = formData.get("id") as string;
    const days = parseInt(formData.get("days") as string) || 7;
    await updateGracePeriodAction(id, days);
  };

  const handleSuspendProvider = async (formData: FormData) => {
    "use server";
    const pharmacyId = formData.get("pharmacyId") as string;
    await suspendProviderAction(pharmacyId);
  };

  return (
    <div className="space-y-10 bg-white pb-12 font-sans text-slate-900 dark:bg-zinc-950 dark:text-slate-100">
      {/* Page Header */}
      <div className="dark:border-zinc-850 border-b border-slate-200/80 pb-6">
        <H1 className="font-black text-slate-900 dark:text-slate-50">SaaS Subscriptions</H1>
        <P className="mt-1 text-slate-500 dark:text-zinc-400">
          Configure subscription plans, track billing events, manage unpaid grace periods, and
          handle upgrades/downgrades.
        </P>
      </div>

      {/* Subscription KPI Flat Row */}
      <div className="dark:border-zinc-850 grid select-none grid-cols-2 gap-6 border-b border-slate-200/80 pb-10 md:grid-cols-6">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Tenants
          </span>
          <div className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{totalSubs}</div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Active Plans
          </span>
          <div className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {activeSubs}
          </div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Grace Period
          </span>
          <div className="mt-1 text-2xl font-black text-amber-500">{graceSubs}</div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-500">
            Failed Invoices
          </span>
          <div className="dark:text-rose-450 mt-1 text-2xl font-black text-rose-600">
            {failedSubs}
          </div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Cancelled
          </span>
          <div className="mt-1 text-2xl font-black text-slate-600">{cancelledSubs}</div>
        </div>
        <div className="dark:border-zinc-850 border-l border-slate-200/80 pl-6">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Expired
          </span>
          <div className="mt-1 text-2xl font-black text-slate-600">{expiredSubs}</div>
        </div>
      </div>

      {/* Subscription List Section */}
      <div className="space-y-4">
        <h2 className="border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
          Tenant Directories
        </h2>
        <div className="w-full overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/40">
                <th className="p-4">Provider Workspace</th>
                <th className="p-4">Current Plan</th>
                <th className="p-4">Billing Status</th>
                <th className="p-4">Renews On</th>
                <th className="p-4">Failed Attempts</th>
                <th className="p-4 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No active subscriptions.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isSuspended = sub.pharmacy.status === "SUSPENDED";
                  return (
                    <tr
                      key={sub.id}
                      className="transition-colors hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                    >
                      <td className="p-4">
                        <strong className="block font-bold text-slate-800 dark:text-slate-200">
                          {sub.pharmacy.name}
                        </strong>
                        <span className="text-[10px] text-slate-400">{sub.pharmacy.email}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-slate-850 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase dark:bg-zinc-900 dark:text-slate-100">
                          {sub.plan} Plan
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-black ${
                            sub.status === "ACTIVE"
                              ? "border border-slate-100 bg-slate-50 text-emerald-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-emerald-400"
                              : sub.status === "GRACE_PERIOD"
                                ? "border border-slate-100 bg-slate-50 text-amber-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-amber-400"
                                : "border border-slate-100 bg-slate-50 text-rose-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-rose-400"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="text-slate-650 p-4 font-mono text-[11px] dark:text-zinc-400">
                        {new Date(sub.endDate).toLocaleDateString()}
                      </td>
                      <td className="text-slate-650 p-4 pr-12 text-center font-bold dark:text-zinc-400">
                        {sub.failedPaymentsCount}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Renew */}
                          <form action={handleRenew}>
                            <input type="hidden" name="id" value={sub.id} />
                            <button
                              type="submit"
                              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-700 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                              Renew (30d)
                            </button>
                          </form>

                          {/* Upgrade / Downgrade toggle */}
                          <form action={handlePlanChange} className="flex items-center space-x-1">
                            <input type="hidden" name="id" value={sub.id} />
                            <select
                              name="plan"
                              className="dark:border-zinc-850 dark:text-slate-350 rounded border border-slate-200 bg-white p-0.5 text-[10px] font-bold text-slate-700 dark:bg-zinc-900"
                              defaultValue={sub.plan}
                            >
                              <option value="TRIAL">Trial</option>
                              <option value="MONTHLY">Monthly</option>
                              <option value="YEARLY">Yearly</option>
                            </select>
                            <button
                              type="submit"
                              className="dark:border-zinc-850 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-black text-slate-700 transition-colors hover:bg-slate-100 dark:bg-zinc-900 dark:text-zinc-400"
                              title="Update Plan"
                            >
                              Save
                            </button>
                          </form>

                          {/* Grace period trigger */}
                          {sub.status !== "GRACE_PERIOD" && (
                            <form action={handleGrace}>
                              <input type="hidden" name="id" value={sub.id} />
                              <input type="hidden" name="days" value="7" />
                              <button
                                type="submit"
                                className="dark:border-zinc-850 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-amber-600 transition-colors hover:bg-slate-100 dark:bg-zinc-900 dark:text-amber-400"
                              >
                                Grace (7d)
                              </button>
                            </form>
                          )}

                          {/* Cancel Plan */}
                          {sub.status === "ACTIVE" && (
                            <ConfirmForm
                              action={handleCancel}
                              message="Are you sure you want to cancel this tenant subscription plan?"
                            >
                              <input type="hidden" name="id" value={sub.id} />
                              <button
                                type="submit"
                                className="dark:border-zinc-850 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-900 dark:hover:bg-rose-950/20"
                              >
                                Cancel Plan
                              </button>
                            </ConfirmForm>
                          )}

                          {/* Suspend Workspace */}
                          {!isSuspended ? (
                            <ConfirmForm
                              action={handleSuspendProvider}
                              message="Are you sure you want to suspend this clinic workspace? Patients won't be able to book appointments."
                            >
                              <input type="hidden" name="pharmacyId" value={sub.pharmacyId} />
                              <button
                                type="submit"
                                className="dark:border-zinc-850 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-black text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:bg-zinc-900 dark:hover:bg-rose-950/20"
                              >
                                Suspend Clinic
                              </button>
                            </ConfirmForm>
                          ) : (
                            <span className="rounded border border-rose-100 bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600 dark:border-rose-900/30 dark:bg-rose-950/30">
                              SUSPENDED
                            </span>
                          )}
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

      {/* Pharmacies Without Active Subscription Reminder Board */}
      <div className="dark:border-zinc-850 space-y-4 border-t border-slate-200/80 pt-8">
        <H2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Unsubscribed Clinics & Payment Reminders
        </H2>
        <SubscriptionReminderTable pharmacies={unsubscribedPharmacies} />
      </div>

      {/* Subscription Histories & Logs */}
      <div className="dark:border-zinc-850 grid gap-12 border-t border-slate-200/80 pt-8 md:grid-cols-2">
        <div className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            Billing History Logs
          </h2>
          <div className="divide-y divide-slate-100 dark:divide-zinc-900">
            {histories.length === 0 ? (
              <div className="py-6 text-center text-xs italic text-slate-400">
                No logs recorded.
              </div>
            ) : (
              histories.map((hist) => (
                <div key={hist.id} className="py-3 text-xs">
                  <div className="mb-1 flex items-center justify-between text-[9px] font-black uppercase text-brand-teal">
                    <span>
                      {hist.pharmacy.name} &bull; {hist.action}
                    </span>
                    <span className="font-mono font-normal text-slate-400">
                      {new Date(hist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="leading-normal text-slate-600 dark:text-zinc-400">{hist.details}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Failed Payment Monitoring & Webhooks Alert */}
        <div className="space-y-4">
          <h2 className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-zinc-900">
            <span>Stripe Webhook Gateway Status</span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-teal" />
          </h2>
          <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-zinc-400">
            <div className="dark:border-zinc-850 rounded border border-slate-200 bg-slate-50 p-3 dark:bg-zinc-900/50">
              <strong className="mb-1 block text-slate-800 dark:text-slate-200">
                Webhook Endpoint Active
              </strong>
              <span>
                Listening on:{" "}
                <code className="border-slate-150 rounded border bg-white px-1 py-0.5 font-mono dark:border-zinc-800 dark:bg-zinc-900">
                  /api/webhooks/stripe
                </code>
              </span>
            </div>
            <p>
              The SaaS billing system is configured to receive and digest the following Stripe
              Events:
            </p>
            <ul className="list-disc space-y-1.5 pl-4 font-mono text-[10px] text-slate-400">
              <li>
                <code>customer.subscription.created</code> &rarr; Initializes trial
              </li>
              <li>
                <code>invoice.payment_succeeded</code> &rarr; Extends plan duration (+30d / +365d)
              </li>
              <li>
                <code>invoice.payment_failed</code> &rarr; Increments failure counter, maps to
                GRACE_PERIOD
              </li>
              <li>
                <code>customer.subscription.deleted</code> &rarr; Marks subscription as EXPIRED
              </li>
            </ul>
            <div className="border-t border-slate-100 pt-2 dark:border-zinc-900">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Provider Notifications Dispatcher
              </span>
              <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                <Bell className="h-3.5 w-3.5 text-blue-500" />
                <span>
                  Renewal notification emails automatically send 7 days before period end.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
