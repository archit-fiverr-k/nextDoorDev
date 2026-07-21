import { db } from "@/lib/db";
import { getRequiredSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { H1, H2, P } from "@/components/ui/typography";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  CreditCard,
  CalendarRange,
  History,
  FileText,
  CheckCircle,
  Users,
  Palette,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import {
  approveProviderAction,
  suspendProviderAction,
  activateProviderAction,
  updateProviderBrandingAction,
} from "@/actions/super-admin";
import { WebsiteIntegrationPanel } from "./website-integration-panel";

export const revalidate = 0;

interface PageProps {
  params: { id: string };
  searchParams: { tab?: string };
}

export default async function ProviderDetailsPage({ params, searchParams }: PageProps) {
  const session = await getRequiredSession();
  if (session.user.role !== "super_admin" && session.user.role !== "platform_admin") {
    redirect("/");
  }
  if (session.user.role === "platform_admin" && !session.user.canManagePharmacies) {
    redirect("/admin");
  }

  const { id } = params;
  const activeTab = searchParams.tab || "overview";

  // Fetch full details
  const provider = await db.pharmacy.findUnique({
    where: { id },
    include: {
      services: true,
      subscription: true,
      subscriptionHistory: { orderBy: { createdAt: "desc" } },
      staff: true,
      appointments: {
        orderBy: { startTime: "desc" },
        take: 10,
        include: {
          customer: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { name: true } },
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 15,
      },
      providerCategory: true,
      healthcareCategory: true,
    },
  });

  if (!provider || provider.deletedAt) {
    return (
      <div className="p-8 text-center">
        <H2 className="text-red-500">Provider Not Found</H2>
        <P className="mt-2">This provider does not exist or has been soft-deleted.</P>
        <Link
          href="/admin/providers"
          className="mt-4 inline-block font-bold text-blue-600 hover:underline"
        >
          &larr; Back to Directory
        </Link>
      </div>
    );
  }

  // Calculate patient count
  const patientCountResult = await db.appointment.groupBy({
    by: ["customerId"],
    where: { pharmacyId: id },
  });
  const patientCount = patientCountResult.length;

  // Load active service categories and map service counts
  const activeCategories = await db.category.findMany({
    where: {
      status: "ACTIVE",
      deleted: false,
      type: "SERVICE",
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  const categoriesWithServiceCount = activeCategories.map((cat) => {
    const count = provider.services.filter((s) => s.categoryId === cat.id && s.isActive).length;
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      status: cat.status,
      updatedAt: cat.updatedAt,
      servicesCount: count,
    };
  });

  // Server Action inline forms
  const handleApprove = async (formData: FormData) => {
    "use server";
    await approveProviderAction(id);
  };

  const handleSuspend = async (formData: FormData) => {
    "use server";
    await suspendProviderAction(id);
  };

  const handleActivate = async (formData: FormData) => {
    "use server";
    await activateProviderAction(id);
  };

  const handleUpdateBranding = async (formData: FormData) => {
    "use server";
    const displayName = formData.get("displayName") as string;
    const brandColor = formData.get("brandColor") as string;
    await updateProviderBrandingAction(id, displayName, brandColor);
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header & Back Button */}
      <div className="flex items-center space-x-3">
        <Link
          href="/admin/providers"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <div className="flex items-center space-x-2">
            <H1 className="font-black text-slate-900 dark:text-slate-50">{provider.name}</H1>
            <span
              className={`select-none rounded-full px-2 py-0.5 text-[10px] font-black ${
                provider.status === "APPROVED"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : provider.status === "PENDING"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                    : "dark:text-rose-450 bg-rose-50 text-rose-700 dark:bg-rose-950/20"
              }`}
            >
              {provider.status}
            </span>
          </div>
          <P className="mt-0.5 text-xs text-slate-400">
            ID: {provider.id} | Slug: {provider.slug}
          </P>
        </div>
      </div>

      {/* Control Actions Row */}
      <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center space-x-4">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Impersonate
              </span>
              <span className="text-xs text-slate-500">Log in securely as this provider</span>
            </div>
            {/* impersonation banner will load if we start impersonation, but the default page.tsx in admin allows impersonation */}
            <Link
              href={`/admin/pharmacies?tab=directories`}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              Go to Impersonation Panel
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            {provider.status === "PENDING" && (
              <form action={handleApprove}>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-9 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                >
                  Verify & Approve Workspace
                </Button>
              </form>
            )}
            {provider.status === "APPROVED" && (
              <form action={handleSuspend}>
                <Button
                  type="submit"
                  variant="primary"
                  className="bg-rose-650 hover:bg-rose-750 h-9 font-bold text-white"
                >
                  Suspend Workspace
                </Button>
              </form>
            )}
            {provider.status === "SUSPENDED" && (
              <form action={handleActivate}>
                <Button
                  type="submit"
                  variant="primary"
                  className="h-9 bg-emerald-600 font-bold text-white hover:bg-emerald-700"
                >
                  Reactivate Workspace
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex w-full select-none items-center space-x-1 overflow-x-auto border-b border-slate-100 pb-2 dark:border-zinc-900">
        {[
          { id: "overview", label: "Business Profile" },
          { id: "services", label: "Services & Staff" },
          { id: "integration", label: "Website Integration" },
          { id: "bookings", label: "Bookings Summary" },
          { id: "subscription", label: "Subscription" },
          { id: "documents", label: "Verification Docs" },
          { id: "audit", label: "Audit Log Trail" },
        ].map((t) => {
          const isActive = activeTab === t.id;
          return (
            <Link
              key={t.id}
              href={`/admin/providers/${id}?tab=${t.id}`}
              className={`shrink-0 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
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

      {/* Tab Content Panels */}

      {/* 1. Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Info */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Business Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-semibold text-slate-400">Legal Name</span>
                  <span className="mt-1 block font-bold text-slate-800 dark:text-slate-200">
                    {provider.name}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400">
                    URL Subdomain Slug
                  </span>
                  <span className="mt-1 block font-mono text-slate-800 dark:text-slate-200">
                    {provider.slug}.nextdoorclinic.com
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400">
                    Registered Email
                  </span>
                  <span className="mt-1 block text-slate-800 dark:text-slate-200">
                    {provider.email}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-semibold text-slate-400">Contact Phone</span>
                  <span className="mt-1 block text-slate-800 dark:text-slate-200">
                    {provider.phone}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-xs font-semibold text-slate-400">
                    Physical Location Address
                  </span>
                  <span className="mt-1 block text-slate-800 dark:text-slate-200">
                    {provider.address}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-50 pt-4 dark:border-zinc-900/60">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Description / About
                </span>
                <p className="text-slate-650 text-xs leading-relaxed dark:text-zinc-400">
                  {provider.description || "No company description supplied yet."}
                </p>
              </div>

              <div className="border-t border-slate-50 pt-4 dark:border-zinc-900/60">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Welcome Message
                </span>
                <p className="text-slate-650 text-xs italic dark:text-zinc-400">
                  &ldquo;
                  {provider.welcomeMessage || "Welcome to our clinic workspace booking portal."}
                  &rdquo;
                </p>
              </div>

              {/* Gallery Images mock */}
              <div className="border-t border-slate-50 pt-4 dark:border-zinc-900/60">
                <span className="mb-3 block text-xs font-semibold text-slate-400">
                  Workspace Gallery Photos
                </span>
                {provider.gallery.length === 0 ? (
                  <span className="text-xs italic text-slate-400">
                    No workspace pictures uploaded.
                  </span>
                ) : (
                  <div className="flex gap-3 overflow-x-auto py-1">
                    {provider.gallery.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt="Gallery"
                        className="h-20 w-32 shrink-0 rounded-lg border border-slate-100 object-cover dark:border-zinc-800"
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Socials, Branding, Categories */}
          <div className="space-y-6">
            {/* Branding Config form */}
            <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Custom Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={handleUpdateBranding} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      defaultValue={provider.displayName || provider.name}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-400">
                      Accent Brand Color (Hex)
                    </label>
                    <div className="flex items-center space-x-2">
                      <div
                        className="h-6 w-6 rounded border"
                        style={{ backgroundColor: provider.brandColor || "#3b82f6" }}
                      />
                      <input
                        type="text"
                        name="brandColor"
                        defaultValue={provider.brandColor || "#3b82f6"}
                        className="flex-1 rounded-lg border border-slate-200 bg-white p-2 font-mono text-xs focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <Button type="submit" size="sm" className="h-8 w-full text-xs font-bold">
                    Save Branding
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Social Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {[
                  { label: "Website", val: provider.website, icon: Globe },
                  { label: "Google Maps", val: provider.googleMapsUrl, icon: MapPin },
                  { label: "Facebook", val: provider.facebookUrl, icon: ExternalLink },
                  { label: "Twitter", val: provider.twitterUrl, icon: ExternalLink },
                  { label: "Instagram", val: provider.instagramUrl, icon: ExternalLink },
                  { label: "LinkedIn", val: provider.linkedinUrl, icon: ExternalLink },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b border-slate-50 py-1.5 last:border-b-0 dark:border-zinc-900"
                    >
                      <span className="flex items-center space-x-1.5 text-slate-500">
                        <Icon className="h-3.5 w-3.5" />
                        <span>{item.label}</span>
                      </span>
                      {item.val ? (
                        <a
                          href={item.val}
                          target="_blank"
                          rel="noreferrer"
                          className="max-w-[150px] truncate text-blue-500 hover:underline"
                        >
                          {item.val}
                        </a>
                      ) : (
                        <span className="italic text-slate-400">Not set</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. Services & Staff */}
      {activeTab === "services" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Services List */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Services Offered ({provider.services.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-slate-100 dark:divide-zinc-900">
                {provider.services.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No services created by this provider.
                  </div>
                ) : (
                  provider.services.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/30"
                    >
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          {s.name}
                        </span>
                        <span className="text-slate-450 block text-[10px]">
                          {s.description || "No description"}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          Duration: {s.duration} mins | Category: {s.category || "General"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                          ${Number(s.price).toFixed(2)}
                        </span>
                        <span
                          className={`text-[9px] font-bold ${s.isActive ? "text-emerald-500" : "text-slate-400"}`}
                        >
                          {s.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Staff Members */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Staff Registrations ({provider.staff.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-slate-100 dark:divide-zinc-900">
                {provider.staff.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No staff accounts registered.
                  </div>
                ) : (
                  provider.staff.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-4">
                      <div>
                        <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                          {st.name}
                        </span>
                        <span className="block text-[10px] text-slate-400">{st.email}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] font-black uppercase text-brand-teal">
                          {st.role}
                        </span>
                        <span
                          className={`text-[9px] font-bold ${st.isActive ? "text-emerald-500" : "text-slate-400"}`}
                        >
                          {st.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2.5 Website Integration */}
      {activeTab === "integration" && (
        <WebsiteIntegrationPanel
          pharmacySlug={provider.slug}
          pharmacyName={provider.displayName || provider.name}
          categories={categoriesWithServiceCount}
        />
      )}

      {/* 3. Bookings Summary */}
      {activeTab === "bookings" && (
        <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Recent Appointments Summary
              </CardTitle>
              <div className="flex space-x-6 text-xs">
                <div>
                  <span className="mr-1.5 font-semibold text-slate-400">Total Patient Count:</span>
                  <strong className="text-slate-900 dark:text-white">{patientCount}</strong>
                </div>
                <div>
                  <span className="mr-1.5 font-semibold text-slate-400">Total Bookings:</span>
                  <strong className="text-slate-900 dark:text-white">
                    {provider.appointments.length}
                  </strong>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50 text-[10px] font-bold uppercase text-slate-400 dark:border-zinc-900 dark:bg-zinc-900/50">
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Service Name</th>
                    <th className="p-3">Time & Date Slot</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
                  {provider.appointments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center italic text-slate-400">
                        No bookings recorded for this provider.
                      </td>
                    </tr>
                  ) : (
                    provider.appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/10">
                        <td className="p-3">
                          <span className="block font-bold text-slate-800 dark:text-slate-200">
                            {appt.customer.firstName} {appt.customer.lastName}
                          </span>
                          <span className="text-[10px] text-slate-400">{appt.customer.email}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700 dark:text-zinc-300">
                          {appt.service.name}
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(appt.startTime).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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

      {/* 4. Subscription */}
      {activeTab === "subscription" && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Active subscription card */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {provider.subscription ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Current Plan
                    </span>
                    <strong className="mt-0.5 block text-base font-black text-slate-800 dark:text-slate-100">
                      {provider.subscription.plan} Plan
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </span>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-black ${
                        provider.subscription.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "dark:text-rose-450 bg-rose-50 text-rose-700 dark:bg-rose-950/20"
                      }`}
                    >
                      {provider.subscription.status}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Start Date
                    </span>
                    <span className="mt-0.5 block text-slate-700 dark:text-zinc-300">
                      {new Date(provider.subscription.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Expiry / Renewal Date
                    </span>
                    <span className="mt-0.5 block text-slate-700 dark:text-zinc-300">
                      {new Date(provider.subscription.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {provider.subscription.gracePeriodEnd && (
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-500">
                        Grace Period End
                      </span>
                      <span className="mt-0.5 block font-black text-amber-600">
                        {new Date(provider.subscription.gracePeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {provider.subscription.failedPaymentsCount > 0 && (
                    <div className="dark:text-rose-450 rounded-lg border border-rose-100 bg-rose-50 p-2.5 text-rose-700 dark:border-rose-950/30 dark:bg-rose-950/20">
                      <strong>Failed Renewals:</strong> {provider.subscription.failedPaymentsCount}{" "}
                      attempts recorded.
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-zinc-900">
                  No subscription history exists. Approve the provider to grant a trial plan.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Invoice / Audit Trail History */}
          <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Subscription Invoices & History
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="divide-y divide-slate-100 dark:divide-zinc-900">
                {provider.subscriptionHistory.length === 0 ? (
                  <div className="p-6 text-center text-xs italic text-slate-400">
                    No payment histories recorded.
                  </div>
                ) : (
                  provider.subscriptionHistory.map((hist) => (
                    <div
                      key={hist.id}
                      className="flex items-center justify-between p-4 text-xs hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                    >
                      <div>
                        <strong className="block text-[10px] font-black uppercase text-slate-800 dark:text-slate-200">
                          {hist.action} - {hist.plan} PLAN
                        </strong>
                        <span className="mt-0.5 block text-[10px] text-slate-500">
                          {hist.details}
                        </span>
                        <span className="text-slate-450 mt-0.5 block text-[9px]">
                          {new Date(hist.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {hist.amount && (
                        <div className="text-right font-black text-slate-900 dark:text-white">
                          ${Number(hist.amount).toFixed(2)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Documents */}
      {activeTab === "documents" && (
        <Card className="shadow-premium max-w-3xl border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Clinic Verification Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-xs text-slate-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <div>
                <strong className="mb-0.5 block text-slate-800 dark:text-slate-200">
                  Verification Integrity Check
                </strong>
                <span>
                  Super Administrators must inspect these documents before granting full scheduling
                  permission. Toggling status to APPROVED will enable this workspace for Patient
                  bookings.
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-900">
              {[
                {
                  name: "Business License & Incorporation Certification.pdf",
                  size: "2.4 MB",
                  type: "Corporation Certificate",
                },
                {
                  name: "Pharmacy Board Accreditation License.pdf",
                  size: "1.1 MB",
                  type: "Clinical Credentials",
                },
                {
                  name: "Clinical Director Medical ID Verification.jpg",
                  size: "640 KB",
                  type: "Owner Identity Verification",
                },
              ].map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between py-4 text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-500 dark:bg-zinc-900">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 dark:text-slate-200">
                        {doc.name}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {doc.type} | Size: {doc.size}
                      </span>
                    </div>
                  </div>
                  <button className="select-none font-bold text-blue-500 hover:underline">
                    Preview file
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Audit Logs */}
      {activeTab === "audit" && (
        <Card className="shadow-premium border-slate-200/80 dark:border-zinc-900 dark:bg-zinc-950">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Audit Log History Trail
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y divide-slate-100 text-xs dark:divide-zinc-900">
              {provider.auditLogs.length === 0 ? (
                <div className="p-6 text-center italic text-slate-400">
                  No audit records logged for this provider.
                </div>
              ) : (
                provider.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-4 hover:bg-slate-50/50 dark:hover:bg-zinc-900/10"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <strong className="text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
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
                      {log.ipAddress && (
                        <span className="block text-[9px] text-slate-400">IP: {log.ipAddress}</span>
                      )}
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
